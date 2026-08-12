import { GetMarketCompetitorsUseCase } from '../application/use-cases/get-market-competitors.use-case'
import { PrismaService } from '../../../infrastructure/database/prisma.service'

describe('GetMarketCompetitorsUseCase', () => {
  let prisma: {
    rankingSnapshot: { findMany: jest.Mock }
    category: { findUnique: jest.Mock }
  }
  let useCase: GetMarketCompetitorsUseCase

  beforeEach(() => {
    prisma = {
      rankingSnapshot: { findMany: jest.fn() },
      category: { findUnique: jest.fn() },
    }
    useCase = new GetMarketCompetitorsUseCase(prisma as unknown as PrismaService)
  })

  it('returns an empty result when the business has no CATEGORY-scope ranking yet', async () => {
    prisma.rankingSnapshot.findMany.mockResolvedValueOnce([])

    const result = await useCase.execute({ businessId: 1 })

    expect(result).toEqual({ categoryId: null, categoryName: null, businessRank: null, competitors: [] })
    expect(prisma.category.findUnique).not.toHaveBeenCalled()
  })

  it('defaults to the category with the business\'s best rank and returns nearest-ranked competitors', async () => {
    prisma.rankingSnapshot.findMany
      .mockResolvedValueOnce([
        { scopeId: BigInt(1), rank: 2 },
        { scopeId: BigInt(2), rank: 5 },
      ])
      .mockResolvedValueOnce([
        { businessId: BigInt(10), rank: 1, rankingScore: 9.1, avgRating: 4.9, business: { name: 'Nexus Corp' } },
        { businessId: BigInt(11), rank: 4, rankingScore: 8.0, avgRating: 4.5, business: { name: 'Far Away Co' } },
        { businessId: BigInt(12), rank: 3, rankingScore: 8.5, avgRating: 4.7, business: { name: 'Orbit Logistics' } },
      ])
    prisma.category.findUnique.mockResolvedValue({ categoryId: 1, categoryName: 'Logistics' })

    const result = await useCase.execute({ businessId: 1, limit: 2 })

    expect(result.categoryId).toBe(1)
    expect(result.categoryName).toBe('Logistics')
    expect(result.businessRank).toBe(2)
    // nearest to rank 2: rank 1 (distance 1), rank 3 (distance 1) beat rank 4 (distance 2)
    expect(result.competitors).toHaveLength(2)
    expect(result.competitors.map((c) => c.businessName)).toEqual(['Nexus Corp', 'Orbit Logistics'])
  })
})
