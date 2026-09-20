import { ForbiddenException } from '@nestjs/common'
import { UploadReviewPhotosUseCase } from '../application/use-cases/upload-review-photos.use-case'
import { ReviewRepository } from '../domain/repositories/review.repository'
import { ReviewImageRepository } from '../domain/repositories/review-image.repository'
import { ImageStorage } from '../../../common/ports/image-storage.port'
import { ReviewNotFoundException, PhotoLimitExceededException } from '../domain/exceptions/review.exceptions'
import { InvalidFileTypeException } from '../../../common/exceptions/file.exceptions'

describe('UploadReviewPhotosUseCase', () => {
  let useCase: UploadReviewPhotosUseCase
  let reviewRepository: jest.Mocked<Pick<ReviewRepository, 'findById'>>
  let reviewImageRepository: jest.Mocked<ReviewImageRepository>
  let imageStorage: jest.Mocked<Pick<ImageStorage, 'uploadImage' | 'deleteImage'>>

  const validFile = { mimetype: 'image/png', size: 1024, buffer: Buffer.from('data') } as Express.Multer.File

  beforeEach(() => {
    reviewRepository = { findById: jest.fn() }
    reviewImageRepository = {
      countByReviewId: jest.fn(),
      createMany: jest.fn(),
      findById: jest.fn(),
      deleteById: jest.fn(),
    }
    imageStorage = { uploadImage: jest.fn(), deleteImage: jest.fn() }

    useCase = new UploadReviewPhotosUseCase(
      reviewRepository as unknown as ReviewRepository,
      reviewImageRepository,
      imageStorage as unknown as ImageStorage,
    )
  })

  it('creates image records with imageType REVIEW_PHOTO for the review author', async () => {
    reviewRepository.findById.mockResolvedValue({ reviewId: 1, writerUserId: 5, deletedAt: null } as any)
    reviewImageRepository.countByReviewId.mockResolvedValue(0)
    imageStorage.uploadImage.mockResolvedValue({ publicId: 'r1', secureUrl: 'https://cdn/r1.png' } as any)
    reviewImageRepository.createMany.mockResolvedValue([{ imageId: 40, cloudinaryPublicId: 'r1', secureUrl: 'https://cdn/r1.png' }])

    const result = await useCase.execute({ reviewId: 1, user: { userId: 5, role: 'USER' }, files: [validFile] })

    expect(reviewImageRepository.createMany).toHaveBeenCalledWith([expect.objectContaining({ reviewId: 1, cloudinaryPublicId: 'r1' })])
    expect(result).toEqual({ photos: [{ imageId: 40, url: 'https://cdn/r1.png' }] })
  })

  it('allows admin to upload photos on a review they do not own', async () => {
    reviewRepository.findById.mockResolvedValue({ reviewId: 1, writerUserId: 5, deletedAt: null } as any)
    reviewImageRepository.countByReviewId.mockResolvedValue(0)
    imageStorage.uploadImage.mockResolvedValue({ publicId: 'r1', secureUrl: 'https://cdn/r1.png' } as any)
    reviewImageRepository.createMany.mockResolvedValue([{ imageId: 41, cloudinaryPublicId: 'r1', secureUrl: 'https://cdn/r1.png' }])

    await expect(useCase.execute({ reviewId: 1, user: { userId: 99, role: 'ADMIN' }, files: [validFile] })).resolves.toBeDefined()
  })

  it('throws FORBIDDEN when a different non-admin user tries to upload', async () => {
    reviewRepository.findById.mockResolvedValue({ reviewId: 1, writerUserId: 5, deletedAt: null } as any)

    await expect(useCase.execute({ reviewId: 1, user: { userId: 99, role: 'USER' }, files: [validFile] })).rejects.toBeInstanceOf(ForbiddenException)
    expect(imageStorage.uploadImage).not.toHaveBeenCalled()
  })

  it('throws REVIEW_NOT_FOUND for missing or deleted review', async () => {
    reviewRepository.findById.mockResolvedValue(null)

    await expect(useCase.execute({ reviewId: 999, user: { userId: 5, role: 'USER' }, files: [validFile] })).rejects.toBeInstanceOf(ReviewNotFoundException)
  })

  it('throws PHOTO_LIMIT_EXCEEDED when upload would exceed the 5-photo cap', async () => {
    reviewRepository.findById.mockResolvedValue({ reviewId: 1, writerUserId: 5, deletedAt: null } as any)
    reviewImageRepository.countByReviewId.mockResolvedValue(4)

    await expect(
      useCase.execute({ reviewId: 1, user: { userId: 5, role: 'USER' }, files: [validFile, validFile] }),
    ).rejects.toBeInstanceOf(PhotoLimitExceededException)
    expect(imageStorage.uploadImage).not.toHaveBeenCalled()
  })

  it('throws INVALID_FILE_TYPE for a non-image file', async () => {
    reviewRepository.findById.mockResolvedValue({ reviewId: 1, writerUserId: 5, deletedAt: null } as any)
    reviewImageRepository.countByReviewId.mockResolvedValue(0)
    const badFile = { ...validFile, mimetype: 'application/pdf' } as Express.Multer.File

    await expect(useCase.execute({ reviewId: 1, user: { userId: 5, role: 'USER' }, files: [badFile] })).rejects.toBeInstanceOf(
      InvalidFileTypeException,
    )
  })
})
