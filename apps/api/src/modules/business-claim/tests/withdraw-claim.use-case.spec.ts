import { ForbiddenException } from '@nestjs/common'
import { WithdrawClaimUseCase } from '../application/use-cases/withdraw-claim.use-case'
import { BusinessClaimRepository } from '../domain/repositories/business-claim.repository'
import { BusinessClaimNotFoundException, ClaimNotPendingException } from '../domain/exceptions/business-claim.exceptions'

describe('WithdrawClaimUseCase', () => {
  let businessClaimRepository: jest.Mocked<Pick<BusinessClaimRepository, 'findById' | 'withdrawClaim'>>
  let useCase: WithdrawClaimUseCase

  beforeEach(() => {
    businessClaimRepository = { findById: jest.fn(), withdrawClaim: jest.fn() }
    useCase = new WithdrawClaimUseCase(businessClaimRepository as unknown as BusinessClaimRepository)
  })

  it('hard deletes a pending claim owned by the current user', async () => {
    businessClaimRepository.findById.mockResolvedValue({ claimId: 1, userId: 5, status: 'pending' } as any)

    await useCase.execute({ claimId: 1, currentUserId: 5 })

    expect(businessClaimRepository.withdrawClaim).toHaveBeenCalledWith(1)
  })

  it('throws BUSINESS_CLAIM_NOT_FOUND for an unknown claim', async () => {
    businessClaimRepository.findById.mockResolvedValue(null)

    await expect(useCase.execute({ claimId: 999, currentUserId: 5 })).rejects.toBeInstanceOf(BusinessClaimNotFoundException)
  })

  it('throws Forbidden when the claim belongs to another user', async () => {
    businessClaimRepository.findById.mockResolvedValue({ claimId: 1, userId: 7, status: 'pending' } as any)

    await expect(useCase.execute({ claimId: 1, currentUserId: 5 })).rejects.toBeInstanceOf(ForbiddenException)
  })

  it('throws CLAIM_NOT_PENDING when the claim is no longer pending', async () => {
    businessClaimRepository.findById.mockResolvedValue({ claimId: 1, userId: 5, status: 'approved' } as any)

    await expect(useCase.execute({ claimId: 1, currentUserId: 5 })).rejects.toBeInstanceOf(ClaimNotPendingException)
  })
})
