import { Injectable } from '@nestjs/common'
import { BusinessRepository } from '../../domain/repositories/business.repository'
import { BusinessEntity } from '../../domain/entities/business.entity'

@Injectable()
export class GetBusinessSummaryUseCase {
  constructor(private readonly businessRepository: BusinessRepository) {}

  async execute(businessId: number): Promise<BusinessEntity | null> {
    return this.businessRepository.findById(businessId)
  }
}
