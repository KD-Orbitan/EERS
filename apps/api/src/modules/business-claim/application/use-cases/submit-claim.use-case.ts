import { Injectable } from '@nestjs/common'
import { BusinessClaimRepository } from '../../domain/repositories/business-claim.repository'
import { ClaimAlreadyPendingException, BusinessAlreadyClaimedException } from '../../domain/exceptions/business-claim.exceptions'
import { GetBusinessSummaryUseCase } from '../../../business/application/use-cases/get-business-summary.use-case'
import { BusinessNotFoundException, BusinessNotApprovedException } from '../../../business/domain/exceptions/business.exceptions'
import { UserRepository } from '../../../user/domain/repositories/user.repository'
import { CreateNotificationUseCase } from '../../../notification/application/use-cases/create-notification.use-case'
import { NOTIFICATION_TYPE } from '@eers/shared-constants'

@Injectable()
export class SubmitClaimUseCase {
  constructor(
    private readonly businessClaimRepository: BusinessClaimRepository,
    private readonly getBusinessSummaryUseCase: GetBusinessSummaryUseCase,
    private readonly userRepository: UserRepository,
    private readonly createNotificationUseCase: CreateNotificationUseCase,
  ) {}

  async execute({ currentUserId, dto }: { currentUserId: number; dto: { businessId: number; message: string } }) {
    const business = await this.getBusinessSummaryUseCase.execute(dto.businessId)
    if (!business) {
      throw new BusinessNotFoundException()
    }

    if (business.status !== 'approved') {
      throw new BusinessNotApprovedException()
    }

    if (business.ownerUserId !== null) {
      throw new BusinessAlreadyClaimedException()
    }

    const existingPending = await this.businessClaimRepository.findPendingByUserAndBusiness(currentUserId, dto.businessId)
    if (existingPending) {
      throw new ClaimAlreadyPendingException()
    }

    const claim = await this.businessClaimRepository.createClaim({
      userId: currentUserId,
      businessId: dto.businessId,
      message: dto.message,
    })

    const adminUserIds = await this.userRepository.findUserIdsByRole('ADMIN')
    await Promise.all(
      adminUserIds.map((adminUserId) =>
        this.createNotificationUseCase.execute({
          userId: adminUserId,
          type: NOTIFICATION_TYPE.CLAIM_SUBMITTED,
          targetPath: '/admin/business-claims',
          title: 'New Business Claim',
          content: `A new claim was submitted for business "${business.name}".`,
        }),
      ),
    )

    return claim
  }
}
