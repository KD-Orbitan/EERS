import { Injectable, ForbiddenException } from '@nestjs/common'
import { BusinessRepository } from '../../domain/repositories/business.repository'
import { LocationRepository } from '../../domain/repositories/location.repository'
import { BusinessNotFoundException } from '../../domain/exceptions/business.exceptions'
import { GeocodingService } from '../../infrastructure/services/geocoding.service'

@Injectable()
export class AddLocationUseCase {
  constructor(
    private readonly businessRepository: BusinessRepository,
    private readonly locationRepository: LocationRepository,
    private readonly geocodingService: GeocodingService,
  ) {}

  async execute({ businessId, user, dto }: { businessId: number; user: { userId: number; role: string }; dto: any }) {
    const business = await this.businessRepository.findById(businessId)
    if (!business) {
      throw new BusinessNotFoundException()
    }

    if (user.role !== 'ADMIN' && business.ownerUserId !== user.userId) {
      throw new ForbiddenException('Access denied')
    }

    const coords = await this.geocodingService.geocode(`${dto.addressLine}, ${dto.ward}, ${dto.province}`)
    const created = await this.locationRepository.create({ ...dto, latitude: coords?.latitude ?? null, longitude: coords?.longitude ?? null })
    await this.locationRepository.createBusinessLocation(businessId, created.locationId)
    return { locationId: created.locationId }
  }
}
