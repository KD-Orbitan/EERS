import { JwtService } from '@nestjs/jwt'
import { BusinessController } from '../presentation/controllers/business.controller'

describe('BusinessController', () => {
  it('normalizes jwt payload sub into userId for optional auth', () => {
    const jwtService = { verify: jest.fn().mockReturnValue({ sub: 42, role: 'BUSINESS_OWNER' }) } as unknown as JwtService
    const controller = new BusinessController(
      jwtService,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    )

    const req = { headers: { authorization: 'Bearer token' } }
    const result = (controller as any).getOptionalUser(req)

    expect(result).toEqual({ userId: 42, role: 'BUSINESS_OWNER' })
  })

  it('wraps GET /businesses in a flat { success, data, meta } envelope', async () => {
    const items = [{ businessId: 1, name: 'Biz', description: null, avgRating: 4, reviewCount: 2, status: 'approved', province: null, categories: [] }]
    const getBusinessListUseCase = { execute: jest.fn().mockResolvedValue({ items, total: 37 }) } as any
    const controller = new BusinessController(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      getBusinessListUseCase,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    )

    const result = await controller.getBusinesses({ page: 2, limit: 10 } as any)

    expect(result).toEqual({
      success: true,
      data: items,
      meta: { page: 2, limit: 10, total: 37, totalPages: 4 },
    })
  })

  it('wraps GET /businesses/my in a flat { success, data, meta } envelope', async () => {
    const items = [{ businessId: 9, name: 'My Biz', status: 'pending', avgRating: 0, createdAt: '2026-01-01T00:00:00.000Z' }]
    const getMyBusinessesUseCase = { execute: jest.fn().mockResolvedValue({ items, total: 1 }) } as any
    const controller = new BusinessController(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      getMyBusinessesUseCase,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    )

    const result = await controller.getMyBusinesses({ userId: 9 }, { page: 1, limit: 20 } as any)

    expect(getMyBusinessesUseCase.execute).toHaveBeenCalledWith({ userId: 9, page: 1, limit: 20 })
    expect(result).toEqual({
      success: true,
      data: items,
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    })
  })
})
