import { AddLocationUseCase } from '../application/use-cases/add-location.use-case'
import { BusinessRepository } from '../domain/repositories/business.repository'
import { LocationRepository } from '../domain/repositories/location.repository'
import { BusinessNotFoundException } from '../domain/exceptions/business.exceptions'

describe('AddLocationUseCase', () => {
  let businessRepository: jest.Mocked<Pick<BusinessRepository, 'findById'>>
  let locationRepository: jest.Mocked<Pick<LocationRepository, 'create' | 'createBusinessLocation'>>
  let useCase: AddLocationUseCase

  beforeEach(() => {
    businessRepository = { findById: jest.fn() }
    locationRepository = { create: jest.fn(), createBusinessLocation: jest.fn() }
    useCase = new AddLocationUseCase(businessRepository as unknown as BusinessRepository, locationRepository as unknown as LocationRepository)
  })

  it('creates location and join record', async () => {
    businessRepository.findById.mockResolvedValue({ businessId: 1, ownerUserId: 5 } as any)
    locationRepository.create.mockResolvedValue({ locationId: 7 } as any)

    const result = await useCase.execute({
      businessId: 1,
      user: { userId: 5, role: 'BUSINESS_OWNER' },
      dto: { addressLine: 'Line', ward: 'Ward', province: 'Province' },
    })

    expect(result).toEqual({ locationId: 7 })
    expect(locationRepository.createBusinessLocation).toHaveBeenCalledWith(1, 7)
  })

  it('throws BUSINESS_NOT_FOUND when business is missing', async () => {
    businessRepository.findById.mockResolvedValue(null)
    await expect(
      useCase.execute({
        businessId: 1,
        user: { userId: 5, role: 'BUSINESS_OWNER' },
        dto: { addressLine: 'Line', ward: 'Ward', province: 'Province' },
      }),
    ).rejects.toBeInstanceOf(BusinessNotFoundException)
  })
})
