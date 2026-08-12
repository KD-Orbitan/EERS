import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../infrastructure/database/prisma.service'
import { ReviewNotFoundException, ReviewNotPendingException } from '../../../review/domain/exceptions/review.exceptions'
import { CreateNotificationUseCase } from '../../../notification/application/use-cases/create-notification.use-case'
import { NOTIFICATION_TYPE } from '@eers/shared-constants'

@Injectable()
export class ApproveReviewUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly createNotificationUseCase: CreateNotificationUseCase,
  ) {}

  async execute({ reviewId, currentUserId }: { reviewId: number; currentUserId: number }) {
    const review = await this.prisma.review.findFirst({
      where: { reviewId, deletedAt: null },
      select: { reviewId: true, status: true, writerUserId: true },
    })

    if (!review) {
      throw new ReviewNotFoundException()
    }

    if (review.status !== 'pending') {
      throw new ReviewNotPendingException()
    }

    await this.prisma.review.update({
      where: { reviewId },
      data: { status: 'approved', managedByUserId: currentUserId },
    })

    await this.createNotificationUseCase.execute({
      userId: Number(review.writerUserId),
      type: NOTIFICATION_TYPE.REVIEW_APPROVED,
      title: 'Review Approved',
      content: 'Your review has been approved.',
    })

    return { reviewId, status: 'approved' as const }
  }
}
