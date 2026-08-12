import { GetSentimentSummaryUseCase } from '../application/use-cases/get-sentiment-summary.use-case'
import { ReviewRepository } from '../domain/repositories/review.repository'

describe('GetSentimentSummaryUseCase', () => {
  let reviewRepository: jest.Mocked<Pick<ReviewRepository, 'getSentimentSummary'>>
  let useCase: GetSentimentSummaryUseCase

  beforeEach(() => {
    reviewRepository = { getSentimentSummary: jest.fn() }
    useCase = new GetSentimentSummaryUseCase(reviewRepository as unknown as ReviewRepository)
  })

  it('delegates to the repository and returns the sentiment summary', async () => {
    reviewRepository.getSentimentSummary.mockResolvedValue({ positive: 90, neutral: 8, negative: 2, totalReviews: 50 })

    const result = await useCase.execute({ businessId: 1 })

    expect(reviewRepository.getSentimentSummary).toHaveBeenCalledWith(1)
    expect(result).toEqual({ positive: 90, neutral: 8, negative: 2, totalReviews: 50 })
  })
})
