import { Injectable } from '@nestjs/common'
import { BusinessClaimRepository } from '../../domain/repositories/business-claim.repository'
import { BusinessClaimNotFoundException, ClaimNotPendingException } from '../../domain/exceptions/business-claim.exceptions'
import { CreateNotificationUseCase } from '../../../notification/application/use-cases/create-notification.use-case'
import { NOTIFICATION_TYPE } from '@eers/shared-constants'

@Injectable()
export class ApproveClaimUseCase {
  constructor(
    private readonly businessClaimRepository: BusinessClaimRepository,
    private readonly createNotificationUseCase: CreateNotificationUseCase,
  ) {}

  async execute({ claimId, currentUserId }: { claimId: number; currentUserId: number }) {
    const claim = await this.businessClaimRepository.findById(claimId)
    if (!claim) {
      throw new BusinessClaimNotFoundException()
    }

    if (claim.status !== 'pending') {
      throw new ClaimNotPendingException()
    }

    const result = await this.businessClaimRepository.approveClaimAndTransferOwnership(claimId, currentUserId)

    await this.createNotificationUseCase.execute({
      userId: result.claimantUserId,
      type: NOTIFICATION_TYPE.CLAIM_APPROVED,
      title: 'Claim Approved',
      content: `Your claim on "${result.businessName}" has been approved. You are now the owner of this business.`,
    })

    await Promise.all(
      result.rejectedRivalClaimantUserIds.map((userId) =>
        this.createNotificationUseCase.execute({
          userId,
          type: NOTIFICATION_TYPE.CLAIM_REJECTED,
          title: 'Claim Rejected',
          content: `Your claim on "${result.businessName}" was rejected. Reason: Another user's claim for this business was approved.`,
        }),
      ),
    )

    return { claimId, status: 'approved' as const }
  }
}
