import { RemoveLocationUseCase } from '../application/use-cases/remove-location.use-case'
import { BusinessRepository } from '../domain/repositories/business.repository'
import { LocationRepository } from '../domain/repositories/location.repository'
import { BusinessNotFoundException, LastLocationErrorException, LocationNotFoundException } from '../domain/exceptions/business.exceptions'

describe('RemoveLocationUseCase', () => {
  let businessRepository: jest.Mocked<Pick<BusinessRepository, 'findById' | 'countLocations' | 'findBusinessLocation'>>
  let locationRepository: jest.Mocked<Pick<LocationRepository, 'deleteBusinessLocation' | 'delete'>>
  let useCase: RemoveLocationUseCase

  beforeEach(() => {
    businessRepository = { findById: jest.fn(), countLocations: jest.fn(), findBusinessLocation: jest.fn() }
    locationRepository = { deleteBusinessLocation: jest.fn(), delete: jest.fn() }
    useCase = new RemoveLocationUseCase(businessRepository as unknown as BusinessRepository, locationRepository as unknown as LocationRepository)
  })

  it('throws LAST_LOCATION_ERROR when only one location remains', async () => {
    businessRepository.findById.mockResolvedValue({ businessId: 1, ownerUserId: 5 } as any)
    businessRepository.countLocations.mockResolvedValue(1)

    await expect(
      useCase.execute({ businessId: 1, user: { userId: 5, role: 'BUSINESS_OWNER' }, locationId: 10 }),
    ).rejects.toBeInstanceOf(LastLocationErrorException)
  })

  it('throws LOCATION_NOT_FOUND when relation does not exist', async () => {
    businessRepository.findById.mockResolvedValue({ businessId: 1, ownerUserId: 5 } as any)
    businessRepository.countLocations.mockResolvedValue(2)
    businessRepository.findBusinessLocation.mockResolvedValue(null)

    await expect(
      useCase.execute({ businessId: 1, user: { userId: 5, role: 'BUSINESS_OWNER' }, locationId: 10 }),
    ).rejects.toBeInstanceOf(LocationNotFoundException)
  })

  it('deletes location and join record when valid', async () => {
    businessRepository.findById.mockResolvedValue({ businessId: 1, ownerUserId: 5 } as any)
    businessRepository.countLocations.mockResolvedValue(2)
    businessRepository.findBusinessLocation.mockResolvedValue({ businessId: 1, locationId: 10 } as any)

    await useCase.execute({ businessId: 1, user: { userId: 5, role: 'BUSINESS_OWNER' }, locationId: 10 })

    expect(locationRepository.deleteBusinessLocation).toHaveBeenCalledWith(1, 10)
    expect(locationRepository.delete).toHaveBeenCalledWith(10)
  })

  it('throws BUSINESS_NOT_FOUND when business is missing', async () => {
    businessRepository.findById.mockResolvedValue(null)
    await expect(
      useCase.execute({ businessId: 1, user: { userId: 5, role: 'BUSINESS_OWNER' }, locationId: 10 }),
    ).rejects.toBeInstanceOf(BusinessNotFoundException)
  })
})
