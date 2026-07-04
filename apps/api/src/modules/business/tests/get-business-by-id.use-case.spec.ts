import { GetBusinessByIdUseCase } from '../application/use-cases/get-business-by-id.use-case'
import { BusinessRepository } from '../domain/repositories/business.repository'
import { BusinessNotFoundException } from '../domain/exceptions/business.exceptions'

describe('GetBusinessByIdUseCase', () => {
  let businessRepository: jest.Mocked<Pick<BusinessRepository, 'getBusinessDetail'>>
  let useCase: GetBusinessByIdUseCase

  beforeEach(() => {
    businessRepository = {
      getBusinessDetail: jest.fn(),
    }
    useCase = new GetBusinessByIdUseCase(businessRepository as unknown as BusinessRepository)
  })

  it('returns approved business for public user', async () => {
    businessRepository.getBusinessDetail.mockResolvedValue({ businessId: 1, status: 'approved', owner: { userId: 2 }, name: 'Test', description: null, phone: '123', email: null, avgRating: 4.2, reviewCount: 1, categories: [], locations: [], createdAt: '2025-01-01T00:00:00.000Z' } as any)
    const result = await useCase.execute({ businessId: 1 })
    expect(result).toBeDefined()
  })

  it('allows owner to view pending business', async () => {
    businessRepository.getBusinessDetail.mockResolvedValue({ businessId: 1, status: 'pending', owner: { userId: 5 }, name: 'Test', description: null, phone: '123', email: null, avgRating: 0, reviewCount: 0, categories: [], locations: [], createdAt: '2025-01-01T00:00:00.000Z' } as any)
    const result = await useCase.execute({ businessId: 1, currentUser: { userId: 5, role: 'BUSINESS_OWNER' } })
    expect(result).toBeDefined()
  })

  it('throws FORBIDDEN for non-owner on pending business', async () => {
    businessRepository.getBusinessDetail.mockResolvedValue({ businessId: 1, status: 'pending', owner: { userId: 5 }, name: 'Test', description: null, phone: '123', email: null, avgRating: 0, reviewCount: 0, categories: [], locations: [], createdAt: '2025-01-01T00:00:00.000Z' } as any)
    await expect(useCase.execute({ businessId: 1, currentUser: { userId: 6, role: 'USER' } })).rejects.toThrow('Access denied')
  })

  it('throws BUSINESS_NOT_FOUND when business is missing', async () => {
    businessRepository.getBusinessDetail.mockResolvedValue(null)
    await expect(useCase.execute({ businessId: 1 })).rejects.toBeInstanceOf(BusinessNotFoundException)
  })
})
