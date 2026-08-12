import { DeleteGalleryImageUseCase } from '../application/use-cases/delete-gallery-image.use-case'
import { BusinessImageRepository } from '../domain/repositories/business-image.repository'
import { ValidateBusinessOwnershipUseCase } from '../application/use-cases/validate-business-ownership.use-case'
import { CloudinaryService } from '../../../infrastructure/storage/cloudinary.service'
import { ImageNotFoundException } from '../../../common/exceptions/file.exceptions'

describe('DeleteGalleryImageUseCase', () => {
  let useCase: DeleteGalleryImageUseCase
  let businessImageRepository: jest.Mocked<Pick<BusinessImageRepository, 'findGalleryImage' | 'deleteById'>>
  let cloudinaryService: jest.Mocked<Pick<CloudinaryService, 'deleteImage'>>
  let validateBusinessOwnershipUseCase: jest.Mocked<Pick<ValidateBusinessOwnershipUseCase, 'execute'>>

  beforeEach(() => {
    businessImageRepository = { findGalleryImage: jest.fn(), deleteById: jest.fn() }
    cloudinaryService = { deleteImage: jest.fn() }
    validateBusinessOwnershipUseCase = { execute: jest.fn().mockResolvedValue({ businessId: 1, ownerUserId: 5 }) }

    useCase = new DeleteGalleryImageUseCase(
      businessImageRepository as unknown as BusinessImageRepository,
      cloudinaryService as unknown as CloudinaryService,
      validateBusinessOwnershipUseCase as unknown as ValidateBusinessOwnershipUseCase,
    )
  })

  it('deletes specific gallery image', async () => {
    businessImageRepository.findGalleryImage.mockResolvedValue({
      imageId: 40,
      cloudinaryPublicId: 'eers/gallery-40',
      secureUrl: 'https://cdn/gallery-40.png',
      displayOrder: 1,
    })

    await useCase.execute({ businessId: 1, user: { userId: 5, role: 'BUSINESS_OWNER' }, imageId: 40 })

    expect(businessImageRepository.findGalleryImage).toHaveBeenCalledWith(1, 40)
    expect(cloudinaryService.deleteImage).toHaveBeenCalledWith('eers/gallery-40')
    expect(businessImageRepository.deleteById).toHaveBeenCalledWith(40)
  })

  it('throws IMAGE_NOT_FOUND if imageId does not belong to business gallery', async () => {
    businessImageRepository.findGalleryImage.mockResolvedValue(null)

    await expect(useCase.execute({ businessId: 1, user: { userId: 5, role: 'BUSINESS_OWNER' }, imageId: 999 })).rejects.toBeInstanceOf(
      ImageNotFoundException,
    )
    expect(cloudinaryService.deleteImage).not.toHaveBeenCalled()
  })
})
