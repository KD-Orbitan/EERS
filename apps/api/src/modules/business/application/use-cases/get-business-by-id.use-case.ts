import { Injectable, ForbiddenException } from '@nestjs/common'
import { BusinessRepository } from '../../domain/repositories/business.repository'
import { BusinessNotFoundException } from '../../domain/exceptions/business.exceptions'

@Injectable()
export class GetBusinessByIdUseCase {
  constructor(private readonly businessRepository: BusinessRepository) {}

  async execute({ businessId, currentUser }: { businessId: number; currentUser?: { userId: number; role: string } }) {
    const business = await this.businessRepository.getBusinessDetail(businessId)
    if (!business) {
      throw new BusinessNotFoundException()
    }

    const status = business.status
    const isOwner = !!currentUser && !!business.owner && currentUser.userId === business.owner.userId
    const isAdmin = currentUser?.role === 'ADMIN'

    if (status === 'approved') {
      return business
    }

    if (status === 'hidden' && !isAdmin) {
      throw new ForbiddenException('Access denied')
    }

    if ((status === 'pending' || status === 'rejected') && !isOwner && !isAdmin) {
      throw new ForbiddenException('Access denied')
    }

    return business
  }
}
