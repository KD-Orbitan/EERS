import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../infrastructure/database/prisma.service'
import { ReviewNotFoundException, ReviewNotPendingException } from '../../../review/domain/exceptions/review.exceptions'

@Injectable()
export class RejectReviewUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute({ reviewId, currentUserId, reason }: { reviewId: number; currentUserId: number; reason: string }) {
    const review = await this.prisma.review.findFirst({
      where: { reviewId, deletedAt: null },
      select: { reviewId: true, status: true },
    })

    if (!review) {
      throw new ReviewNotFoundException()
    }

    if (review.status !== 'pending') {
      throw new ReviewNotPendingException()
    }

    await this.prisma.review.update({
      where: { reviewId },
      data: { status: 'rejected', managedByUserId: currentUserId },
    })

    return { reviewId, status: 'rejected' as const }
  }
}
