import { CreateBusinessUseCase } from '../application/use-cases/create-business.use-case'
import { BusinessRepository } from '../domain/repositories/business.repository'
import { GeocodingService } from '../infrastructure/services/geocoding.service'
import { CategoryNotFoundException, EmailAlreadyExistsException, PhoneAlreadyExistsException } from '../domain/exceptions/business.exceptions'

describe('CreateBusinessUseCase', () => {
  let businessRepository: jest.Mocked<Pick<BusinessRepository, 'findCategoriesExist' | 'findByPhone' | 'findByEmail' | 'createBusinessWithLocationsAndCategories'>>
  let geocodingService: jest.Mocked<Pick<GeocodingService, 'geocode'>>
  let useCase: CreateBusinessUseCase

  beforeEach(() => {
    businessRepository = {
      findCategoriesExist: jest.fn(),
      findByPhone: jest.fn(),
      findByEmail: jest.fn(),
      createBusinessWithLocationsAndCategories: jest.fn(),
    }
    geocodingService = { geocode: jest.fn().mockResolvedValue(null) }
    useCase = new CreateBusinessUseCase(businessRepository as unknown as BusinessRepository, geocodingService as unknown as GeocodingService)
  })

  it('creates business with pending status', async () => {
    businessRepository.findCategoriesExist.mockResolvedValue(true)
    businessRepository.findByPhone.mockResolvedValue(null)
    businessRepository.findByEmail.mockResolvedValue(null)
    businessRepository.createBusinessWithLocationsAndCategories.mockResolvedValue({ businessId: 1, status: 'pending' })

    const result = await useCase.execute({
      userId: 5,
      dto: {
        name: 'Test Business',
        description: 'Description',
        phone: '123456',
        email: 'test@biz.com',
        categoryIds: [1],
        locations: [{ addressLine: 'Line', ward: 'Ward', province: 'Province' }],
      },
    })

    expect(result).toEqual({ businessId: 1, status: 'pending' })
    expect(geocodingService.geocode).toHaveBeenCalledWith('Line, Ward, Province')
    expect(businessRepository.createBusinessWithLocationsAndCategories).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerUserId: 5,
        name: 'Test Business',
        locations: [{ addressLine: 'Line', ward: 'Ward', province: 'Province', latitude: null, longitude: null }],
      }),
    )
  })

  it('passes through geocoded coordinates when available', async () => {
    businessRepository.findCategoriesExist.mockResolvedValue(true)
    businessRepository.findByPhone.mockResolvedValue(null)
    businessRepository.findByEmail.mockResolvedValue(null)
    businessRepository.createBusinessWithLocationsAndCategories.mockResolvedValue({ businessId: 1, status: 'pending' })
    geocodingService.geocode.mockResolvedValue({ latitude: 21.03, longitude: 105.85 })

    await useCase.execute({
      userId: 5,
      dto: {
        name: 'Test Business',
        phone: '123456',
        categoryIds: [1],
        locations: [{ addressLine: 'Line', ward: 'Ward', province: 'Province' }],
      },
    })

    expect(businessRepository.createBusinessWithLocationsAndCategories).toHaveBeenCalledWith(
      expect.objectContaining({
        locations: [{ addressLine: 'Line', ward: 'Ward', province: 'Province', latitude: 21.03, longitude: 105.85 }],
      }),
    )
  })

  it('throws CATEGORY_NOT_FOUND when category IDs are invalid', async () => {
    businessRepository.findCategoriesExist.mockResolvedValue(false)

    await expect(
      useCase.execute({
        userId: 5,
        dto: {
          name: 'Test Business',
          phone: '123456',
          categoryIds: [999],
          locations: [{ addressLine: 'Line', ward: 'Ward', province: 'Province' }],
        },
      }),
    ).rejects.toBeInstanceOf(CategoryNotFoundException)
  })

  it('throws PHONE_ALREADY_EXISTS when phone is taken', async () => {
    businessRepository.findCategoriesExist.mockResolvedValue(true)
    businessRepository.findByPhone.mockResolvedValue({ businessId: 1 } as any)

    await expect(
      useCase.execute({
        userId: 5,
        dto: {
          name: 'Test Business',
          phone: '123456',
          categoryIds: [1],
          locations: [{ addressLine: 'Line', ward: 'Ward', province: 'Province' }],
        },
      }),
    ).rejects.toBeInstanceOf(PhoneAlreadyExistsException)
  })

  it('throws EMAIL_ALREADY_EXISTS when email is taken', async () => {
    businessRepository.findCategoriesExist.mockResolvedValue(true)
    businessRepository.findByPhone.mockResolvedValue(null)
    businessRepository.findByEmail.mockResolvedValue({ businessId: 2 } as any)

    await expect(
      useCase.execute({
        userId: 5,
        dto: {
          name: 'Test Business',
          phone: '123456',
          email: 'taken@biz.com',
          categoryIds: [1],
          locations: [{ addressLine: 'Line', ward: 'Ward', province: 'Province' }],
        },
      }),
    ).rejects.toBeInstanceOf(EmailAlreadyExistsException)
  })
})
