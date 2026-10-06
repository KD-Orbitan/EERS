import { Injectable } from '@nestjs/common'
import { ScoringConfig, ScoringConfigPort } from '../ports/scoring-config.port'
import { RankingRepository } from '../ports/ranking.repository'
import { SimilarityPort } from '../ports/similarity.port'

@Injectable()
export class FraudDetectionService {
  constructor(
    private readonly scoringConfigService: ScoringConfigPort,
    private readonly rankingDbService: RankingRepository,
    private readonly similarityService: SimilarityPort,
  ) {}

  private async computeDuplicateSignal(reviewId: number, reviewContent: string, businessId: number, config: ScoringConfig) {
    if (reviewContent.length < config.lDup) {
      return 0
    }

    const approvedReviews = await this.rankingDbService.getDuplicateCandidates(businessId, reviewId)

    for (const other of approvedReviews) {
      if (!other.content || Number(other.reviewId) === reviewId) {
        continue
      }
      if (other.content === reviewContent) return 1
      const similarity = await this.similarityService.computeSimilarity(reviewContent, other.content)
      if (similarity > config.thetaDup) {
        return 1
      }
    }

    return 0
  }

  private async computeSpamSignal(reviewId: number, userId: number, createdAt: Date, config: ScoringConfig) {
    const windowStart = new Date(createdAt.getTime() - config.spamWindowHours * 60 * 60 * 1000)
    const count = await this.rankingDbService.countUserReviewsInWindow(userId, windowStart, createdAt)
    return Math.min(1, count / config.thetaSpam)
  }

  async computeForReviews(reviews: Array<{ reviewId: number; businessId: number; writerUserId: number; content: string; createdAt: Date }>, config?: ScoringConfig) {
    config ??= await this.scoringConfigService.getConfig()
    const userIds = Array.from(new Set(reviews.map((review) => review.writerUserId)))
    const trustScores = await this.rankingDbService.getUserTrustScoresByUserIds(userIds)
    const trustScoreByUser = new Map(trustScores.map((item) => [item.userId, item.trustScore]))

    for (const review of reviews) {
      const D_i = await this.computeDuplicateSignal(review.reviewId, review.content, review.businessId, config)
      const S_i = await this.computeSpamSignal(review.reviewId, review.writerUserId, review.createdAt, config)
      const trustValue = trustScoreByUser.get(review.writerUserId) ?? 0.5
      const trustSignal = 1 - trustValue
      const fraudScore = config.fraudLambda1 * D_i + config.fraudLambda2 * S_i + config.fraudLambda3 * trustSignal
      const fraudStatus = fraudScore >= config.thetaReject ? 'REJECTED' : fraudScore >= config.thetaSus ? 'SUSPICIOUS' : 'VALID'

      await this.rankingDbService.upsertReviewFraudScore({
        reviewId: review.reviewId,
        fraudScore,
        duplicateSignal: D_i,
        spamSignal: S_i,
        trustSignal,
        fraudStatus,
      })
    }
  }
}
