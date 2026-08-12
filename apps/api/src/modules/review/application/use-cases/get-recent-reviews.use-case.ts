import { Injectable } from '@nestjs/common'
import { ReviewRepository } from '../../domain/repositories/review.repository'

@Injectable()
export class GetRecentReviewsUseCase {
  constructor(private readonly reviewRepository: ReviewRepository) {}

  async execute({ limit }: { limit: number }) {
    return this.reviewRepository.getRecentReviews(limit)
  }
}
