import { Injectable } from '@nestjs/common'
import { BusinessRepository, BusinessListQuery } from '../../domain/repositories/business.repository'

@Injectable()
export class GetBusinessListUseCase {
  constructor(private readonly businessRepository: BusinessRepository) {}

  async execute(query: BusinessListQuery) {
    return this.businessRepository.getApprovedBusinessList(query)
  }
}
