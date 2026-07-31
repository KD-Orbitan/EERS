import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../infrastructure/database/prisma.service'
import { BusinessNotFoundException, BusinessNotPendingException } from '../../../business/domain/exceptions/business.exceptions'

@Injectable()
export class ApproveBusinessUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute({ businessId, currentUserId }: { businessId: number; currentUserId: number }) {
    const business = await this.prisma.business.findFirst({
      where: { businessId, deletedAt: null },
      select: { businessId: true, ownerUserId: true, status: true },
    })

    if (!business) {
      throw new BusinessNotFoundException()
    }

    if (business.status !== 'pending') {
      throw new BusinessNotPendingException()
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.business.update({
        where: { businessId },
        data: { status: 'approved', approvedByUserId: currentUserId },
      })

      const businessOwnerRole = await tx.role.findFirst({ where: { roleName: 'BUSINESS_OWNER' } })
      if (businessOwnerRole) {
        await tx.user.updateMany({
          where: { userId: business.ownerUserId },
          data: { roleId: businessOwnerRole.roleId },
        })
      }

      return { businessId, status: 'approved' as const }
    })
  }
}
