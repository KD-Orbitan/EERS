import { Injectable, Logger } from '@nestjs/common'
import { ScoringConfigPort } from '../ports/scoring-config.port'
import { RankingRepository } from '../ports/ranking.repository'
import { RankingCachePort } from '../ports/ranking-cache.port'
import { TrustScoreService } from './trust-score.service'
import { FraudDetectionService } from './fraud-detection.service'
import { MultiCriteriaScoringService } from './multi-criteria-scoring.service'
import { ReviewWeightingService } from './review-weighting.service'
import { RANKING_HISTORY_RETENTION_DAYS } from '../ports/ranking-trend-config.port'

@Injectable()
export class RankingCalculationService {
  private readonly logger = new Logger(RankingCalculationService.name)

  constructor(
    private readonly scoringConfigService: ScoringConfigPort,
    private readonly rankingDbService: RankingRepository,
    private readonly rankingCacheService: RankingCachePort,
    private readonly trustScoreService: TrustScoreService,
    private readonly fraudDetectionService: FraudDetectionService,
    private readonly multiCriteriaScoringService: MultiCriteriaScoringService,
    private readonly reviewWeightingService: ReviewWeightingService,
  ) {}

  private computeBayesianAdjustment(weightedSum: number, evidenceWeight: number, C: number, m: number) {
    return (weightedSum + m * C) / (evidenceWeight + m)
  }

  async execute(): Promise<void> {
    const config = await this.scoringConfigService.getConfig()
    const businesses = await this.rankingDbService.getApprovedBusinesses()
    const businessIds = businesses.map((business) => business.businessId)

    const reviews = await this.rankingDbService.getApprovedReviewsByBusinessIds(businessIds)
    await this.trustScoreService.computeAll(config)
    await this.fraudDetectionService.computeForReviews(reviews, config)

    const categoryIdsByBusiness = new Map<number, number[]>()
    const provinceByBusiness = new Map<number, string | null>()
    businesses.forEach((business) => {
      categoryIdsByBusiness.set(business.businessId, business.categoryIds)
      provinceByBusiness.set(business.businessId, business.province)
    })

    const fraudScores = await this.rankingDbService.getReviewFraudStatuses(reviews.map((review) => review.reviewId))
    const fraudMap = new Map<number, string>(fraudScores.map((item) => [Number(item.reviewId), item.fraudStatus]))

    const businessAggregates = new Map<number, { weightedSum: number; weightSum: number; reviewCount: number; eligibleCount: number; validCount: number; avgRating: number }>()
    for (const business of businesses) {
      businessAggregates.set(business.businessId, { weightedSum: 0, weightSum: 0, reviewCount: 0, eligibleCount: 0, validCount: 0, avgRating: 0 })
    }

    for (const review of reviews) {
      const business = businesses.find((b) => b.businessId === review.businessId)
      if (!business) {
        continue
      }

      const categoryIds = categoryIdsByBusiness.get(review.businessId) ?? []
      const S_hat_i = await this.multiCriteriaScoringService.computeScore(review.reviewId, categoryIds, review.overallRating)

      const fraudStatus = fraudMap.get(review.reviewId) ?? 'UNKNOWN'
      const W_i = await this.reviewWeightingService.computeWeight({
        writerUserId: review.writerUserId,
        fraudStatus,
        createdAt: review.createdAt,
      }, config)

      const businessSummary = businessAggregates.get(review.businessId)
      if (!businessSummary) continue

      businessSummary.weightedSum += W_i * S_hat_i
      businessSummary.weightSum += W_i
      businessSummary.reviewCount += 1
      if (W_i > 0) businessSummary.eligibleCount += 1
      if (W_i > 0 && fraudStatus === 'VALID') businessSummary.validCount += 1
      businessSummary.avgRating += review.overallRating
    }

    const snapshots: Array<{
      scope: string
      scopeId: number | null
      rank: number
      rankingScore: number
      avgRating: number
      reviewCount: number
      businessId: number
      preBayesianScore: number
      evidenceWeight: number
    }> = []

    for (const business of businesses) {
      const aggregate = businessAggregates.get(business.businessId)!
      // Automatic suspicion alone is not enough evidence to enter a leaderboard.
      if (aggregate.validCount === 0) continue
      const R_j = aggregate.weightSum > 0 ? aggregate.weightedSum / aggregate.weightSum : config.bayesianC
      const avgRating = aggregate.reviewCount > 0 ? Number((aggregate.avgRating / aggregate.reviewCount).toFixed(2)) : business.avgRating
      const finalScore = this.computeBayesianAdjustment(aggregate.weightedSum, aggregate.weightSum, config.bayesianC, config.bayesianM)
      // DECISIONS.md D-012 Step 6b: FinalScore lives on [0, 1] (same scale as
      // R_j/bayesianC); persisted rankingScore is rescaled to [0, 100] so it
      // reads as a distinct composite index rather than a second star rating
      // next to avgRating (both would otherwise sit in the same 1-5 range).
      const displayScore = finalScore * 100
      snapshots.push({
        scope: 'GLOBAL',
        scopeId: null,
        rank: 0,
        rankingScore: displayScore,
        avgRating: Number(avgRating.toFixed(2)),
        reviewCount: aggregate.eligibleCount,
        businessId: business.businessId,
        // R_j (pre-Bayesian weighted average) — kept only in-memory for the
        // Step 7 tiebreak below (DECISIONS.md D-012), not persisted to
        // ranking_snapshot since only FinalScore/rankingScore is documented
        // there.
        preBayesianScore: R_j,
        evidenceWeight: aggregate.weightSum,
      })
    }

    const rankSnapshots = (items: typeof snapshots, scope: string, scopeId: number | null) => {
      const sorted = [...items].sort((a, b) => {
        if (b.rankingScore !== a.rankingScore) return b.rankingScore - a.rankingScore
        if (b.evidenceWeight !== a.evidenceWeight) return b.evidenceWeight - a.evidenceWeight
        if (b.preBayesianScore !== a.preBayesianScore) return b.preBayesianScore - a.preBayesianScore
        return a.businessId - b.businessId
      })
      let rank = 1
      return sorted.map((item) => ({ ...item, scope, scopeId, rank: rank++ }))
    }

    const globalSnap = rankSnapshots(snapshots, 'GLOBAL', null)

    const categoryItemsByCategory = new Map<number, typeof snapshots>()
    for (const snapshot of snapshots) {
      const categoryIds = categoryIdsByBusiness.get(snapshot.businessId) ?? []
      for (const categoryId of categoryIds) {
        const list = categoryItemsByCategory.get(categoryId) ?? []
        list.push(snapshot)
        categoryItemsByCategory.set(categoryId, list)
      }
    }

    const categorySnapshots = Array.from(categoryItemsByCategory.entries()).flatMap(([categoryId, items]) =>
      rankSnapshots(items, 'CATEGORY', categoryId),
    )

    const provinceItemsByProvince = new Map<string, typeof snapshots>()
    for (const snapshot of snapshots) {
      const province = provinceByBusiness.get(snapshot.businessId)
      if (!province) {
        continue
      }
      const list = provinceItemsByProvince.get(province) ?? []
      list.push(snapshot)
      provinceItemsByProvince.set(province, list)
    }

    const provinceSnapshots = Array.from(provinceItemsByProvince.values()).flatMap((items) =>
      rankSnapshots(items, 'PROVINCE', null),
    )

    const retentionCutoff = new Date(Date.now() - RANKING_HISTORY_RETENTION_DAYS * 24 * 60 * 60 * 1000)
    await this.rankingDbService.replaceSnapshotsWithHistory(
      [...globalSnap, ...categorySnapshots, ...provinceSnapshots], retentionCutoff,
    )

    await this.rankingCacheService.invalidateRankingCache()

    for (const business of businesses) {
      const aggregate = businessAggregates.get(business.businessId)
      if (!aggregate) continue
      await this.rankingDbService.updateBusinessAvgRating(business.businessId, aggregate.reviewCount > 0 ? Number((aggregate.avgRating / aggregate.reviewCount).toFixed(2)) : business.avgRating)
    }
  }
}
