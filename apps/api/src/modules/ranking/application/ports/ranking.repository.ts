export type ApprovedBusinessRecord = {
  businessId: number
  categoryIds: number[]
  province: string | null
  avgRating: number
}

export type ApprovedReviewRecord = {
  reviewId: number
  businessId: number
  writerUserId: number
  content: string
  overallRating: number
  createdAt: Date
}

export type ReviewCriterionRecord = {
  reviewId: number
  criterionId: number
  ratingValue: number
}

export type CriterionWeightRecord = {
  categoryId: number
  criterionId: number
  weight: number
}

export type UserTrustScoreRecord = {
  userId: number
  trustScore: number
}

export type RankingSnapshotWrite = {
  scope: string
  scopeId: number | null
  rank: number
  rankingScore: number
  avgRating: number
  reviewCount: number
  businessId: number
}

export abstract class RankingRepository {
  abstract getDuplicateCandidates(businessId: number, excludeReviewId: number): Promise<Array<{ reviewId: number; content: string }>>
  abstract countUserReviewsInWindow(userId: number, from: Date, before: Date): Promise<number>
  abstract getReviewFraudStatuses(reviewIds: number[]): Promise<Array<{ reviewId: number; fraudStatus: string }>>
  /** Atomically replace all scopes, append GLOBAL history, and prune expired history. */
  abstract replaceSnapshotsWithHistory(snapshots: RankingSnapshotWrite[], retentionCutoff: Date): Promise<void>
  abstract getApprovedBusinesses(): Promise<ApprovedBusinessRecord[]>
  abstract getApprovedReviewsByBusinessIds(businessIds: number[]): Promise<ApprovedReviewRecord[]>
  abstract getReviewCriteriaByReviewIds(reviewIds: number[]): Promise<ReviewCriterionRecord[]>
  abstract getCriterionWeightsByCategoryIds(categoryIds: number[]): Promise<CriterionWeightRecord[]>
  abstract getUserTrustScoresByUserIds(userIds: number[]): Promise<UserTrustScoreRecord[]>
  abstract getAllUsers(): Promise<Array<{ userId: number; createdAt: Date }>>
  abstract getApprovedReviewCountsByUser(): Promise<Map<number, number>>
  abstract getFlaggedReviewCountsByUser(): Promise<Map<number, number>>
  abstract upsertUserTrustScore(params: {
    userId: number
    trustScore: number
    validReviews: number
    accountAgeDays: number
    flaggedCount: number
  }): Promise<void>
  abstract upsertReviewFraudScore(params: {
    reviewId: number
    fraudScore: number
    duplicateSignal: number
    spamSignal: number
    trustSignal: number
    fraudStatus: string
  }): Promise<void>
  abstract updateBusinessAvgRating(businessId: number, avgRating: number): Promise<void>
}
