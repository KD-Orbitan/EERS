import { BusinessReviewController } from '../presentation/controllers/business-review.controller'

describe('BusinessReviewController', () => {
  it('wraps GET /businesses/:businessId/reviews in a flat { success, data, meta } envelope', async () => {
    const items = [{ reviewId: 1, overallRating: 4, content: 'Great', status: 'approved', sentiment: null, author: { userId: 2, name: 'Reviewer' }, criteriaRatings: [], photos: [], reply: null, createdAt: '2026-01-01T00:00:00.000Z' }]
    const getBusinessReviewsUseCase = { execute: jest.fn().mockResolvedValue({ items, total: 25 }) } as any
    const controller = new BusinessReviewController(getBusinessReviewsUseCase, {} as any, {} as any, {} as any)

    const result = await controller.getBusinessReviews(1, { page: 1, limit: 20 } as any, undefined)

    expect(getBusinessReviewsUseCase.execute).toHaveBeenCalledWith({ businessId: 1, currentUser: undefined, query: { page: 1, limit: 20 } })
    expect(result).toEqual({
      success: true,
      data: items,
      meta: { page: 1, limit: 20, total: 25, totalPages: 2 },
    })
  })
})
