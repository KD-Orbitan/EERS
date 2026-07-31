import { Injectable } from '@nestjs/common'
import { ReviewRepository } from '../../domain/repositories/review.repository'

@Injectable()
export class GetApprovedReviewsUseCase {
  constructor(private readonly reviewRepository: ReviewRepository) {}

  async execute() {
    return this.reviewRepository.getApprovedReviews()
  }
}
