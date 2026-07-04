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
    )

    const req = { headers: { authorization: 'Bearer token' } }
    const result = (controller as any).getOptionalUser(req)

    expect(result).toEqual({ userId: 42, role: 'BUSINESS_OWNER' })
  })
})
