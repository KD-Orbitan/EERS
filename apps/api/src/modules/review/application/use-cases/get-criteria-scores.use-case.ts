import { Injectable } from '@nestjs/common'
import { ReviewRepository } from '../../domain/repositories/review.repository'

@Injectable()
export class GetCriteriaScoresUseCase {
  constructor(private readonly reviewRepository: ReviewRepository) {}

  async execute({ businessId }: { businessId: number }) {
    const criteria = await this.reviewRepository.getCriteriaScores(businessId)
    return { criteria }
  }
}
