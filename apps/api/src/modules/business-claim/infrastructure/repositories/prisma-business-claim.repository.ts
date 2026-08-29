import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../infrastructure/database/prisma.service'
import { BusinessClaimRepository } from '../../domain/repositories/business-claim.repository'
import { BusinessClaimNotFoundException, ClaimNotPendingException } from '../../domain/exceptions/business-claim.exceptions'

@Injectable()
export class PrismaBusinessClaimRepository extends BusinessClaimRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findPendingByUserAndBusiness(userId: number, businessId: number) {
    const claim = await this.prisma.businessClaim.findFirst({
      where: { userId: BigInt(userId), businessId: BigInt(businessId), status: 'pending' },
    })
    return claim ? { claimId: Number(claim.claimId) } : null
  }

  async createClaim(params: { userId: number; businessId: number; message: string }) {
    const claim = await this.prisma.businessClaim.create({
      data: {
        userId: BigInt(params.userId),
        businessId: BigInt(params.businessId),
        message: params.message,
      },
    })
    return { claimId: Number(claim.claimId), status: claim.status }
  }

  async findMyClaims(userId: number, page: number, limit: number) {
    const where = { userId: BigInt(userId) }
    const [claims, total] = await Promise.all([
      this.prisma.businessClaim.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { business: true },
      }),
      this.prisma.businessClaim.count({ where }),
    ])

    return {
      items: claims.map((claim) => ({
        claimId: Number(claim.claimId),
        businessId: Number(claim.businessId),
        businessName: claim.business.name,
        status: claim.status,
        message: claim.message,
        createdAt: claim.createdAt.toISOString(),
      })),
      total,
    }
  }

  async findById(claimId: number) {
    const claim = await this.prisma.businessClaim.findUnique({
      where: { claimId: BigInt(claimId) },
      include: { business: true },
    })

    if (!claim) {
      return null
    }

    return {
      claimId: Number(claim.claimId),
      businessId: Number(claim.businessId),
      businessName: claim.business.name,
      userId: Number(claim.userId),
      status: claim.status,
      message: claim.message,
      createdAt: claim.createdAt.toISOString(),
    }
  }

  async findAdminClaims(page: number, limit: number, status?: string) {
    const where = status ? { status: status as any } : {}
    const [claims, total] = await Promise.all([
      this.prisma.businessClaim.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { business: true, user: true },
      }),
      this.prisma.businessClaim.count({ where }),
    ])

    return {
      items: claims.map((claim) => ({
        claimId: Number(claim.claimId),
        businessId: Number(claim.businessId),
        businessName: claim.business.name,
        claimantName: claim.user.name,
        message: claim.message,
        status: claim.status,
        createdAt: claim.createdAt.toISOString(),
      })),
      total,
    }
  }

  async withdrawClaim(claimId: number) {
    await this.prisma.businessClaim.delete({ where: { claimId: BigInt(claimId) } })
  }

  async rejectClaim(claimId: number, reviewerUserId: number) {
    await this.prisma.$transaction(async (tx) => {
      const claim = await tx.businessClaim.findUnique({ where: { claimId: BigInt(claimId) } })
      if (!claim) {
        throw new BusinessClaimNotFoundException()
      }
      if (claim.status !== 'pending') {
        throw new ClaimNotPendingException()
      }

      await tx.businessClaim.update({
        where: { claimId: claim.claimId },
        data: { status: 'rejected', reviewedByUserId: BigInt(reviewerUserId) },
      })

      await tx.log.create({
        data: {
          action: 'BUSINESS_CLAIM_REJECTED',
          entityType: 'BusinessClaim',
          entityId: claim.claimId,
          userId: BigInt(reviewerUserId),
        },
      })
    })
  }

  async approveClaimAndTransferOwnership(claimId: number, reviewerUserId: number) {
    return this.prisma.$transaction(async (tx) => {
      const claim = await tx.businessClaim.findUnique({
        where: { claimId: BigInt(claimId) },
        include: { business: true },
      })
      if (!claim) {
        throw new BusinessClaimNotFoundException()
      }
      if (claim.status !== 'pending') {
        throw new ClaimNotPendingException()
      }

      await tx.businessClaim.update({
        where: { claimId: claim.claimId },
        data: { status: 'approved', reviewedByUserId: BigInt(reviewerUserId) },
      })

      await tx.business.update({
        where: { businessId: claim.businessId },
        data: { ownerUserId: claim.userId },
      })

      const businessOwnerRole = await tx.role.findFirst({ where: { roleName: 'BUSINESS_OWNER' } })
      if (businessOwnerRole) {
        await tx.user.updateMany({
          where: { userId: claim.userId },
          data: { roleId: businessOwnerRole.roleId },
        })
      }

      const rivalClaims = await tx.businessClaim.findMany({
        where: { businessId: claim.businessId, status: 'pending', claimId: { not: claim.claimId } },
        select: { claimId: true, userId: true },
      })

      if (rivalClaims.length > 0) {
        await tx.businessClaim.updateMany({
          where: { claimId: { in: rivalClaims.map((rival) => rival.claimId) } },
          data: { status: 'rejected', reviewedByUserId: BigInt(reviewerUserId) },
        })
      }

      await tx.log.create({
        data: {
          action: 'BUSINESS_CLAIM_APPROVED',
          entityType: 'BusinessClaim',
          entityId: claim.claimId,
          userId: BigInt(reviewerUserId),
          newData: { businessId: Number(claim.businessId), newOwnerUserId: Number(claim.userId) },
        },
      })

      return {
        businessId: Number(claim.businessId),
        businessName: claim.business.name,
        claimantUserId: Number(claim.userId),
        rejectedRivalClaimantUserIds: rivalClaims.map((rival) => Number(rival.userId)),
      }
    })
  }
}
