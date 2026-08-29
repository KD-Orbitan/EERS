import { ApproveClaimUseCase } from '../application/use-cases/approve-claim.use-case'
import { BusinessClaimRepository } from '../domain/repositories/business-claim.repository'
import { CreateNotificationUseCase } from '../../notification/application/use-cases/create-notification.use-case'
import { BusinessClaimNotFoundException, ClaimNotPendingException } from '../domain/exceptions/business-claim.exceptions'
import { NOTIFICATION_TYPE } from '@eers/shared-constants'

describe('ApproveClaimUseCase', () => {
  let businessClaimRepository: jest.Mocked<Pick<BusinessClaimRepository, 'findById' | 'approveClaimAndTransferOwnership'>>
  let createNotificationUseCase: jest.Mocked<Pick<CreateNotificationUseCase, 'execute'>>
  let useCase: ApproveClaimUseCase

  beforeEach(() => {
    businessClaimRepository = { findById: jest.fn(), approveClaimAndTransferOwnership: jest.fn() }
    createNotificationUseCase = { execute: jest.fn().mockResolvedValue(undefined) }
    useCase = new ApproveClaimUseCase(
      businessClaimRepository as unknown as BusinessClaimRepository,
      createNotificationUseCase as unknown as CreateNotificationUseCase,
    )
  })

  it('approves a pending claim, notifies the claimant, and notifies every auto-rejected rival claimant', async () => {
    businessClaimRepository.findById.mockResolvedValue({ claimId: 1, businessId: 2, businessName: 'Acme', userId: 5, status: 'pending', message: 'proof' } as any)
    businessClaimRepository.approveClaimAndTransferOwnership.mockResolvedValue({
      businessId: 2,
      businessName: 'Acme',
      claimantUserId: 5,
      rejectedRivalClaimantUserIds: [8, 9],
    })

    const result = await useCase.execute({ claimId: 1, currentUserId: 20 })

    expect(result).toEqual({ claimId: 1, status: 'approved' })
    expect(businessClaimRepository.approveClaimAndTransferOwnership).toHaveBeenCalledWith(1, 20)
    expect(createNotificationUseCase.execute).toHaveBeenCalledTimes(3)
    expect(createNotificationUseCase.execute).toHaveBeenCalledWith(expect.objectContaining({ userId: 5, type: NOTIFICATION_TYPE.CLAIM_APPROVED }))
    expect(createNotificationUseCase.execute).toHaveBeenCalledWith(expect.objectContaining({ userId: 8, type: NOTIFICATION_TYPE.CLAIM_REJECTED }))
    expect(createNotificationUseCase.execute).toHaveBeenCalledWith(expect.objectContaining({ userId: 9, type: NOTIFICATION_TYPE.CLAIM_REJECTED }))
  })

  it('throws BUSINESS_CLAIM_NOT_FOUND for an unknown claim', async () => {
    businessClaimRepository.findById.mockResolvedValue(null)

    await expect(useCase.execute({ claimId: 999, currentUserId: 20 })).rejects.toBeInstanceOf(BusinessClaimNotFoundException)
  })

  it('throws CLAIM_NOT_PENDING when the claim is no longer pending', async () => {
    businessClaimRepository.findById.mockResolvedValue({ claimId: 1, businessId: 2, businessName: 'Acme', userId: 5, status: 'rejected', message: 'proof' } as any)

    await expect(useCase.execute({ claimId: 1, currentUserId: 20 })).rejects.toBeInstanceOf(ClaimNotPendingException)
  })
})
