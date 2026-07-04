import { Injectable } from '@nestjs/common'
import { BusinessRepository } from '../../domain/repositories/business.repository'

@Injectable()
export class GetMyBusinessesUseCase {
  constructor(private readonly businessRepository: BusinessRepository) {}

  async execute({ userId, page = 1, limit = 20 }: { userId: number; page?: number; limit?: number }) {
    return this.businessRepository.getMyBusinesses(userId, page, limit)
  }
}
