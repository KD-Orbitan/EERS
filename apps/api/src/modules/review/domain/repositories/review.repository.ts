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
  photos: Array<{ imageId: number; url: string }>
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
  photos: Array<{ imageId: number; url: string }>
  reply: { replyId: number; content: string; createdAt: string } | null
  createdAt: string
  updatedAt: string
}

export interface ReviewStatistics {
  reviewCount: number
  avgRating: number
  ratingDistribution: Record<number, number>
}

export interface SentimentSummary {
  positive: number
  neutral: number
  negative: number
  totalReviews: number
}

export interface CriteriaScoreItem {
  criterionId: number
  criterionName: string
  avgRating: number
  reviewCount: number
}

export interface MyReviewListItem {
  reviewId: number
  overallRating: number
  status: string
  business: { businessId: number; name: string }
  createdAt: string
}

export interface RecentReviewItem {
  reviewId: number
  overallRating: number
  content: string
  author: { name: string }
  business: { businessId: number; name: string }
  createdAt: string
}

export abstract class ReviewRepository {
  abstract findById(reviewId: number): Promise<ReviewEntity | null>
  abstract findByWriterAndBusiness(writerUserId: number, businessId: number): Promise<ReviewEntity | null>
  abstract findBusinessById(businessId: number): Promise<{ businessId: number; status: string; ownerUserId: number | null; deletedAt: Date | null } | null>
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
  abstract updateSentiment(reviewId: number, result: { sentiment: string; sentimentScore: number; sentimentAnalyzedAt: Date }): Promise<void>
  abstract findUnanalyzed(limit: number): Promise<Array<{ reviewId: number; content: string }>>
  abstract listByBusiness(businessId: number, options: { rating?: number; status?: string; page: number; limit: number; admin?: boolean }): Promise<{ items: ReviewListItem[]; total: number }>
  abstract listByUser(userId: number, page: number, limit: number): Promise<{ items: MyReviewListItem[]; total: number }>
  abstract getReviewDetail(reviewId: number, options?: { admin?: boolean }): Promise<ReviewDetail | null>
  abstract getReviewStatistics(businessId: number): Promise<ReviewStatistics>
  abstract getSentimentSummary(businessId: number): Promise<SentimentSummary>
  abstract getCriteriaScores(businessId: number): Promise<CriteriaScoreItem[]>
  abstract getApprovedReviews(): Promise<Array<{ reviewId: number; businessId: number; overallRating: number; content: string }>>
  abstract getRecentReviews(limit: number): Promise<RecentReviewItem[]>
}
