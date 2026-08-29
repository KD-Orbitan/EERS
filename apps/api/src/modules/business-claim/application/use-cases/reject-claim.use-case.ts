import { Injectable } from '@nestjs/common'
import { BusinessClaimRepository } from '../../domain/repositories/business-claim.repository'
import { BusinessClaimNotFoundException, ClaimNotPendingException } from '../../domain/exceptions/business-claim.exceptions'
import { CreateNotificationUseCase } from '../../../notification/application/use-cases/create-notification.use-case'
import { NOTIFICATION_TYPE } from '@eers/shared-constants'

@Injectable()
export class RejectClaimUseCase {
  constructor(
    private readonly businessClaimRepository: BusinessClaimRepository,
    private readonly createNotificationUseCase: CreateNotificationUseCase,
  ) {}

  async execute({ claimId, currentUserId, reason }: { claimId: number; currentUserId: number; reason: string }) {
    const claim = await this.businessClaimRepository.findById(claimId)
    if (!claim) {
      throw new BusinessClaimNotFoundException()
    }

    if (claim.status !== 'pending') {
      throw new ClaimNotPendingException()
    }

    await this.businessClaimRepository.rejectClaim(claimId, currentUserId)

    await this.createNotificationUseCase.execute({
      userId: claim.userId,
      type: NOTIFICATION_TYPE.CLAIM_REJECTED,
      title: 'Claim Rejected',
      content: `Your claim on "${claim.businessName}" was rejected. Reason: ${reason}`,
    })

    return { claimId, status: 'rejected' as const }
  }
}
