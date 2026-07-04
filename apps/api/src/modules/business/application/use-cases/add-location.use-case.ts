import { Injectable, ForbiddenException } from '@nestjs/common'
import { BusinessRepository } from '../../domain/repositories/business.repository'
import { LocationRepository } from '../../domain/repositories/location.repository'
import { BusinessNotFoundException } from '../../domain/exceptions/business.exceptions'

@Injectable()
export class AddLocationUseCase {
  constructor(
    private readonly businessRepository: BusinessRepository,
    private readonly locationRepository: LocationRepository,
  ) {}

  async execute({ businessId, user, dto }: { businessId: number; user: { userId: number; role: string }; dto: any }) {
    const business = await this.businessRepository.findById(businessId)
    if (!business) {
      throw new BusinessNotFoundException()
    }

    if (user.role !== 'ADMIN' && business.ownerUserId !== user.userId) {
      throw new ForbiddenException('Access denied')
    }

    const created = await this.locationRepository.create(dto)
    await this.locationRepository.createBusinessLocation(businessId, created.locationId)
    return { locationId: created.locationId }
  }
}
