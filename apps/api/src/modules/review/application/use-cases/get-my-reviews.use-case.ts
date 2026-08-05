import { Injectable } from '@nestjs/common'
import { ReviewRepository } from '../../domain/repositories/review.repository'

@Injectable()
export class GetMyReviewsUseCase {
  constructor(private readonly reviewRepository: ReviewRepository) {}

  async execute({ userId, page, limit }: { userId: number; page?: number; limit?: number }) {
    return this.reviewRepository.listByUser(userId, Number(page) || 1, Number(limit) || 20)
  }
}
