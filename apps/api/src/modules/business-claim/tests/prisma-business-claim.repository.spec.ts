import { PrismaBusinessClaimRepository } from '../infrastructure/repositories/prisma-business-claim.repository'
import { PrismaService } from '../../../infrastructure/database/prisma.service'
import { BusinessClaimNotFoundException, ClaimNotPendingException } from '../domain/exceptions/business-claim.exceptions'

describe('PrismaBusinessClaimRepository', () => {
  let prisma: any
  let repository: PrismaBusinessClaimRepository

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn(async (callback: any) => callback(prisma)),
      businessClaim: {
        findUnique: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        updateMany: jest.fn(),
      },
      business: {
        update: jest.fn(),
      },
      role: {
        findFirst: jest.fn(),
      },
      user: {
        updateMany: jest.fn(),
      },
      log: {
        create: jest.fn(),
      },
    }
    repository = new PrismaBusinessClaimRepository(prisma as unknown as PrismaService)
  })

  describe('approveClaimAndTransferOwnership', () => {
    it('transfers ownership, bumps the claimant role to BUSINESS_OWNER, auto-rejects rival pending claims, and logs the change', async () => {
      prisma.businessClaim.findUnique.mockResolvedValue({
        claimId: BigInt(1),
        businessId: BigInt(2),
        userId: BigInt(5),
        status: 'pending',
        business: { name: 'Acme' },
      })
      prisma.role.findFirst.mockResolvedValue({ roleId: 2 })
      prisma.businessClaim.findMany.mockResolvedValue([
        { claimId: BigInt(3), userId: BigInt(8) },
        { claimId: BigInt(4), userId: BigInt(9) },
      ])

      const result = await repository.approveClaimAndTransferOwnership(1, 20)

      expect(result).toEqual({
        businessId: 2,
        businessName: 'Acme',
        claimantUserId: 5,
        rejectedRivalClaimantUserIds: [8, 9],
      })
      expect(prisma.businessClaim.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'approved', reviewedByUserId: BigInt(20) } }),
      )
      expect(prisma.business.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { businessId: BigInt(2) }, data: { ownerUserId: BigInt(5) } }),
      )
      expect(prisma.user.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: BigInt(5) }, data: { roleId: 2 } }),
      )
      expect(prisma.businessClaim.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { claimId: { in: [BigInt(3), BigInt(4)] } },
          data: { status: 'rejected', reviewedByUserId: BigInt(20) },
        }),
      )
      expect(prisma.log.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ action: 'BUSINESS_CLAIM_APPROVED', entityType: 'BusinessClaim' }) }),
      )
    })

    it('does not touch rival claims when none exist', async () => {
      prisma.businessClaim.findUnique.mockResolvedValue({
        claimId: BigInt(1),
        businessId: BigInt(2),
        userId: BigInt(5),
        status: 'pending',
        business: { name: 'Acme' },
      })
      prisma.role.findFirst.mockResolvedValue({ roleId: 2 })
      prisma.businessClaim.findMany.mockResolvedValue([])

      const result = await repository.approveClaimAndTransferOwnership(1, 20)

      expect(result.rejectedRivalClaimantUserIds).toEqual([])
      expect(prisma.businessClaim.updateMany).not.toHaveBeenCalled()
    })

    it('throws BUSINESS_CLAIM_NOT_FOUND for an unknown claim', async () => {
      prisma.businessClaim.findUnique.mockResolvedValue(null)

      await expect(repository.approveClaimAndTransferOwnership(999, 20)).rejects.toBeInstanceOf(BusinessClaimNotFoundException)
    })

    it('throws CLAIM_NOT_PENDING when the claim is no longer pending', async () => {
      prisma.businessClaim.findUnique.mockResolvedValue({
        claimId: BigInt(1),
        businessId: BigInt(2),
        userId: BigInt(5),
        status: 'approved',
        business: { name: 'Acme' },
      })

      await expect(repository.approveClaimAndTransferOwnership(1, 20)).rejects.toBeInstanceOf(ClaimNotPendingException)
      expect(prisma.business.update).not.toHaveBeenCalled()
    })
  })

  describe('rejectClaim', () => {
    it('sets the claim to rejected and logs the change', async () => {
      prisma.businessClaim.findUnique.mockResolvedValue({ claimId: BigInt(1), status: 'pending' })

      await repository.rejectClaim(1, 20)

      expect(prisma.businessClaim.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'rejected', reviewedByUserId: BigInt(20) } }),
      )
      expect(prisma.log.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ action: 'BUSINESS_CLAIM_REJECTED', entityType: 'BusinessClaim' }) }),
      )
    })

    it('throws CLAIM_NOT_PENDING when the claim is no longer pending', async () => {
      prisma.businessClaim.findUnique.mockResolvedValue({ claimId: BigInt(1), status: 'rejected' })

      await expect(repository.rejectClaim(1, 20)).rejects.toBeInstanceOf(ClaimNotPendingException)
    })
  })
})
