import { Injectable, ForbiddenException } from '@nestjs/common'
import { ReviewRepository } from '../../domain/repositories/review.repository'
import { ReviewImageRepository } from '../../domain/repositories/review-image.repository'
import { ReviewNotFoundException } from '../../domain/exceptions/review.exceptions'
import { ImageNotFoundException } from '../../../../common/exceptions/file.exceptions'
import { ImageStorage } from '../../../../common/ports/image-storage.port'

@Injectable()
export class DeleteReviewPhotoUseCase {
  constructor(
    private readonly reviewRepository: ReviewRepository,
    private readonly reviewImageRepository: ReviewImageRepository,
    private readonly imageStorage: ImageStorage,
  ) {}

  async execute({
    reviewId,
    imageId,
    user,
  }: {
    reviewId: number
    imageId: number
    user: { userId: number; role: string }
  }) {
    const review = await this.reviewRepository.findById(reviewId)
    if (!review || review.deletedAt) {
      throw new ReviewNotFoundException()
    }
    if (user.role !== 'ADMIN' && review.writerUserId !== user.userId) {
      throw new ForbiddenException('Forbidden')
    }

    const photo = await this.reviewImageRepository.findById(reviewId, imageId)
    if (!photo) {
      throw new ImageNotFoundException()
    }

    await this.imageStorage.deleteImage(photo.cloudinaryPublicId)
    await this.reviewImageRepository.deleteById(photo.imageId)
  }
}
