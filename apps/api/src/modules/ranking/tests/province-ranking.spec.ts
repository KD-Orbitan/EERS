import { PrismaRankingQueryRepository } from '../infrastructure/repositories/prisma-ranking-query.repository'
import { GetGlobalRankingUseCase } from '../application/use-cases/get-global-ranking.use-case'
import { GetTopBusinessesUseCase } from '../application/use-cases/get-top-businesses.use-case'

describe('Ranking province selection', () => {
  it('filters canonical and legacy province names before pagination, including a category filter', async () => {
    const snapshot = (businessId: number, province: string) => ({ businessId, rank: 1, avgRating: 4, reviewCount: 5, rankingScore: 4, business: { name: `Business ${businessId}`, locations: [{ location: { province } }] } })
    const db = { rankingSnapshot: { findMany: jest.fn().mockResolvedValue([
      snapshot(1, 'Hà Nội'), snapshot(2, 'Thành phố Hồ Chí Minh'), snapshot(3, 'Hồ Chí Minh'),
    ]) } }
    const cache = { getCachedRanking: jest.fn().mockResolvedValue([{ businessId: 1 }]), setCachedRanking: jest.fn() }
    const global = new GetGlobalRankingUseCase(new PrismaRankingQueryRepository(db as any), cache as any, {} as any)
    const top = new GetTopBusinessesUseCase(new PrismaRankingQueryRepository(db as any), cache as any)
    const result = await global.execute({ categoryId: 4, province: 'Hồ Chí Minh', limit: 1 })
    expect(result.total).toBe(2)
    expect(result.items.map((item) => item.businessId)).toEqual([2])
    expect((await top.execute({ categoryId: 4, province: 'Hồ Chí Minh', limit: 1 })).map((item) => item.businessId)).toEqual([2])
    expect(cache.getCachedRanking).not.toHaveBeenCalled()
    expect(cache.setCachedRanking).not.toHaveBeenCalled()
    expect(db.rankingSnapshot.findMany).toHaveBeenLastCalledWith(expect.objectContaining({ where: { scope: 'CATEGORY', scopeId: 4n } }))
    expect(db.rankingSnapshot.findMany.mock.calls[1][0]).not.toHaveProperty('take')
  })
})
