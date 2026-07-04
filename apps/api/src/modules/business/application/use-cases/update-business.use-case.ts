import { Injectable, ForbiddenException } from '@nestjs/common'
import { BusinessRepository } from '../../domain/repositories/business.repository'
import { BusinessNotFoundException, EmailAlreadyExistsException, PhoneAlreadyExistsException } from '../../domain/exceptions/business.exceptions'

@Injectable()
export class UpdateBusinessUseCase {
  constructor(private readonly businessRepository: BusinessRepository) {}

  async execute({ businessId, user, dto }: { businessId: number; user: { userId: number; role: string }; dto: any }) {
    const business = await this.businessRepository.findById(businessId)
    if (!business) {
      throw new BusinessNotFoundException()
    }

    if (user.role !== 'ADMIN' && business.ownerUserId !== user.userId) {
      throw new ForbiddenException('Access denied')
    }

    if (dto.phone) {
      const existingPhone = await this.businessRepository.findByPhone(dto.phone)
      if (existingPhone && existingPhone.businessId !== businessId) {
        throw new PhoneAlreadyExistsException()
      }
    }

    if (dto.email) {
      const existingEmail = await this.businessRepository.findByEmail(dto.email)
      if (existingEmail && existingEmail.businessId !== businessId) {
        throw new EmailAlreadyExistsException()
      }
    }

    return this.businessRepository.updateBusiness(businessId, dto)
  }
}
