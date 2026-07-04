import { ReviewEntity } from '../entities/review.entity'

export interface ReviewCriteriaInput {
  criterionId: number
  ratingValue: number
}

export interface ReviewListItem {
  reviewId: number
  overallRating: number
  content: string
  status: string
  sentiment: string | null
  author: { userId: number; name: string }
  criteriaRatings: Array<{ criterionId: number; criterionName: string; ratingValue: number }>
  reply: { replyId: number; content: string; createdAt: string } | null
  createdAt: string
}

export interface ReviewDetail {
  reviewId: number
  overallRating: number
  content: string
  status: string
  sentiment: string | null
  author: { userId: number; name: string }
  business: { businessId: number; name: string }
  criteriaRatings: Array<{ criterionId: number; criterionName: string; ratingValue: number }>
  reply: { replyId: number; content: string; createdAt: string } | null
  createdAt: string
  updatedAt: string
}

export interface ReviewStatistics {
  reviewCount: number
  avgRating: number
  ratingDistribution: Record<number, number>
}

export abstract class ReviewRepository {
  abstract findById(reviewId: number): Promise<ReviewEntity | null>
  abstract findByWriterAndBusiness(writerUserId: number, businessId: number): Promise<ReviewEntity | null>
  abstract findBusinessById(businessId: number): Promise<{ businessId: number; status: string; ownerUserId: number; deletedAt: Date | null } | null>
  abstract findBusinessCriteria(businessId: number): Promise<Array<{ criterionId: number }>>
  abstract createReviewWithCriteria(params: {
    writerUserId: number
    businessId: number
    overallRating: number
    content: string
    criteriaRatings: ReviewCriteriaInput[]
  }): Promise<{ reviewId: number; status: string }>
  abstract updateReviewWithCriteria(reviewId: number, params: {
    overallRating?: number
    content?: string
    criteriaRatings?: ReviewCriteriaInput[]
  }): Promise<{ reviewId: number; status: string }>
  abstract softDeleteReview(reviewId: number): Promise<void>
  abstract listByBusiness(businessId: number, options: { rating?: number; status?: string; page: number; limit: number; admin?: boolean }): Promise<ReviewListItem[]>
  abstract listByUser(userId: number, page: number, limit: number): Promise<Array<{ reviewId: number; overallRating: number; status: string; business: { businessId: number; name: string }; createdAt: string }>>
  abstract getReviewDetail(reviewId: number, options?: { admin?: boolean }): Promise<ReviewDetail | null>
  abstract getReviewStatistics(businessId: number): Promise<ReviewStatistics>
  abstract getApprovedReviews(): Promise<Array<{ reviewId: number; businessId: number; overallRating: number; content: string }>>
}
