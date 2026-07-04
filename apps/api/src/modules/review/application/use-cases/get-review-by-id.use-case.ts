import { Injectable, ForbiddenException } from '@nestjs/common'
import { ReviewRepository } from '../../domain/repositories/review.repository'
import { ReviewNotFoundException } from '../../domain/exceptions/review.exceptions'

@Injectable()
export class GetReviewByIdUseCase {
  constructor(private readonly reviewRepository: ReviewRepository) {}

  async execute({ reviewId, currentUser }: { reviewId: number; currentUser?: { userId: number; role: string } }) {
    const review = await this.reviewRepository.getReviewDetail(reviewId, { admin: currentUser?.role === 'ADMIN' })
    if (!review) {
      throw new ReviewNotFoundException()
    }

    const isPublic = review.status === 'approved' || review.status === 'pending'
    if (!isPublic && currentUser?.role !== 'ADMIN') {
      throw new ForbiddenException('Access denied')
    }

    return review
  }
}
