import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../../../infrastructure/database/prisma.service'
import { ScoringConfigService } from '../../infrastructure/services/scoring-config.service'
import { RankingDbService } from '../../infrastructure/services/ranking-db.service'
import { RankingCacheService } from '../../infrastructure/services/ranking-cache.service'
import { TrustScoreService } from './trust-score.service'
import { FraudDetectionService } from './fraud-detection.service'
import { MultiCriteriaScoringService } from './multi-criteria-scoring.service'
import { ReviewWeightingService } from './review-weighting.service'
import { RANKING_HISTORY_RETENTION_DAYS } from '../../infrastructure/services/ranking-trend-config.service'

@Injectable()
export class RankingCalculationService {
  private readonly logger = new Logger(RankingCalculationService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly scoringConfigService: ScoringConfigService,
    private readonly rankingDbService: RankingDbService,
    private readonly rankingCacheService: RankingCacheService,
    private readonly trustScoreService: TrustScoreService,
    private readonly fraudDetectionService: FraudDetectionService,
    private readonly multiCriteriaScoringService: MultiCriteriaScoringService,
    private readonly reviewWeightingService: ReviewWeightingService,
  ) {}

  private computeBayesianAdjustment(R_j: number, v_j: number, C: number, m: number) {
    if (v_j === 0) {
      return C
    }
    return (v_j / (v_j + m)) * R_j + (m / (v_j + m)) * C
  }

  async execute(): Promise<void> {
    const config = await this.scoringConfigService.getConfig()
    const businesses = await this.rankingDbService.getApprovedBusinesses()
    const businessIds = businesses.map((business) => business.businessId)

    const reviews = await this.rankingDbService.getApprovedReviewsByBusinessIds(businessIds)
    await this.trustScoreService.computeAll()
    await this.fraudDetectionService.computeForReviews(reviews)

    const categoryIdsByBusiness = new Map<number, number[]>()
    const provinceByBusiness = new Map<number, string | null>()
    businesses.forEach((business) => {
      categoryIdsByBusiness.set(business.businessId, business.categoryIds)
      provinceByBusiness.set(business.businessId, business.province)
    })

    const fraudScores = await this.prisma.reviewFraudScore.findMany({
      where: { reviewId: { in: reviews.map((review) => BigInt(review.reviewId)) } },
      select: { reviewId: true, fraudStatus: true },
    })
    const fraudMap = new Map<number, string>(fraudScores.map((item) => [Number(item.reviewId), item.fraudStatus]))

    const businessAggregates = new Map<number, { weightedSum: number; weightSum: number; reviewCount: number; avgRating: number }>()
    for (const business of businesses) {
      businessAggregates.set(business.businessId, { weightedSum: 0, weightSum: 0, reviewCount: 0, avgRating: 0 })
    }

    const reviewScoreCache = new Map<number, number>()
    const reviewWeightCache = new Map<number, number>()

    for (const review of reviews) {
      const business = businesses.find((b) => b.businessId === review.businessId)
      if (!business) {
        continue
      }

      const categoryIds = categoryIdsByBusiness.get(review.businessId) ?? []
      const S_hat_i = await this.multiCriteriaScoringService.computeScore(review.reviewId, categoryIds)
      reviewScoreCache.set(review.reviewId, S_hat_i)

      const fraudStatus = fraudMap.get(review.reviewId) ?? 'VALID'
      const W_i = await this.reviewWeightingService.computeWeight({
        writerUserId: review.writerUserId,
        fraudStatus,
        createdAt: review.createdAt,
      })
      reviewWeightCache.set(review.reviewId, W_i)

      const businessSummary = businessAggregates.get(review.businessId)
      if (!businessSummary) continue

      businessSummary.weightedSum += W_i * S_hat_i
      businessSummary.weightSum += W_i
      businessSummary.reviewCount += 1
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
    }> = []

    for (const business of businesses) {
      const aggregate = businessAggregates.get(business.businessId)!
      const R_j = aggregate.weightSum > 0 ? aggregate.weightedSum / aggregate.weightSum : config.bayesianC
      const avgRating = aggregate.reviewCount > 0 ? Number((aggregate.avgRating / aggregate.reviewCount).toFixed(2)) : business.avgRating
      const finalScore = this.computeBayesianAdjustment(R_j, aggregate.reviewCount, config.bayesianC, config.bayesianM)
      snapshots.push({
        scope: 'GLOBAL',
        scopeId: null,
        rank: 0,
        rankingScore: Number(finalScore.toFixed(4)),
        avgRating: Number(avgRating.toFixed(2)),
        reviewCount: aggregate.reviewCount,
        businessId: business.businessId,
        // R_j (pre-Bayesian weighted average) — kept only in-memory for the
        // Step 7 tiebreak below (DECISIONS.md D-012), not persisted to
        // ranking_snapshot since only FinalScore/rankingScore is documented
        // there.
        preBayesianScore: R_j,
      })
    }

    const rankSnapshots = (items: typeof snapshots, scope: string, scopeId: number | null) => {
      const sorted = [...items].sort((a, b) => {
        if (b.rankingScore !== a.rankingScore) return b.rankingScore - a.rankingScore
        if (b.reviewCount !== a.reviewCount) return b.reviewCount - a.reviewCount
        return b.preBayesianScore - a.preBayesianScore
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

    await this.prisma.$transaction(async (tx) => {
      await tx.rankingSnapshot.deleteMany({})
      await tx.rankingSnapshot.createMany({ data: [...globalSnap, ...categorySnapshots, ...provinceSnapshots].map((item) => ({
        scope: item.scope,
        scopeId: item.scopeId === null ? null : BigInt(item.scopeId),
        rank: item.rank,
        rankingScore: item.rankingScore,
        avgRating: item.avgRating,
        reviewCount: item.reviewCount,
        businessId: BigInt(item.businessId),
      })) })

      // Append-only GLOBAL-scope trend history (see DECISIONS.md D-031)
      await tx.rankingSnapshotHistory.createMany({
        data: globalSnap.map((item) => ({
          rank: item.rank,
          rankingScore: item.rankingScore,
          businessId: BigInt(item.businessId),
        })),
      })
      const retentionCutoff = new Date(Date.now() - RANKING_HISTORY_RETENTION_DAYS * 24 * 60 * 60 * 1000)
      await tx.rankingSnapshotHistory.deleteMany({ where: { calculatedAt: { lt: retentionCutoff } } })
    })

    await this.rankingCacheService.invalidateRankingCache()

    for (const business of businesses) {
      const aggregate = businessAggregates.get(business.businessId)
      if (!aggregate) continue
      await this.rankingDbService.updateBusinessAvgRating(business.businessId, aggregate.reviewCount > 0 ? Number((aggregate.avgRating / aggregate.reviewCount).toFixed(2)) : business.avgRating)
    }
  }
}
