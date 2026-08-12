import { UploadGalleryUseCase } from '../application/use-cases/upload-gallery.use-case'
import { BusinessImageRepository } from '../domain/repositories/business-image.repository'
import { ValidateBusinessOwnershipUseCase } from '../application/use-cases/validate-business-ownership.use-case'
import { CloudinaryService } from '../../../infrastructure/storage/cloudinary.service'
import { GalleryLimitExceededException } from '../domain/exceptions/business.exceptions'

describe('UploadGalleryUseCase', () => {
  let useCase: UploadGalleryUseCase
  let businessImageRepository: jest.Mocked<BusinessImageRepository>
  let cloudinaryService: jest.Mocked<Pick<CloudinaryService, 'uploadImage' | 'deleteImage'>>
  let validateBusinessOwnershipUseCase: jest.Mocked<Pick<ValidateBusinessOwnershipUseCase, 'execute'>>

  const makeFile = (name: string) => ({ mimetype: 'image/png', size: 1024, buffer: Buffer.from(name) } as Express.Multer.File)

  beforeEach(() => {
    businessImageRepository = {
      findCoverByBusinessId: jest.fn(),
      createCover: jest.fn(),
      findLogoByBusinessId: jest.fn(),
      createLogo: jest.fn(),
      deleteById: jest.fn(),
      countGalleryImages: jest.fn(),
      getMaxGalleryDisplayOrder: jest.fn(),
      createGalleryImages: jest.fn(),
      findGalleryImage: jest.fn(),
      findGalleryImagesByIds: jest.fn(),
      updateGalleryDisplayOrders: jest.fn(),
    }
    cloudinaryService = { uploadImage: jest.fn(), deleteImage: jest.fn() }
    validateBusinessOwnershipUseCase = { execute: jest.fn().mockResolvedValue({ businessId: 1, ownerUserId: 5 }) }

    useCase = new UploadGalleryUseCase(
      businessImageRepository,
      cloudinaryService as unknown as CloudinaryService,
      validateBusinessOwnershipUseCase as unknown as ValidateBusinessOwnershipUseCase,
    )
  })

  it('creates multiple image records with imageType BUSINESS_GALLERY and sequential displayOrder', async () => {
    businessImageRepository.countGalleryImages.mockResolvedValue(2)
    businessImageRepository.getMaxGalleryDisplayOrder.mockResolvedValue(2)
    cloudinaryService.uploadImage
      .mockResolvedValueOnce({ public_id: 'g1', secure_url: 'https://cdn/g1.png' } as any)
      .mockResolvedValueOnce({ public_id: 'g2', secure_url: 'https://cdn/g2.png' } as any)
    businessImageRepository.createGalleryImages.mockResolvedValue([
      { imageId: 30, cloudinaryPublicId: 'g1', secureUrl: 'https://cdn/g1.png', displayOrder: 3 },
      { imageId: 31, cloudinaryPublicId: 'g2', secureUrl: 'https://cdn/g2.png', displayOrder: 4 },
    ])

    const result = await useCase.execute({
      businessId: 1,
      user: { userId: 5, role: 'BUSINESS_OWNER' },
      files: [makeFile('a'), makeFile('b')],
    })

    expect(businessImageRepository.createGalleryImages).toHaveBeenCalledWith([
      expect.objectContaining({ businessId: 1, cloudinaryPublicId: 'g1', displayOrder: 3 }),
      expect.objectContaining({ businessId: 1, cloudinaryPublicId: 'g2', displayOrder: 4 }),
    ])
    expect(result).toEqual({
      images: [
        { imageId: 30, url: 'https://cdn/g1.png', displayOrder: 3 },
        { imageId: 31, url: 'https://cdn/g2.png', displayOrder: 4 },
      ],
    })
  })

  it('throws GALLERY_LIMIT_EXCEEDED when limit reached', async () => {
    businessImageRepository.countGalleryImages.mockResolvedValue(19)

    await expect(
      useCase.execute({ businessId: 1, user: { userId: 5, role: 'BUSINESS_OWNER' }, files: [makeFile('a'), makeFile('b')] }),
    ).rejects.toBeInstanceOf(GalleryLimitExceededException)
    expect(cloudinaryService.uploadImage).not.toHaveBeenCalled()
  })

  it('throws whatever the ownership check throws if user is not owner', async () => {
    const forbiddenError = new Error('Access denied')
    validateBusinessOwnershipUseCase.execute.mockRejectedValue(forbiddenError)

    await expect(useCase.execute({ businessId: 1, user: { userId: 99, role: 'USER' }, files: [makeFile('a')] })).rejects.toBe(forbiddenError)
    expect(businessImageRepository.countGalleryImages).not.toHaveBeenCalled()
  })
})
