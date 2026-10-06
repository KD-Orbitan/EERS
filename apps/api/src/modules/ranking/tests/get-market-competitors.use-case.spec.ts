import { GetMarketCompetitorsUseCase } from '../application/use-cases/get-market-competitors.use-case'
import { RankingQueryRepository } from '../application/ports/ranking-query.repository'

describe('GetMarketCompetitorsUseCase', () => {
  let repository: jest.Mocked<Pick<RankingQueryRepository, 'getBusinessCategoryRanks' | 'getCategoryName' | 'getCategoryCompetitors'>>
  let useCase: GetMarketCompetitorsUseCase

  beforeEach(() => {
    repository = { getBusinessCategoryRanks: jest.fn(), getCategoryName: jest.fn(), getCategoryCompetitors: jest.fn() }
    useCase = new GetMarketCompetitorsUseCase(repository as unknown as RankingQueryRepository)
  })

  it('returns an empty result when the business has no CATEGORY-scope ranking yet', async () => {
    repository.getBusinessCategoryRanks.mockResolvedValueOnce([])

    const result = await useCase.execute({ businessId: 1 })

    expect(result).toEqual({ categoryId: null, categoryName: null, businessRank: null, competitors: [] })
    expect(repository.getCategoryName).not.toHaveBeenCalled()
  })

  it('defaults to the category with the business\'s best rank and returns nearest-ranked competitors', async () => {
    repository.getBusinessCategoryRanks
      .mockResolvedValueOnce([
        { scopeId: 1, rank: 2 },
        { scopeId: 2, rank: 5 },
      ])
    repository.getCategoryCompetitors.mockResolvedValueOnce([
        { businessId: 10, rank: 1, rankingScore: 9.1, avgRating: 4.9, businessName: 'Nexus Corp' },
        { businessId: 11, rank: 4, rankingScore: 8.0, avgRating: 4.5, businessName: 'Far Away Co' },
        { businessId: 12, rank: 3, rankingScore: 8.5, avgRating: 4.7, businessName: 'Orbit Logistics' },
      ])
    repository.getCategoryName.mockResolvedValue('Logistics')

    const result = await useCase.execute({ businessId: 1, limit: 2 })

    expect(result.categoryId).toBe(1)
    expect(result.categoryName).toBe('Logistics')
    expect(result.businessRank).toBe(2)
    // nearest to rank 2: rank 1 (distance 1), rank 3 (distance 1) beat rank 4 (distance 2)
    expect(result.competitors).toHaveLength(2)
    expect(result.competitors.map((c) => c.businessName)).toEqual(['Nexus Corp', 'Orbit Logistics'])
  })
})
