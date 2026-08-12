import { ForbiddenException } from '@nestjs/common'
import { DeleteReviewPhotoUseCase } from '../application/use-cases/delete-review-photo.use-case'
import { ReviewRepository } from '../domain/repositories/review.repository'
import { ReviewImageRepository } from '../domain/repositories/review-image.repository'
import { CloudinaryService } from '../../../infrastructure/storage/cloudinary.service'
import { ReviewNotFoundException } from '../domain/exceptions/review.exceptions'
import { ImageNotFoundException } from '../../../common/exceptions/file.exceptions'

describe('DeleteReviewPhotoUseCase', () => {
  let useCase: DeleteReviewPhotoUseCase
  let reviewRepository: jest.Mocked<Pick<ReviewRepository, 'findById'>>
  let reviewImageRepository: jest.Mocked<Pick<ReviewImageRepository, 'findById' | 'deleteById'>>
  let cloudinaryService: jest.Mocked<Pick<CloudinaryService, 'deleteImage'>>

  beforeEach(() => {
    reviewRepository = { findById: jest.fn() }
    reviewImageRepository = { findById: jest.fn(), deleteById: jest.fn() }
    cloudinaryService = { deleteImage: jest.fn() }

    useCase = new DeleteReviewPhotoUseCase(
      reviewRepository as unknown as ReviewRepository,
      reviewImageRepository as unknown as ReviewImageRepository,
      cloudinaryService as unknown as CloudinaryService,
    )
  })

  it('deletes the photo from Cloudinary and DB', async () => {
    reviewRepository.findById.mockResolvedValue({ reviewId: 1, writerUserId: 5, deletedAt: null } as any)
    reviewImageRepository.findById.mockResolvedValue({ imageId: 40, cloudinaryPublicId: 'r1', secureUrl: 'https://cdn/r1.png' })

    await useCase.execute({ reviewId: 1, imageId: 40, user: { userId: 5, role: 'USER' } })

    expect(cloudinaryService.deleteImage).toHaveBeenCalledWith('r1')
    expect(reviewImageRepository.deleteById).toHaveBeenCalledWith(40)
  })

  it('throws IMAGE_NOT_FOUND when the photo does not belong to the review', async () => {
    reviewRepository.findById.mockResolvedValue({ reviewId: 1, writerUserId: 5, deletedAt: null } as any)
    reviewImageRepository.findById.mockResolvedValue(null)

    await expect(useCase.execute({ reviewId: 1, imageId: 999, user: { userId: 5, role: 'USER' } })).rejects.toBeInstanceOf(
      ImageNotFoundException,
    )
    expect(cloudinaryService.deleteImage).not.toHaveBeenCalled()
  })

  it('throws FORBIDDEN when a different non-admin user tries to delete', async () => {
    reviewRepository.findById.mockResolvedValue({ reviewId: 1, writerUserId: 5, deletedAt: null } as any)

    await expect(useCase.execute({ reviewId: 1, imageId: 40, user: { userId: 99, role: 'USER' } })).rejects.toBeInstanceOf(
      ForbiddenException,
    )
    expect(reviewImageRepository.findById).not.toHaveBeenCalled()
  })

  it('throws REVIEW_NOT_FOUND for missing or deleted review', async () => {
    reviewRepository.findById.mockResolvedValue(null)

    await expect(useCase.execute({ reviewId: 999, imageId: 40, user: { userId: 5, role: 'USER' } })).rejects.toBeInstanceOf(
      ReviewNotFoundException,
    )
  })
})
