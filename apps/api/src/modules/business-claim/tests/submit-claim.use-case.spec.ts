import { SubmitClaimUseCase } from '../application/use-cases/submit-claim.use-case'
import { BusinessClaimRepository } from '../domain/repositories/business-claim.repository'
import { GetBusinessSummaryUseCase } from '../../business/application/use-cases/get-business-summary.use-case'
import { UserRepository } from '../../user/domain/repositories/user.repository'
import { CreateNotificationUseCase } from '../../notification/application/use-cases/create-notification.use-case'
import { BusinessAlreadyClaimedException, ClaimAlreadyPendingException } from '../domain/exceptions/business-claim.exceptions'
import { BusinessNotFoundException, BusinessNotApprovedException } from '../../business/domain/exceptions/business.exceptions'
import { NOTIFICATION_TYPE } from '@eers/shared-constants'

describe('SubmitClaimUseCase', () => {
  let businessClaimRepository: jest.Mocked<Pick<BusinessClaimRepository, 'findPendingByUserAndBusiness' | 'createClaim'>>
  let getBusinessSummaryUseCase: jest.Mocked<Pick<GetBusinessSummaryUseCase, 'execute'>>
  let userRepository: jest.Mocked<Pick<UserRepository, 'findUserIdsByRole'>>
  let createNotificationUseCase: jest.Mocked<Pick<CreateNotificationUseCase, 'execute'>>
  let useCase: SubmitClaimUseCase

  beforeEach(() => {
    businessClaimRepository = { findPendingByUserAndBusiness: jest.fn(), createClaim: jest.fn() }
    getBusinessSummaryUseCase = { execute: jest.fn() }
    userRepository = { findUserIdsByRole: jest.fn().mockResolvedValue([]) }
    createNotificationUseCase = { execute: jest.fn().mockResolvedValue(undefined) }
    useCase = new SubmitClaimUseCase(
      businessClaimRepository as unknown as BusinessClaimRepository,
      getBusinessSummaryUseCase as unknown as GetBusinessSummaryUseCase,
      userRepository as unknown as UserRepository,
      createNotificationUseCase as unknown as CreateNotificationUseCase,
    )
  })

  it('creates a claim when the business is approved and unclaimed with no prior pending claim', async () => {
    getBusinessSummaryUseCase.execute.mockResolvedValue({ businessId: 1, name: 'Acme', status: 'approved', ownerUserId: null } as any)
    businessClaimRepository.findPendingByUserAndBusiness.mockResolvedValue(null)
    businessClaimRepository.createClaim.mockResolvedValue({ claimId: 10, status: 'pending' })

    const result = await useCase.execute({ currentUserId: 5, dto: { businessId: 1, message: 'I own this business, here is proof.' } })

    expect(result).toEqual({ claimId: 10, status: 'pending' })
    expect(businessClaimRepository.createClaim).toHaveBeenCalledWith({ userId: 5, businessId: 1, message: 'I own this business, here is proof.' })
  })

  it('notifies every admin user after the claim is created', async () => {
    getBusinessSummaryUseCase.execute.mockResolvedValue({ businessId: 1, name: 'Acme', status: 'approved', ownerUserId: null } as any)
    businessClaimRepository.findPendingByUserAndBusiness.mockResolvedValue(null)
    businessClaimRepository.createClaim.mockResolvedValue({ claimId: 10, status: 'pending' })
    userRepository.findUserIdsByRole.mockResolvedValue([100, 101])

    await useCase.execute({ currentUserId: 5, dto: { businessId: 1, message: 'I own this business, here is proof.' } })

    expect(userRepository.findUserIdsByRole).toHaveBeenCalledWith('ADMIN')
    expect(createNotificationUseCase.execute).toHaveBeenCalledTimes(2)
    expect(createNotificationUseCase.execute).toHaveBeenCalledWith(expect.objectContaining({ userId: 100, type: NOTIFICATION_TYPE.CLAIM_SUBMITTED }))
    expect(createNotificationUseCase.execute).toHaveBeenCalledWith(expect.objectContaining({ userId: 101, type: NOTIFICATION_TYPE.CLAIM_SUBMITTED }))
  })

  it('throws BUSINESS_NOT_FOUND when the business does not exist', async () => {
    getBusinessSummaryUseCase.execute.mockResolvedValue(null)

    await expect(useCase.execute({ currentUserId: 5, dto: { businessId: 999, message: 'I own this business, here is proof.' } })).rejects.toBeInstanceOf(
      BusinessNotFoundException,
    )
  })

  it('throws BUSINESS_NOT_APPROVED when the business is not approved', async () => {
    getBusinessSummaryUseCase.execute.mockResolvedValue({ businessId: 1, name: 'Acme', status: 'pending', ownerUserId: null } as any)

    await expect(useCase.execute({ currentUserId: 5, dto: { businessId: 1, message: 'I own this business, here is proof.' } })).rejects.toBeInstanceOf(
      BusinessNotApprovedException,
    )
  })

  it('throws BUSINESS_ALREADY_CLAIMED when the business already has an owner', async () => {
    getBusinessSummaryUseCase.execute.mockResolvedValue({ businessId: 1, name: 'Acme', status: 'approved', ownerUserId: 3 } as any)

    await expect(useCase.execute({ currentUserId: 5, dto: { businessId: 1, message: 'I own this business, here is proof.' } })).rejects.toBeInstanceOf(
      BusinessAlreadyClaimedException,
    )
  })

  it('throws CLAIM_ALREADY_PENDING when the user already has a pending claim on this business', async () => {
    getBusinessSummaryUseCase.execute.mockResolvedValue({ businessId: 1, name: 'Acme', status: 'approved', ownerUserId: null } as any)
    businessClaimRepository.findPendingByUserAndBusiness.mockResolvedValue({ claimId: 4 })

    await expect(useCase.execute({ currentUserId: 5, dto: { businessId: 1, message: 'I own this business, here is proof.' } })).rejects.toBeInstanceOf(
      ClaimAlreadyPendingException,
    )
  })
})
