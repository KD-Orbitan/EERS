import { DeleteCoverUseCase } from '../application/use-cases/delete-cover.use-case'
import { BusinessImageRepository } from '../domain/repositories/business-image.repository'
import { ValidateBusinessOwnershipUseCase } from '../application/use-cases/validate-business-ownership.use-case'
import { ImageStorage } from '../../../common/ports/image-storage.port'
import { ImageNotFoundException } from '../../../common/exceptions/file.exceptions'

describe('DeleteCoverUseCase', () => {
  let useCase: DeleteCoverUseCase
  let businessImageRepository: jest.Mocked<Pick<BusinessImageRepository, 'findCoverByBusinessId' | 'deleteById'>>
  let imageStorage: jest.Mocked<Pick<ImageStorage, 'deleteImage'>>
  let validateBusinessOwnershipUseCase: jest.Mocked<Pick<ValidateBusinessOwnershipUseCase, 'execute'>>

  beforeEach(() => {
    businessImageRepository = { findCoverByBusinessId: jest.fn(), deleteById: jest.fn() }
    imageStorage = { deleteImage: jest.fn() }
    validateBusinessOwnershipUseCase = { execute: jest.fn().mockResolvedValue({ businessId: 1, ownerUserId: 5 }) }

    useCase = new DeleteCoverUseCase(
      businessImageRepository as unknown as BusinessImageRepository,
      imageStorage as unknown as ImageStorage,
      validateBusinessOwnershipUseCase as unknown as ValidateBusinessOwnershipUseCase,
    )
  })

  it('deletes cover from Cloudinary and DB', async () => {
    businessImageRepository.findCoverByBusinessId.mockResolvedValue({
      imageId: 3,
      cloudinaryPublicId: 'eers/cover-3',
      secureUrl: 'https://cdn.example.com/cover-3.png',
    })

    await useCase.execute({ businessId: 1, user: { userId: 5, role: 'BUSINESS_OWNER' } })

    expect(imageStorage.deleteImage).toHaveBeenCalledWith('eers/cover-3')
    expect(businessImageRepository.deleteById).toHaveBeenCalledWith(3)
  })

  it('throws IMAGE_NOT_FOUND when there is no cover', async () => {
    businessImageRepository.findCoverByBusinessId.mockResolvedValue(null)

    await expect(useCase.execute({ businessId: 1, user: { userId: 5, role: 'BUSINESS_OWNER' } })).rejects.toBeInstanceOf(ImageNotFoundException)
    expect(imageStorage.deleteImage).not.toHaveBeenCalled()
  })

  it('throws whatever the ownership check throws if user is not owner', async () => {
    const forbiddenError = new Error('Access denied')
    validateBusinessOwnershipUseCase.execute.mockRejectedValue(forbiddenError)

    await expect(useCase.execute({ businessId: 1, user: { userId: 99, role: 'USER' } })).rejects.toBe(forbiddenError)
    expect(businessImageRepository.findCoverByBusinessId).not.toHaveBeenCalled()
  })
})
