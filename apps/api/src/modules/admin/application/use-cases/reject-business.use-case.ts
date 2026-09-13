import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../infrastructure/database/prisma.service'
import { BusinessNotFoundException, BusinessNotPendingException } from '../../../business/domain/exceptions/business.exceptions'
import { CreateNotificationUseCase } from '../../../notification/application/use-cases/create-notification.use-case'
import { NOTIFICATION_TYPE } from '@eers/shared-constants'

@Injectable()
export class RejectBusinessUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly createNotificationUseCase: CreateNotificationUseCase,
  ) {}

  async execute({ businessId, currentUserId, reason }: { businessId: number; currentUserId: number; reason: string }) {
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

    await this.prisma.business.update({
      where: { businessId },
      data: { status: 'rejected' },
    })

    if (business.ownerUserId !== null) {
      await this.createNotificationUseCase.execute({
        userId: Number(business.ownerUserId),
        type: NOTIFICATION_TYPE.BUSINESS_REJECTED,
        targetPath: `/businesses/${businessId}/edit`,
        title: 'Business Rejected',
        content: `Your business "${business.name}" was rejected. Reason: ${reason}`,
      })
    }

    return { businessId, status: 'rejected' as const }
  }
}
