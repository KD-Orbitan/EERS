import { Injectable, ForbiddenException } from '@nestjs/common'
import type { UploadApiResponse } from 'cloudinary'
import { ReviewRepository } from '../../domain/repositories/review.repository'
import { ReviewImageRepository } from '../../domain/repositories/review-image.repository'
import { ReviewNotFoundException, PhotoLimitExceededException } from '../../domain/exceptions/review.exceptions'
import { CloudinaryService } from '../../../../infrastructure/storage/cloudinary.service'
import { assertValidImageFile } from '../../../../common/validators/image-file.validator'

const MAX_REVIEW_PHOTOS = 5

@Injectable()
export class UploadReviewPhotosUseCase {
  constructor(
    private readonly reviewRepository: ReviewRepository,
    private readonly reviewImageRepository: ReviewImageRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async execute({
    reviewId,
    user,
    files,
  }: {
    reviewId: number
    user: { userId: number; role: string }
    files: Express.Multer.File[]
  }) {
    const review = await this.reviewRepository.findById(reviewId)
    if (!review || review.deletedAt) {
      throw new ReviewNotFoundException()
    }
    if (user.role !== 'ADMIN' && review.writerUserId !== user.userId) {
      throw new ForbiddenException('Forbidden')
    }

    files.forEach(assertValidImageFile)

    const existingCount = await this.reviewImageRepository.countByReviewId(reviewId)
    if (existingCount + files.length > MAX_REVIEW_PHOTOS) {
      throw new PhotoLimitExceededException()
    }

    const uploadResults = (await Promise.all(
      files.map((file, index) => this.cloudinaryService.uploadImage(file.buffer, `review-${reviewId}-${Date.now()}-${index}`)),
    )) as UploadApiResponse[]

    const created = await this.reviewImageRepository.createMany(
      uploadResults.map((result) => ({
        reviewId,
        cloudinaryPublicId: result.public_id,
        secureUrl: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
      })),
    )

    return {
      photos: created.map((photo) => ({ imageId: photo.imageId, url: photo.secureUrl })),
    }
  }
}
