import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../infrastructure/database/prisma.service'
import { ReviewNotFoundException, ReviewNotPendingException } from '../../../review/domain/exceptions/review.exceptions'
import { CreateNotificationUseCase } from '../../../notification/application/use-cases/create-notification.use-case'
import { NOTIFICATION_TYPE } from '@eers/shared-constants'

@Injectable()
export class RejectReviewUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly createNotificationUseCase: CreateNotificationUseCase,
  ) {}

  async execute({ reviewId, currentUserId, reason }: { reviewId: number; currentUserId: number; reason: string }) {
    const review = await this.prisma.review.findFirst({
      where: { reviewId, deletedAt: null },
      select: { reviewId: true, businessId: true, status: true, writerUserId: true },
    })

    if (!review) {
      throw new ReviewNotFoundException()
    }

    if (review.status !== 'pending') {
      throw new ReviewNotPendingException()
    }

    const moderatedAt = new Date()
    const moderationReason = reason.trim()
    await this.prisma.$transaction(async (tx) => {
      const updated = await tx.review.updateMany({
        where: { reviewId, status: 'pending', deletedAt: null },
        data: { status: 'rejected', managedByUserId: currentUserId, moderatedAt, moderationReason },
      })
      if (updated.count === 0) throw new ReviewNotPendingException()
      await tx.log.create({
        data: {
          action: 'REVIEW_REJECTED', entityType: 'Review',
          entityId: BigInt(reviewId), userId: BigInt(currentUserId),
          oldData: { status: 'pending' },
          newData: { status: 'rejected', moderationReason, moderatedAt: moderatedAt.toISOString() },
        },
      })
    })

    await this.createNotificationUseCase.execute({
      userId: Number(review.writerUserId),
      type: NOTIFICATION_TYPE.REVIEW_REJECTED,
      targetPath: '/reviews/my',
      title: 'Review Rejected',
      content: `Your review has been rejected. Reason: ${moderationReason}`,
    })
    return { reviewId, status: 'rejected' as const }
  }
}
