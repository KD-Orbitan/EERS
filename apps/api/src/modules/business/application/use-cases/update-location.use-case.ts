import { Injectable, ForbiddenException } from '@nestjs/common'
import { BusinessRepository } from '../../domain/repositories/business.repository'
import { LocationRepository } from '../../domain/repositories/location.repository'
import { BusinessNotFoundException, LocationNotFoundException } from '../../domain/exceptions/business.exceptions'

@Injectable()
export class UpdateLocationUseCase {
  constructor(
    private readonly businessRepository: BusinessRepository,
    private readonly locationRepository: LocationRepository,
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

    return this.locationRepository.update(locationId, dto)
  }
}
