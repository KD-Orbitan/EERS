import { Injectable } from '@nestjs/common'
import { BusinessClaimRepository } from '../../domain/repositories/business-claim.repository'

@Injectable()
export class ListAdminClaimsUseCase {
  constructor(private readonly businessClaimRepository: BusinessClaimRepository) {}

  async execute({ page = 1, limit = 20, status, search }: { page?: number; limit?: number; status?: string; search?: string }) {
    return this.businessClaimRepository.findAdminClaims(page, limit, status, search)
  }
}
