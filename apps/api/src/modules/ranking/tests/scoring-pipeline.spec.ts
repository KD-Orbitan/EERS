import { RankingCalculationService } from '../application/services/ranking-calculation.service'
import { ReviewWeightingService } from '../application/services/review-weighting.service'
import { MultiCriteriaScoringService } from '../application/services/multi-criteria-scoring.service'
import { FraudDetectionService } from '../application/services/fraud-detection.service'
import { TrustScoreService } from '../application/services/trust-score.service'
import { ScoringConfig, ScoringConfigService } from '../infrastructure/services/scoring-config.service'

const config: ScoringConfig = {
  configId: 1, bayesianC: 0.63, bayesianM: 10,
  fraudLambda1: 0.4, fraudLambda2: 0.4, fraudLambda3: 0.2,
  thetaDup: 0.85, lDup: 20, thetaSpam: 5, spamWindowHours: 24,
  thetaSus: 0.3, thetaReject: 0.7,
  trustAlpha: 0.5, trustBeta: 0.3, trustGamma: 0.2,
  suspiciousDelta: 0.3, timeDecayLambda: 0.01, sentimentLambda: 0,
  weightAlpha: 0.4, weightBeta: 0.4, weightGamma: 0.2, lMin: 10,
}
const now = new Date('2026-09-08T00:00:00Z')
const configService = { getConfig: jest.fn().mockResolvedValue(config) }

describe('Scoring pipeline regression scenarios', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(now)
    configService.getConfig.mockClear()
  })
  afterEach(() => jest.useRealTimers())

  it('gates the entire weight by fraud status and bounds future timestamps', async () => {
    const db = { getUserTrustScoresByUserIds: jest.fn().mockResolvedValue([{ trustScore: 0.5 }]) }
    const service = new ReviewWeightingService(db as any, configService as any)
    const review = { writerUserId: 1, createdAt: now, fraudStatus: 'VALID' }
    const valid = await service.computeWeight(review, config)
    expect(valid).toBeCloseTo(0.8)
    expect(await service.computeWeight({ ...review, fraudStatus: 'SUSPICIOUS' }, config)).toBeCloseTo(valid * 0.3)
    expect(await service.computeWeight({ ...review, fraudStatus: 'REJECTED' }, config)).toBe(0)
    expect(await service.computeWeight({ ...review, fraudStatus: 'UNKNOWN' }, config)).toBe(0)
    expect(await service.computeWeight({ ...review, createdAt: new Date('2027-01-01') }, config)).toBeCloseTo(valid)
    expect(await service.computeWeight({ ...review, createdAt: new Date('2025-01-01') }, config)).toBeLessThan(valid)
    expect(configService.getConfig).not.toHaveBeenCalled()
  })

  it('counts identical text on another review as duplicate, but never compares a review to itself', async () => {
    const content = 'This is an identical review with sufficient length.'
    const prisma = { review: { findMany: jest.fn().mockResolvedValue([{ reviewId: 2n, content }]), count: jest.fn().mockResolvedValue(0) } }
    const db = { getUserTrustScoresByUserIds: jest.fn().mockResolvedValue([]), upsertReviewFraudScore: jest.fn() }
    const similarity = { computeSimilarity: jest.fn().mockResolvedValue(0.9) }
    const service = new FraudDetectionService(prisma as any, configService as any, db as any, similarity as any)
    const review = { reviewId: 1, businessId: 1, writerUserId: 1, content, createdAt: now }
    await service.computeForReviews([review], config)
    expect(db.upsertReviewFraudScore).toHaveBeenLastCalledWith(expect.objectContaining({ duplicateSignal: 1, fraudStatus: 'SUSPICIOUS' }))
    expect(prisma.review.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ reviewId: { not: 1n } }) }))
    expect(similarity.computeSimilarity).not.toHaveBeenCalled()

    prisma.review.findMany.mockResolvedValue([{ reviewId: 1n, content }])
    await service.computeForReviews([review], config)
    expect(db.upsertReviewFraudScore).toHaveBeenLastCalledWith(expect.objectContaining({ duplicateSignal: 0, fraudStatus: 'VALID' }))

    prisma.review.findMany.mockResolvedValue([{ reviewId: 2n, content: content + ' Extra text.' }])
    await service.computeForReviews([review], config)
    expect(db.upsertReviewFraudScore).toHaveBeenLastCalledWith(expect.objectContaining({ duplicateSignal: 1 }))
  })

  it('derives trust from moderation, is stable across runs, and recovers when a rejection is cleared', async () => {
    let rejectedCount = 2
    const prisma = {
      user: { findMany: jest.fn().mockResolvedValue([{ userId: 1n, createdAt: now }]) },
      review: { groupBy: jest.fn().mockImplementation(({ where }) => Promise.resolve([
        { writerUserId: 1n, _count: { reviewId: where.status === 'approved' ? 1 : rejectedCount } },
      ])) },
      reviewFraudScore: { findMany: jest.fn() },
      userTrustScore: { upsert: jest.fn() },
    }
    const service = new TrustScoreService(prisma as any, configService as any)
    await service.computeAll(config)
    const first = prisma.userTrustScore.upsert.mock.calls[0][0].update
    expect(first.validReviews).toBe(1)
    expect(first.flaggedCount).toBe(2)
    await service.computeAll(config)
    expect(prisma.userTrustScore.upsert.mock.calls[1][0].update).toEqual(first)
    expect(prisma.reviewFraudScore.findMany).not.toHaveBeenCalled()
    expect(prisma.review.groupBy).toHaveBeenCalledWith(expect.objectContaining({ where: { status: 'rejected', deletedAt: null } }))
    rejectedCount = 0
    await service.computeAll(config)
    expect(prisma.userTrustScore.upsert.mock.calls[2][0].update.trustScore).toBeGreaterThan(first.trustScore)
  })

  it('reads the latest persisted config on the next request', async () => {
    const prisma = { scoringConfig: { findFirst: jest.fn().mockResolvedValueOnce(config).mockResolvedValueOnce({ ...config, bayesianM: 20 }) } }
    const service = new ScoringConfigService(prisma as any)
    expect((await service.getConfig()).bayesianM).toBe(10)
    expect((await service.getConfig()).bayesianM).toBe(20)
  })

  async function calculate(extraRejected = 0) {
    const reviews = [
      { reviewId: 1, businessId: 1, overallRating: 5 },
      ...Array.from({ length: 100 }, (_, i) => ({ reviewId: i + 2, businessId: 2, overallRating: 4 })),
      { reviewId: 102, businessId: 4, overallRating: 5 },
      ...Array.from({ length: extraRejected }, (_, i) => ({ reviewId: i + 103, businessId: 1, overallRating: 1 })),
    ].map((review) => ({ ...review, writerUserId: 1, createdAt: now, content: 'Review content' }))
    const businesses = [1, 2, 3, 4].map((businessId) => ({ businessId, categoryIds: [1], province: 'Hanoi', avgRating: 0 }))
    const db = {
      getApprovedBusinesses: jest.fn().mockResolvedValue(businesses),
      getApprovedReviewsByBusinessIds: jest.fn().mockResolvedValue(reviews),
      getUserTrustScoresByUserIds: jest.fn().mockResolvedValue([{ trustScore: 0.5 }]),
      getReviewCriteriaByReviewIds: jest.fn().mockImplementation(([id]) => Promise.resolve([
        { criterionId: 1, ratingValue: reviews.find((r) => r.reviewId === id)!.overallRating },
      ])),
      getCriterionWeightsByCategoryIds: jest.fn().mockResolvedValue([{ criterionId: 1, weight: 2 }]),
      updateBusinessAvgRating: jest.fn(),
    }
    const tx = { rankingSnapshot: { deleteMany: jest.fn(), createMany: jest.fn() }, rankingSnapshotHistory: { createMany: jest.fn(), deleteMany: jest.fn() } }
    const prisma = {
      reviewFraudScore: { findMany: jest.fn().mockResolvedValue(reviews.map((r) => ({ reviewId: BigInt(r.reviewId), fraudStatus: r.reviewId >= 102 ? 'REJECTED' : 'VALID' }))) },
      $transaction: jest.fn().mockImplementation((fn) => fn(tx)),
    }
    const trust = { computeAll: jest.fn() }
    const fraud = { computeForReviews: jest.fn() }
    const cache = { invalidateRankingCache: jest.fn() }
    const service = new RankingCalculationService(
      prisma as any, configService as any, db as any, cache as any, trust as any, fraud as any,
      new MultiCriteriaScoringService(db as any), new ReviewWeightingService(db as any, configService as any),
    )
    await service.execute()
    expect(trust.computeAll).toHaveBeenCalledWith(config)
    expect(fraud.computeForReviews).toHaveBeenCalledWith(reviews, config)
    expect(cache.invalidateRankingCache).toHaveBeenCalledTimes(1)
    return tx.rankingSnapshot.createMany.mock.calls[0][0].data
  }

  it('ranks many 4-star reviews above one 5-star review, excludes empty/all-rejected businesses in every scope', async () => {
    const snapshots = await calculate()
    const global = snapshots.filter((s) => s.scope === 'GLOBAL')
    expect(global.map((s) => Number(s.businessId))).toEqual([2, 1])
    expect(global[0]).toEqual(expect.objectContaining({ rank: 1, rankingScore: 73.67, reviewCount: 100 }))
    expect(global[1]).toEqual(expect.objectContaining({ rank: 2, rankingScore: 65.74, reviewCount: 1 }))
    expect(snapshots.every((s) => s.businessId === 1n || s.businessId === 2n)).toBe(true)
    expect(configService.getConfig).toHaveBeenCalledTimes(1)
  })

  it('adding rejected reviews cannot increase Bayesian confidence or alter ranking scores/counts', async () => {
    const before = await calculate()
    const after = await calculate(100)
    expect(after.map(({ avgRating, ...ranking }) => ranking)).toEqual(before.map(({ avgRating, ...ranking }) => ranking))
  })
})
