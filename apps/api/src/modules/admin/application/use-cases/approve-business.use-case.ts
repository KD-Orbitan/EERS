import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../infrastructure/database/prisma.service'
import { BusinessNotFoundException, BusinessNotPendingException } from '../../../business/domain/exceptions/business.exceptions'
import { CreateNotificationUseCase } from '../../../notification/application/use-cases/create-notification.use-case'
import { NOTIFICATION_TYPE } from '@eers/shared-constants'

@Injectable()
export class ApproveBusinessUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly createNotificationUseCase: CreateNotificationUseCase,
  ) {}

  async execute({ businessId, currentUserId }: { businessId: number; currentUserId: number }) {
    const business = await this.prisma.business.findFirst({
      where: { businessId, deletedAt: null },
      select: { businessId: true, name: true, ownerUserId: true, status: true },
    })

    if (!business) {
      throw new BusinessNotFoundException()
    }

    if (business.status !== 'pending') {
      throw new BusinessNotPendingException()
    }

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.business.update({
        where: { businessId },
        data: { status: 'approved', approvedByUserId: currentUserId },
      })

      if (business.ownerUserId !== null) {
        const businessOwnerRole = await tx.role.findFirst({ where: { roleName: 'BUSINESS_OWNER' } })
        if (businessOwnerRole) {
          await tx.user.updateMany({
            where: { userId: business.ownerUserId },
            data: { roleId: businessOwnerRole.roleId },
          })
        }
      }

      return { businessId, status: 'approved' as const }
    })

    if (business.ownerUserId !== null) {
      await this.createNotificationUseCase.execute({
        userId: Number(business.ownerUserId),
        type: NOTIFICATION_TYPE.BUSINESS_APPROVED,
        title: 'Business Approved',
        content: `Your business "${business.name}" has been approved.`,
      })
    }

    return result
  }
}
