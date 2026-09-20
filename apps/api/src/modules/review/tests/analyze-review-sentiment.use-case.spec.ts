import { AnalyzeReviewSentimentUseCase } from '../application/use-cases/analyze-review-sentiment.use-case'
import { ReviewRepository } from '../domain/repositories/review.repository'
import { ReviewNotFoundException, SentimentAnalysisUnavailableException } from '../domain/exceptions/review.exceptions'
import { SentimentAnalyzer } from '../../../common/ports/sentiment-analyzer.port'

describe('AnalyzeReviewSentimentUseCase', () => {
  let reviewRepository: jest.Mocked<Pick<ReviewRepository, 'findById' | 'updateSentiment'>>
  let sentimentService: jest.Mocked<Pick<SentimentAnalyzer, 'analyze'>>
  let useCase: AnalyzeReviewSentimentUseCase

  beforeEach(() => {
    reviewRepository = {
      findById: jest.fn(),
      updateSentiment: jest.fn(),
    }
    sentimentService = {
      analyze: jest.fn(),
    }
    useCase = new AnalyzeReviewSentimentUseCase(
      reviewRepository as unknown as ReviewRepository,
      sentimentService as unknown as SentimentAnalyzer,
    )
  })

  it('analyzes review content and persists sentiment, score, and timestamp', async () => {
    reviewRepository.findById.mockResolvedValue({ reviewId: 1, content: 'Great place, loved it', deletedAt: null } as any)
    sentimentService.analyze.mockResolvedValue({ type: 'positive', score: 0.9523 })

    const result = await useCase.execute({ reviewId: 1 })

    expect(sentimentService.analyze).toHaveBeenCalledWith('Great place, loved it')
    expect(reviewRepository.updateSentiment).toHaveBeenCalledWith(1, {
      sentiment: 'positive',
      sentimentScore: 0.9523,
      sentimentAnalyzedAt: expect.any(Date),
    })
    expect(result).toEqual({ sentiment: 'positive', score: 0.9523, analyzedAt: expect.any(String) })
  })

  it('throws REVIEW_NOT_FOUND for missing or deleted review', async () => {
    reviewRepository.findById.mockResolvedValue(null)

    await expect(useCase.execute({ reviewId: 99 })).rejects.toBeInstanceOf(ReviewNotFoundException)
    expect(sentimentService.analyze).not.toHaveBeenCalled()
  })

  it('throws SENTIMENT_ANALYSIS_UNAVAILABLE when the model failed to load or infer', async () => {
    reviewRepository.findById.mockResolvedValue({ reviewId: 1, content: 'Great place, loved it', deletedAt: null } as any)
    sentimentService.analyze.mockResolvedValue(null)

    await expect(useCase.execute({ reviewId: 1 })).rejects.toBeInstanceOf(SentimentAnalysisUnavailableException)
    expect(reviewRepository.updateSentiment).not.toHaveBeenCalled()
  })
})
