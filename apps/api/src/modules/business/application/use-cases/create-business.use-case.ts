import { Injectable } from '@nestjs/common'
import { BusinessRepository } from '../../domain/repositories/business.repository'
import { CategoryNotFoundException, EmailAlreadyExistsException, PhoneAlreadyExistsException } from '../../domain/exceptions/business.exceptions'
import { Geocoder } from '../ports/geocoder.port'

@Injectable()
export class CreateBusinessUseCase {
  constructor(
    private readonly businessRepository: BusinessRepository,
    private readonly geocodingService: Geocoder,
  ) {}

  async execute({ userId, dto }: { userId: number; dto: any }) {
    const categoryExists = await this.businessRepository.findCategoriesExist(dto.categoryIds)
    if (!categoryExists) {
      throw new CategoryNotFoundException()
    }

    const existingPhone = await this.businessRepository.findByPhone(dto.phone)
    if (existingPhone) {
      throw new PhoneAlreadyExistsException()
    }

    if (dto.email) {
      const existingEmail = await this.businessRepository.findByEmail(dto.email)
      if (existingEmail) {
        throw new EmailAlreadyExistsException()
      }
    }

    const geocodedLocations = await Promise.all(
      dto.locations.map(async (location: { addressLine: string; ward: string; province: string }) => {
        const coords = await this.geocodingService.geocode(`${location.addressLine}, ${location.ward}, ${location.province}`)
        return { ...location, latitude: coords?.latitude ?? null, longitude: coords?.longitude ?? null }
      }),
    )

    return this.businessRepository.createBusinessWithLocationsAndCategories({
      name: dto.name,
      description: dto.description ?? null,
      website: dto.website ?? null,
      openingHours: dto.openingHours ?? null,
      services: dto.services ?? null,
      priceRange: dto.priceRange ?? null,
      amenities: dto.amenities ?? null,

      phone: dto.phone,
      email: dto.email ?? null,
      ownerUserId: userId,
      categoryIds: dto.categoryIds,
      locations: geocodedLocations,
    })
  }
}
