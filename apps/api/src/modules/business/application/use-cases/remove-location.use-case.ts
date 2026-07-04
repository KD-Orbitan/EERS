import { Injectable, ForbiddenException } from '@nestjs/common'
import { BusinessRepository } from '../../domain/repositories/business.repository'
import { LocationRepository } from '../../domain/repositories/location.repository'
import { BusinessNotFoundException, LastLocationErrorException, LocationNotFoundException } from '../../domain/exceptions/business.exceptions'

@Injectable()
export class RemoveLocationUseCase {
  constructor(
    private readonly businessRepository: BusinessRepository,
    private readonly locationRepository: LocationRepository,
  ) {}

  async execute({ businessId, user, locationId }: { businessId: number; user: { userId: number; role: string }; locationId: number }) {
    const business = await this.businessRepository.findById(businessId)
    if (!business) {
      throw new BusinessNotFoundException()
    }

    if (user.role !== 'ADMIN' && business.ownerUserId !== user.userId) {
      throw new ForbiddenException('Access denied')
    }

    const count = await this.businessRepository.countLocations(businessId)
    if (count <= 1) {
      throw new LastLocationErrorException()
    }

    const relation = await this.businessRepository.findBusinessLocation(businessId, locationId)
    if (!relation) {
      throw new LocationNotFoundException()
    }

    await this.locationRepository.deleteBusinessLocation(businessId, locationId)
    await this.locationRepository.delete(locationId)
  }
}
