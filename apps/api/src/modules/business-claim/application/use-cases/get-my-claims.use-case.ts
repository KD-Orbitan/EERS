import { Injectable } from '@nestjs/common'
import { BusinessClaimRepository } from '../../domain/repositories/business-claim.repository'

@Injectable()
export class GetMyClaimsUseCase {
  constructor(private readonly businessClaimRepository: BusinessClaimRepository) {}

  async execute({ userId, page = 1, limit = 20 }: { userId: number; page?: number; limit?: number }) {
    return this.businessClaimRepository.findMyClaims(userId, page, limit)
  }
}
