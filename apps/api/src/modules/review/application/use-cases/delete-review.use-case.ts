import { Injectable, ForbiddenException } from '@nestjs/common'
import { ReviewRepository } from '../../domain/repositories/review.repository'
import { ReviewNotFoundException } from '../../domain/exceptions/review.exceptions'

@Injectable()
export class DeleteReviewUseCase {
  constructor(
    private readonly reviewRepository: ReviewRepository,
  ) {}

  async execute({ reviewId, currentUserId, currentUserRole }: { reviewId: number; currentUserId: number; currentUserRole: string }) {
    const review = await this.reviewRepository.findById(reviewId)
    if (!review || review.deletedAt) {
      throw new ReviewNotFoundException()
    }

    if (currentUserRole !== 'ADMIN' && review.writerUserId !== currentUserId) {
      throw new ForbiddenException('Forbidden')
    }

    await this.reviewRepository.softDeleteReviewWithAudit(reviewId, currentUserId)
  }
}
