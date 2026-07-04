import { UpdateBusinessUseCase } from '../application/use-cases/update-business.use-case'
import { BusinessRepository } from '../domain/repositories/business.repository'
import { EmailAlreadyExistsException, PhoneAlreadyExistsException } from '../domain/exceptions/business.exceptions'

describe('UpdateBusinessUseCase', () => {
  let businessRepository: jest.Mocked<Pick<BusinessRepository, 'findById' | 'findByPhone' | 'findByEmail' | 'updateBusiness'>>
  let useCase: UpdateBusinessUseCase

  beforeEach(() => {
    businessRepository = {
      findById: jest.fn(),
      findByPhone: jest.fn(),
      findByEmail: jest.fn(),
      updateBusiness: jest.fn(),
    }
    useCase = new UpdateBusinessUseCase(businessRepository as unknown as BusinessRepository)
  })

  it('updates business when owner', async () => {
    businessRepository.findById.mockResolvedValue({ businessId: 1, ownerUserId: 5 } as any)
    businessRepository.findByPhone.mockResolvedValue(null)
    businessRepository.findByEmail.mockResolvedValue(null)
    businessRepository.updateBusiness.mockResolvedValue({ businessId: 1 })

    const result = await useCase.execute({
      businessId: 1,
      user: { userId: 5, role: 'BUSINESS_OWNER' },
      dto: { name: 'New Name' },
    })

    expect(result).toEqual({ businessId: 1 })
    expect(businessRepository.updateBusiness).toHaveBeenCalledWith(1, { name: 'New Name' })
  })

  it('throws PHONE_ALREADY_EXISTS when phone belongs to another business', async () => {
    businessRepository.findById.mockResolvedValue({ businessId: 1, ownerUserId: 5 } as any)
    businessRepository.findByPhone.mockResolvedValue({ businessId: 2 } as any)

    await expect(
      useCase.execute({
        businessId: 1,
        user: { userId: 5, role: 'BUSINESS_OWNER' },
        dto: { phone: '1234' },
      }),
    ).rejects.toBeInstanceOf(PhoneAlreadyExistsException)
  })

  it('throws EMAIL_ALREADY_EXISTS when email belongs to another business', async () => {
    businessRepository.findById.mockResolvedValue({ businessId: 1, ownerUserId: 5 } as any)
    businessRepository.findByPhone.mockResolvedValue(null)
    businessRepository.findByEmail.mockResolvedValue({ businessId: 2 } as any)

    await expect(
      useCase.execute({
        businessId: 1,
        user: { userId: 5, role: 'BUSINESS_OWNER' },
        dto: { email: 'existing@biz.com' },
      }),
    ).rejects.toBeInstanceOf(EmailAlreadyExistsException)
  })
})
