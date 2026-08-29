import { RejectClaimUseCase } from '../application/use-cases/reject-claim.use-case'
import { BusinessClaimRepository } from '../domain/repositories/business-claim.repository'
import { CreateNotificationUseCase } from '../../notification/application/use-cases/create-notification.use-case'
import { BusinessClaimNotFoundException, ClaimNotPendingException } from '../domain/exceptions/business-claim.exceptions'
import { NOTIFICATION_TYPE } from '@eers/shared-constants'

describe('RejectClaimUseCase', () => {
  let businessClaimRepository: jest.Mocked<Pick<BusinessClaimRepository, 'findById' | 'rejectClaim'>>
  let createNotificationUseCase: jest.Mocked<Pick<CreateNotificationUseCase, 'execute'>>
  let useCase: RejectClaimUseCase

  beforeEach(() => {
    businessClaimRepository = { findById: jest.fn(), rejectClaim: jest.fn() }
    createNotificationUseCase = { execute: jest.fn().mockResolvedValue(undefined) }
    useCase = new RejectClaimUseCase(
      businessClaimRepository as unknown as BusinessClaimRepository,
      createNotificationUseCase as unknown as CreateNotificationUseCase,
    )
  })

  it('rejects a pending claim and notifies the claimant', async () => {
    businessClaimRepository.findById.mockResolvedValue({ claimId: 1, businessId: 2, businessName: 'Acme', userId: 5, status: 'pending', message: 'proof' } as any)

    const result = await useCase.execute({ claimId: 1, currentUserId: 9, reason: 'Not enough evidence provided' })

    expect(result).toEqual({ claimId: 1, status: 'rejected' })
    expect(businessClaimRepository.rejectClaim).toHaveBeenCalledWith(1, 9)
    expect(createNotificationUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 5, type: NOTIFICATION_TYPE.CLAIM_REJECTED, content: expect.stringContaining('Not enough evidence provided') }),
    )
  })

  it('throws BUSINESS_CLAIM_NOT_FOUND for an unknown claim', async () => {
    businessClaimRepository.findById.mockResolvedValue(null)

    await expect(useCase.execute({ claimId: 999, currentUserId: 9, reason: 'Not enough evidence provided' })).rejects.toBeInstanceOf(BusinessClaimNotFoundException)
  })

  it('throws CLAIM_NOT_PENDING when the claim is no longer pending', async () => {
    businessClaimRepository.findById.mockResolvedValue({ claimId: 1, businessId: 2, businessName: 'Acme', userId: 5, status: 'approved', message: 'proof' } as any)

    await expect(useCase.execute({ claimId: 1, currentUserId: 9, reason: 'Not enough evidence provided' })).rejects.toBeInstanceOf(ClaimNotPendingException)
  })
})
