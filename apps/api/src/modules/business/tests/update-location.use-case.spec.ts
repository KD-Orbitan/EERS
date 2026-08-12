import { UpdateLocationUseCase } from '../application/use-cases/update-location.use-case'
import { BusinessRepository } from '../domain/repositories/business.repository'
import { LocationRepository } from '../domain/repositories/location.repository'
import { GeocodingService } from '../infrastructure/services/geocoding.service'
import { BusinessNotFoundException, LocationNotFoundException } from '../domain/exceptions/business.exceptions'

describe('UpdateLocationUseCase', () => {
  let businessRepository: jest.Mocked<Pick<BusinessRepository, 'findById' | 'findBusinessLocation'>>
  let locationRepository: jest.Mocked<Pick<LocationRepository, 'update' | 'findById'>>
  let geocodingService: jest.Mocked<Pick<GeocodingService, 'geocode'>>
  let useCase: UpdateLocationUseCase

  beforeEach(() => {
    businessRepository = { findById: jest.fn(), findBusinessLocation: jest.fn() }
    locationRepository = { update: jest.fn(), findById: jest.fn() }
    geocodingService = { geocode: jest.fn().mockResolvedValue(null) }
    useCase = new UpdateLocationUseCase(
      businessRepository as unknown as BusinessRepository,
      locationRepository as unknown as LocationRepository,
      geocodingService as unknown as GeocodingService,
    )
  })

  it('re-geocodes using the merged address when addressLine changes', async () => {
    businessRepository.findById.mockResolvedValue({ businessId: 1, ownerUserId: 5 } as any)
    businessRepository.findBusinessLocation.mockResolvedValue({ businessId: 1, locationId: 7 } as any)
    locationRepository.findById.mockResolvedValue({
      locationId: 7,
      addressLine: 'Old St',
      ward: 'Ward 1',
      province: 'Hanoi',
      latitude: null,
      longitude: null,
    } as any)
    geocodingService.geocode.mockResolvedValue({ latitude: 21.03, longitude: 105.85 })
    locationRepository.update.mockResolvedValue({ locationId: 7 })

    const result = await useCase.execute({
      businessId: 1,
      user: { userId: 5, role: 'BUSINESS_OWNER' },
      locationId: 7,
      dto: { addressLine: 'New St' },
    })

    expect(geocodingService.geocode).toHaveBeenCalledWith('New St, Ward 1, Hanoi')
    expect(locationRepository.update).toHaveBeenCalledWith(7, { addressLine: 'New St', latitude: 21.03, longitude: 105.85 })
    expect(result).toEqual({ locationId: 7 })
  })

  it('skips geocoding entirely when the address fields are unchanged', async () => {
    businessRepository.findById.mockResolvedValue({ businessId: 1, ownerUserId: 5 } as any)
    businessRepository.findBusinessLocation.mockResolvedValue({ businessId: 1, locationId: 7 } as any)
    locationRepository.update.mockResolvedValue({ locationId: 7 })

    await useCase.execute({
      businessId: 1,
      user: { userId: 5, role: 'BUSINESS_OWNER' },
      locationId: 7,
      dto: {},
    })

    expect(geocodingService.geocode).not.toHaveBeenCalled()
    expect(locationRepository.findById).not.toHaveBeenCalled()
    expect(locationRepository.update).toHaveBeenCalledWith(7, {})
  })

  it('throws BUSINESS_NOT_FOUND when business is missing', async () => {
    businessRepository.findById.mockResolvedValue(null)

    await expect(
      useCase.execute({ businessId: 1, user: { userId: 5, role: 'BUSINESS_OWNER' }, locationId: 7, dto: {} }),
    ).rejects.toBeInstanceOf(BusinessNotFoundException)
  })

  it('throws LocationNotFoundException when the location does not belong to the business', async () => {
    businessRepository.findById.mockResolvedValue({ businessId: 1, ownerUserId: 5 } as any)
    businessRepository.findBusinessLocation.mockResolvedValue(null)

    await expect(
      useCase.execute({ businessId: 1, user: { userId: 5, role: 'BUSINESS_OWNER' }, locationId: 7, dto: {} }),
    ).rejects.toBeInstanceOf(LocationNotFoundException)
  })
})
