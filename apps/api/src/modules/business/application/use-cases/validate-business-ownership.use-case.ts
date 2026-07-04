import { Injectable, ForbiddenException } from '@nestjs/common'
import { BusinessRepository } from '../../domain/repositories/business.repository'
import { BusinessNotFoundException } from '../../domain/exceptions/business.exceptions'

@Injectable()
export class ValidateBusinessOwnershipUseCase {
  constructor(private readonly businessRepository: BusinessRepository) {}

  async execute({ businessId, user }: { businessId: number; user: { userId: number; role: string } }) {
    const business = await this.businessRepository.findById(businessId)
    if (!business) {
      throw new BusinessNotFoundException()
    }

    if (user.role !== 'ADMIN' && business.ownerUserId !== user.userId) {
      throw new ForbiddenException('Access denied')
    }

    return business
  }
}
