import { Injectable, ForbiddenException } from '@nestjs/common'
import { ReviewRepository } from '../../domain/repositories/review.repository'
import { ReviewNotFoundException } from '../../domain/exceptions/review.exceptions'
import { PrismaService } from '../../../../infrastructure/database/prisma.service'

@Injectable()
export class DeleteReviewUseCase {
  constructor(
    private readonly reviewRepository: ReviewRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute({ reviewId, currentUserId, currentUserRole }: { reviewId: number; currentUserId: number; currentUserRole: string }) {
    const review = await this.reviewRepository.findById(reviewId)
    if (!review || review.deletedAt) {
      throw new ReviewNotFoundException()
    }

    if (currentUserRole !== 'ADMIN' && review.writerUserId !== currentUserId) {
      throw new ForbiddenException('Forbidden')
    }

    await this.prisma.$transaction(async (tx) => {
      await this.reviewRepository.softDeleteReview(reviewId)
      await tx.log.create({
        data: {
          action: 'REVIEW_DELETED',
          entityType: 'Review',
          entityId: BigInt(reviewId),
          userId: BigInt(currentUserId),
        },
      })
    })
  }
}
