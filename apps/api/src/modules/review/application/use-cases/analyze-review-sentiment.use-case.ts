import { Injectable } from '@nestjs/common'
import { ReviewRepository } from '../../domain/repositories/review.repository'
import { ReviewNotFoundException, SentimentAnalysisUnavailableException } from '../../domain/exceptions/review.exceptions'
import { SentimentService } from '../../../../infrastructure/ml/sentiment.service'

@Injectable()
export class AnalyzeReviewSentimentUseCase {
  constructor(
    private readonly reviewRepository: ReviewRepository,
    private readonly sentimentService: SentimentService,
  ) {}

  async execute({ reviewId }: { reviewId: number }) {
    const review = await this.reviewRepository.findById(reviewId)
    if (!review) {
      throw new ReviewNotFoundException()
    }

    const result = await this.sentimentService.analyze(review.content)
    if (!result) {
      throw new SentimentAnalysisUnavailableException()
    }

    const sentimentAnalyzedAt = new Date()
    await this.reviewRepository.updateSentiment(reviewId, {
      sentiment: result.type,
      sentimentScore: result.score,
      sentimentAnalyzedAt,
    })

    return {
      sentiment: result.type,
      score: result.score,
      analyzedAt: sentimentAnalyzedAt.toISOString(),
    }
  }
}
