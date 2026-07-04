import { Injectable } from '@nestjs/common'
import { BusinessRepository } from '../../domain/repositories/business.repository'
import { CategoryNotFoundException, EmailAlreadyExistsException, PhoneAlreadyExistsException } from '../../domain/exceptions/business.exceptions'

@Injectable()
export class CreateBusinessUseCase {
  constructor(private readonly businessRepository: BusinessRepository) {}

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

    return this.businessRepository.createBusinessWithLocationsAndCategories({
      name: dto.name,
      description: dto.description ?? null,
      phone: dto.phone,
      email: dto.email ?? null,
      ownerUserId: userId,
      categoryIds: dto.categoryIds,
      locations: dto.locations,
    })
  }
}
