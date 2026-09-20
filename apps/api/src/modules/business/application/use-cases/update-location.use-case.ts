import { Injectable, ForbiddenException } from '@nestjs/common'
import { BusinessRepository } from '../../domain/repositories/business.repository'
import { LocationRepository } from '../../domain/repositories/location.repository'
import { BusinessNotFoundException, LocationNotFoundException } from '../../domain/exceptions/business.exceptions'
import { Geocoder } from '../ports/geocoder.port'

@Injectable()
export class UpdateLocationUseCase {
  constructor(
    private readonly businessRepository: BusinessRepository,
    private readonly locationRepository: LocationRepository,
    private readonly geocodingService: Geocoder,
  ) {}

  async execute({ businessId, user, locationId, dto }: { businessId: number; user: { userId: number; role: string }; locationId: number; dto: any }) {
    const business = await this.businessRepository.findById(businessId)
    if (!business) {
      throw new BusinessNotFoundException()
    }

    if (user.role !== 'ADMIN' && business.ownerUserId !== user.userId) {
      throw new ForbiddenException('Access denied')
    }

    const relation = await this.businessRepository.findBusinessLocation(businessId, locationId)
    if (!relation) {
      throw new LocationNotFoundException()
    }

    const addressChanged = dto.addressLine !== undefined || dto.ward !== undefined || dto.province !== undefined
    if (!addressChanged) {
      return this.locationRepository.update(locationId, dto)
    }

    const current = await this.locationRepository.findById(locationId)
    const addressLine = dto.addressLine ?? current?.addressLine ?? ''
    const ward = dto.ward ?? current?.ward ?? ''
    const province = dto.province ?? current?.province ?? ''
    const coords = await this.geocodingService.geocode(`${addressLine}, ${ward}, ${province}`)

    return this.locationRepository.update(locationId, { ...dto, latitude: coords?.latitude ?? null, longitude: coords?.longitude ?? null })
  }
}
