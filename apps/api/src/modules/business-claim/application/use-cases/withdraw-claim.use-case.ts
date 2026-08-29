import { Injectable, ForbiddenException } from '@nestjs/common'
import { BusinessClaimRepository } from '../../domain/repositories/business-claim.repository'
import { BusinessClaimNotFoundException, ClaimNotPendingException } from '../../domain/exceptions/business-claim.exceptions'

@Injectable()
export class WithdrawClaimUseCase {
  constructor(private readonly businessClaimRepository: BusinessClaimRepository) {}

  async execute({ claimId, currentUserId }: { claimId: number; currentUserId: number }) {
    const claim = await this.businessClaimRepository.findById(claimId)
    if (!claim) {
      throw new BusinessClaimNotFoundException()
    }

    if (claim.userId !== currentUserId) {
      throw new ForbiddenException('Forbidden')
    }

    if (claim.status !== 'pending') {
      throw new ClaimNotPendingException()
    }

    await this.businessClaimRepository.withdrawClaim(claimId)
  }
}
