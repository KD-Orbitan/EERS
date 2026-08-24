import { ReviewController } from '../presentation/controllers/review.controller'

describe('ReviewController', () => {
  it('wraps GET /reviews/my in a flat { success, data, meta } envelope', async () => {
    const items = [{ reviewId: 1, overallRating: 5, status: 'approved', business: { businessId: 1, name: 'Biz' }, createdAt: '2026-01-01T00:00:00.000Z' }]
    const getMyReviewsUseCase = { execute: jest.fn().mockResolvedValue({ items, total: 5 }) } as any
    const controller = new ReviewController(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      getMyReviewsUseCase,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    )

    const result = await controller.getMyReviews({ userId: 7 }, { page: 1, limit: 2 })

    expect(getMyReviewsUseCase.execute).toHaveBeenCalledWith({ userId: 7, page: 1, limit: 2 })
    expect(result).toEqual({
      success: true,
      data: items,
      meta: { page: 1, limit: 2, total: 5, totalPages: 3 },
    })
  })

  it('coerces string page/limit query params to numbers for meta', async () => {
    const getMyReviewsUseCase = { execute: jest.fn().mockResolvedValue({ items: [], total: 0 }) } as any
    const controller = new ReviewController(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      getMyReviewsUseCase,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    )

    const result = await controller.getMyReviews({ userId: 7 }, { page: '2' as any, limit: '10' as any })

    expect(result.meta).toEqual({ page: 2, limit: 10, total: 0, totalPages: 0 })
  })

  it('GET /reviews/recent returns the bare array with a clamped default limit', async () => {
    const items = [{ reviewId: 1, overallRating: 5, content: 'Great!', author: { name: 'Alice' }, business: { businessId: 1, name: 'Biz' }, createdAt: '2026-01-01T00:00:00.000Z' }]
    const getRecentReviewsUseCase = { execute: jest.fn().mockResolvedValue(items) } as any
    const controller = new ReviewController(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      getRecentReviewsUseCase,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    )

    const result = await controller.getRecentReviews(undefined as any)

    expect(getRecentReviewsUseCase.execute).toHaveBeenCalledWith({ limit: 6 })
    expect(result).toBe(items)
  })

  it('GET /reviews/recent clamps an oversized limit to 20', async () => {
    const getRecentReviewsUseCase = { execute: jest.fn().mockResolvedValue([]) } as any
    const controller = new ReviewController(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      getRecentReviewsUseCase,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    )

    await controller.getRecentReviews('500')

    expect(getRecentReviewsUseCase.execute).toHaveBeenCalledWith({ limit: 20 })
  })
})
