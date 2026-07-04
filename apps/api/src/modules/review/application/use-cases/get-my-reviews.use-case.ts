import { Injectable } from '@nestjs/common'
import { ReviewRepository } from '../../domain/repositories/review.repository'

@Injectable()
export class GetMyReviewsUseCase {
  constructor(private readonly reviewRepository: ReviewRepository) {}

  async execute({ userId, page, limit }: { userId: number; page?: number; limit?: number }) {
    return this.reviewRepository.listByUser(userId, page ?? 1, limit ?? 20)
  }
}
