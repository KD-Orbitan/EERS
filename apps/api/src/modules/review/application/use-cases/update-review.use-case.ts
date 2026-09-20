import { Injectable, ForbiddenException } from '@nestjs/common'
import { ReviewRepository } from '../../domain/repositories/review.repository'
import { ReviewNotFoundException, InvalidRatingException, InvalidCriterionException } from '../../domain/exceptions/review.exceptions'

@Injectable()
export class UpdateReviewUseCase {
  constructor(
    private readonly reviewRepository: ReviewRepository,
  ) {}

  async execute({ reviewId, currentUserId, currentUserRole, dto }: { reviewId: number; currentUserId: number; currentUserRole: string; dto: { overallRating?: number; content?: string; criteriaRatings?: Array<{ criterionId: number; ratingValue: number }> } }) {
    const review = await this.reviewRepository.findById(reviewId)
    if (!review || review.deletedAt) {
      throw new ReviewNotFoundException()
    }

    if (currentUserRole !== 'ADMIN' && review.writerUserId !== currentUserId) {
      throw new ForbiddenException('Forbidden')
    }

    if (dto.overallRating !== undefined) {
      if (!Number.isInteger(dto.overallRating) || dto.overallRating < 1 || dto.overallRating > 5) {
        throw new InvalidRatingException()
      }
    }

    if (dto.criteriaRatings) {
      const validCriteria = await this.reviewRepository.findBusinessCriteria(review.businessId)
      const validCriterionIds = new Set(validCriteria.map((item) => item.criterionId))
      for (const criterion of dto.criteriaRatings) {
        if (!validCriterionIds.has(criterion.criterionId)) {
          throw new InvalidCriterionException()
        }
        if (!Number.isInteger(criterion.ratingValue) || criterion.ratingValue < 1 || criterion.ratingValue > 5) {
          throw new InvalidRatingException()
        }
      }
    }

    return this.reviewRepository.updateReviewWithCriteria(reviewId, {
      overallRating: dto.overallRating,
      content: dto.content,
      criteriaRatings: dto.criteriaRatings,
    })
  }
}
