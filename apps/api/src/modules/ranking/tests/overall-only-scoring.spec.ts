import { MultiCriteriaScoringService } from '../application/services/multi-criteria-scoring.service'

describe('Overall-only review scoring', () => {
  const db = {
    getReviewCriteriaByReviewIds: jest.fn(),
    getCriterionWeightsByCategoryIds: jest.fn(),
  }
  const service = new MultiCriteriaScoringService(db as any)

  it.each([[1, 0], [3, 0.5], [5, 1]])('uses overall rating %i as score %f', async (rating, expected) => {
    db.getReviewCriteriaByReviewIds.mockResolvedValue([])
    await expect(service.computeScore(1, [1], rating)).resolves.toBe(expected)
  })

  it('continues using criterion scores when present', async () => {
    db.getReviewCriteriaByReviewIds.mockResolvedValue([{ criterionId: 1, ratingValue: 3 }])
    db.getCriterionWeightsByCategoryIds.mockResolvedValue([{ criterionId: 1, weight: 1 }])
    await expect(service.computeScore(1, [1], 5)).resolves.toBe(0.5)
  })
})
