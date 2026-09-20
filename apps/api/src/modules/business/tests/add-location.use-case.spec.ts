import { AddLocationUseCase } from '../application/use-cases/add-location.use-case'
import { BusinessRepository } from '../domain/repositories/business.repository'
import { LocationRepository } from '../domain/repositories/location.repository'
import { Geocoder } from '../application/ports/geocoder.port'
import { BusinessNotFoundException } from '../domain/exceptions/business.exceptions'

describe('AddLocationUseCase', () => {
  let businessRepository: jest.Mocked<Pick<BusinessRepository, 'findById'>>
  let locationRepository: jest.Mocked<Pick<LocationRepository, 'create' | 'createBusinessLocation'>>
  let geocodingService: jest.Mocked<Pick<Geocoder, 'geocode'>>
  let useCase: AddLocationUseCase

  beforeEach(() => {
    businessRepository = { findById: jest.fn() }
    locationRepository = { create: jest.fn(), createBusinessLocation: jest.fn() }
    geocodingService = { geocode: jest.fn().mockResolvedValue(null) }
    useCase = new AddLocationUseCase(
      businessRepository as unknown as BusinessRepository,
      locationRepository as unknown as LocationRepository,
      geocodingService as unknown as Geocoder,
    )
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
    expect(geocodingService.geocode).toHaveBeenCalledWith('Line, Ward, Province')
    expect(locationRepository.create).toHaveBeenCalledWith({ addressLine: 'Line', ward: 'Ward', province: 'Province', latitude: null, longitude: null })
    expect(locationRepository.createBusinessLocation).toHaveBeenCalledWith(1, 7)
  })

  it('persists geocoded coordinates when available', async () => {
    businessRepository.findById.mockResolvedValue({ businessId: 1, ownerUserId: 5 } as any)
    locationRepository.create.mockResolvedValue({ locationId: 7 } as any)
    geocodingService.geocode.mockResolvedValue({ latitude: 21.03, longitude: 105.85 })

    await useCase.execute({
      businessId: 1,
      user: { userId: 5, role: 'BUSINESS_OWNER' },
      dto: { addressLine: 'Line', ward: 'Ward', province: 'Province' },
    })

    expect(locationRepository.create).toHaveBeenCalledWith({ addressLine: 'Line', ward: 'Ward', province: 'Province', latitude: 21.03, longitude: 105.85 })
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
