import { Injectable } from '@nestjs/common'
import { ReviewRepository } from '../../domain/repositories/review.repository'

@Injectable()
export class GetSentimentSummaryUseCase {
  constructor(private readonly reviewRepository: ReviewRepository) {}

  async execute({ businessId }: { businessId: number }) {
    return this.reviewRepository.getSentimentSummary(businessId)
  }
}
