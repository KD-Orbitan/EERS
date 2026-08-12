import { RankingController } from '../presentation/controllers/ranking.controller'

describe('RankingController', () => {
  it('wraps GET /rankings in a flat { success, data, meta } envelope (no double-nesting)', async () => {
    const items = [{ rank: 1, businessId: 1, businessName: 'Biz', avgRating: 4.5, reviewCount: 10, rankingScore: 90 }]
    const getGlobalRankingUseCase = { execute: jest.fn().mockResolvedValue({ items, total: 42 }) } as any
    const controller = new RankingController(getGlobalRankingUseCase, {} as any, {} as any, {} as any, {} as any)

    const result = await controller.getGlobalRanking({ page: 1, limit: 20 })

    expect(result).toEqual({
      success: true,
      data: items,
      meta: { page: 1, limit: 20, total: 42, totalPages: 3 },
    })
    // Regression guard: `data` must be the flat items array, not { data, meta } nested again.
    expect(Array.isArray(result.data)).toBe(true)
  })
})
