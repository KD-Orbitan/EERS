import { GetCriteriaScoresUseCase } from '../application/use-cases/get-criteria-scores.use-case'
import { ReviewRepository } from '../domain/repositories/review.repository'

describe('GetCriteriaScoresUseCase', () => {
  let reviewRepository: jest.Mocked<Pick<ReviewRepository, 'getCriteriaScores'>>
  let useCase: GetCriteriaScoresUseCase

  beforeEach(() => {
    reviewRepository = { getCriteriaScores: jest.fn() }
    useCase = new GetCriteriaScoresUseCase(reviewRepository as unknown as ReviewRepository)
  })

  it('wraps the repository result in a { criteria } envelope', async () => {
    reviewRepository.getCriteriaScores.mockResolvedValue([
      { criterionId: 1, criterionName: 'Service Quality', avgRating: 4.8, reviewCount: 12 },
      { criterionId: 2, criterionName: 'Reliability', avgRating: 0, reviewCount: 0 },
    ])

    const result = await useCase.execute({ businessId: 1 })

    expect(reviewRepository.getCriteriaScores).toHaveBeenCalledWith(1)
    expect(result).toEqual({
      criteria: [
        { criterionId: 1, criterionName: 'Service Quality', avgRating: 4.8, reviewCount: 12 },
        { criterionId: 2, criterionName: 'Reliability', avgRating: 0, reviewCount: 0 },
      ],
    })
  })
})
