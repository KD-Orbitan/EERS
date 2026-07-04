import { Injectable } from '@nestjs/common'
import { ReviewRepository } from '../../domain/repositories/review.repository'

@Injectable()
export class GetReviewStatisticsUseCase {
  constructor(private readonly reviewRepository: ReviewRepository) {}

  async execute({ businessId }: { businessId: number }) {
    return this.reviewRepository.getReviewStatistics(businessId)
  }
}
