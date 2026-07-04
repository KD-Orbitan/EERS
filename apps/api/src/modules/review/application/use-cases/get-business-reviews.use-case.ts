import { Injectable } from '@nestjs/common'
import { ReviewRepository } from '../../domain/repositories/review.repository'

@Injectable()
export class GetBusinessReviewsUseCase {
  constructor(private readonly reviewRepository: ReviewRepository) {}

  async execute({ businessId, currentUser, query }: { businessId: number; currentUser?: { role: string }; query?: { rating?: number; status?: string; page?: number; limit?: number } }) {
    return this.reviewRepository.listByBusiness(businessId, {
      rating: query?.rating,
      status: query?.status,
      page: query?.page ?? 1,
      limit: query?.limit ?? 20,
      admin: currentUser?.role === 'ADMIN',
    })
  }
}
