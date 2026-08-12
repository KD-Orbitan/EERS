import { UploadCoverUseCase } from '../application/use-cases/upload-cover.use-case'
import { BusinessImageRepository } from '../domain/repositories/business-image.repository'
import { ValidateBusinessOwnershipUseCase } from '../application/use-cases/validate-business-ownership.use-case'
import { CloudinaryService } from '../../../infrastructure/storage/cloudinary.service'
import { InvalidFileTypeException } from '../../../common/exceptions/file.exceptions'
import { BusinessNotFoundException } from '../domain/exceptions/business.exceptions'

describe('UploadCoverUseCase', () => {
  let useCase: UploadCoverUseCase
  let businessImageRepository: jest.Mocked<BusinessImageRepository>
  let cloudinaryService: jest.Mocked<Pick<CloudinaryService, 'uploadImage' | 'deleteImage'>>
  let validateBusinessOwnershipUseCase: jest.Mocked<Pick<ValidateBusinessOwnershipUseCase, 'execute'>>

  const validFile = { mimetype: 'image/png', size: 1024, buffer: Buffer.from('data') } as Express.Multer.File

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

    useCase = new UploadCoverUseCase(
      businessImageRepository,
      cloudinaryService as unknown as CloudinaryService,
      validateBusinessOwnershipUseCase as unknown as ValidateBusinessOwnershipUseCase,
    )
  })

  it('saves image with imageType BUSINESS_COVER and correct businessId', async () => {
    businessImageRepository.findCoverByBusinessId.mockResolvedValue(null)
    cloudinaryService.uploadImage.mockResolvedValue({
      public_id: 'eers/cover-1',
      secure_url: 'https://cdn.example.com/cover-1.png',
      width: 800,
      height: 400,
      format: 'png',
    } as any)
    businessImageRepository.createCover.mockResolvedValue({
      imageId: 20,
      cloudinaryPublicId: 'eers/cover-1',
      secureUrl: 'https://cdn.example.com/cover-1.png',
    })

    const result = await useCase.execute({ businessId: 1, user: { userId: 5, role: 'BUSINESS_OWNER' }, file: validFile })

    expect(validateBusinessOwnershipUseCase.execute).toHaveBeenCalledWith({ businessId: 1, user: { userId: 5, role: 'BUSINESS_OWNER' } })
    expect(businessImageRepository.createCover).toHaveBeenCalledWith(expect.objectContaining({ businessId: 1, cloudinaryPublicId: 'eers/cover-1' }))
    expect(result).toEqual({ coverUrl: 'https://cdn.example.com/cover-1.png' })
  })

  it('replaces existing cover (deletes old from Cloudinary + DB)', async () => {
    businessImageRepository.findCoverByBusinessId.mockResolvedValue({
      imageId: 9,
      cloudinaryPublicId: 'eers/old-cover',
      secureUrl: 'https://cdn.example.com/old-cover.png',
    })
    cloudinaryService.uploadImage.mockResolvedValue({
      public_id: 'eers/new-cover',
      secure_url: 'https://cdn.example.com/new-cover.png',
    } as any)
    businessImageRepository.createCover.mockResolvedValue({
      imageId: 21,
      cloudinaryPublicId: 'eers/new-cover',
      secureUrl: 'https://cdn.example.com/new-cover.png',
    })

    await useCase.execute({ businessId: 1, user: { userId: 5, role: 'BUSINESS_OWNER' }, file: validFile })

    expect(cloudinaryService.deleteImage).toHaveBeenCalledWith('eers/old-cover')
    expect(businessImageRepository.deleteById).toHaveBeenCalledWith(9)
  })

  it('throws whatever the ownership check throws when user is not owner', async () => {
    const forbiddenError = new Error('Access denied')
    validateBusinessOwnershipUseCase.execute.mockRejectedValue(forbiddenError)

    await expect(useCase.execute({ businessId: 1, user: { userId: 99, role: 'USER' }, file: validFile })).rejects.toBe(forbiddenError)
    expect(cloudinaryService.uploadImage).not.toHaveBeenCalled()
  })

  it('throws BUSINESS_NOT_FOUND for invalid businessId', async () => {
    validateBusinessOwnershipUseCase.execute.mockRejectedValue(new BusinessNotFoundException())

    await expect(useCase.execute({ businessId: 999, user: { userId: 5, role: 'BUSINESS_OWNER' }, file: validFile })).rejects.toBeInstanceOf(
      BusinessNotFoundException,
    )
  })

  it('throws INVALID_FILE_TYPE for wrong format', async () => {
    const badFile = { ...validFile, mimetype: 'application/pdf' } as Express.Multer.File

    await expect(useCase.execute({ businessId: 1, user: { userId: 5, role: 'BUSINESS_OWNER' }, file: badFile })).rejects.toBeInstanceOf(
      InvalidFileTypeException,
    )
    expect(cloudinaryService.uploadImage).not.toHaveBeenCalled()
  })
})
