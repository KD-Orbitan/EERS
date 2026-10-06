import { RankingDbService } from '../infrastructure/services/ranking-db.service'
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { RankingCalculationService } from '../application/services/ranking-calculation.service'
import { MultiCriteriaScoringService } from '../application/services/multi-criteria-scoring.service'
import { ReviewWeightingService } from '../application/services/review-weighting.service'
import { TrustScoreService } from '../application/services/trust-score.service'
import { FraudDetectionService } from '../application/services/fraud-detection.service'
import { ScoringConfig } from '../infrastructure/services/scoring-config.service'

// Controlled experiments: production arithmetic, in-memory persistence and
// explicit trust/fraud inputs. Separate probes exercise real trust/fraud logic.
const NOW = new Date('2026-09-09T00:00:00.000Z')
const DAY = 86_400_000
const ROOT = resolve(__dirname, '../../../../../..')
const DEFAULTS: ScoringConfig = {
  configId: 1, bayesianC: 0.63, bayesianM: 10,
  fraudLambda1: 0.4, fraudLambda2: 0.4, fraudLambda3: 0.2,
  thetaDup: 0.85, lDup: 20, thetaSpam: 5, spamWindowHours: 24,
  thetaSus: 0.3, thetaReject: 0.7,
  trustAlpha: 0.5, trustBeta: 0.3, trustGamma: 0.2,
  suspiciousDelta: 0.3, timeDecayLambda: 0.01, sentimentLambda: 0,
  weightAlpha: 0.4, weightBeta: 0.4, weightGamma: 0.2, lMin: 10,
}
type Group = { count: number; ratings: number[]; trust: number; ageDays: number; status: string }
type Scenario = { id: string; groups: Group[]; criterionWeights?: number[] }
const group = (count: number, rating: number, overrides: Partial<Group> = {}): Group => ({
  count, ratings: [rating, rating], trust: 0.5, ageDays: 0, status: 'VALID', ...overrides,
})
const SCENARIOS: Scenario[] = [
  { id: 'empty', groups: [] },
  { id: 'rejected_only', groups: [group(100, 5, { status: 'REJECTED' })] },
  ...[1, 10, 100].flatMap((n) => [
    { id: `five_${n}`, groups: [group(n, 5)] },
    { id: `one_${n}`, groups: [group(n, 1)] },
  ]),
  { id: 'four_100', groups: [group(100, 4)] },
  { id: 'base', groups: [group(10, 4)] },
  { id: 'rejected_boost', groups: [group(10, 4), group(100, 5, { status: 'REJECTED' })] },
  { id: 'rejected_attack', groups: [group(10, 4), group(100, 1, { status: 'REJECTED' })] },
  { id: 'suspicious_boost', groups: [group(10, 4), group(100, 5, { status: 'SUSPICIOUS' })] },
  { id: 'suspicious_attack', groups: [group(10, 4), group(100, 1, { status: 'SUSPICIOUS' })] },
  { id: 'suspicious_only', groups: [group(100, 5, { status: 'SUSPICIOUS' })] },
  { id: 'old_only', groups: [group(100, 5, { ageDays: 365 })] },
  { id: 'low_trust_only', groups: [group(100, 5, { trust: 0.1 })] },
  { id: 'balanced', groups: [group(10, 2), group(10, 5)] },
  { id: 'improving', groups: [group(10, 2, { ageDays: 365 }), group(10, 5)] },
  { id: 'declining', groups: [group(10, 5, { ageDays: 365 }), group(10, 2)] },
  { id: 'trusted_positive', groups: [group(10, 2, { trust: 0.1 }), group(10, 5, { trust: 0.9 })] },
  { id: 'trusted_negative', groups: [group(10, 2, { trust: 0.9 }), group(10, 5, { trust: 0.1 })] },
  { id: 'criteria_equal', groups: [group(10, 3, { ratings: [5, 1] })] },
  { id: 'criteria_3_to_1', groups: [group(10, 3, { ratings: [5, 1] })], criterionWeights: [3, 1] },
  { id: 'criteria_scaled', groups: [group(10, 3, { ratings: [5, 1] })], criterionWeights: [30, 10] },
]

async function runRanking(scenarios: Scenario[], config: ScoringConfig, coordinatedCopies = false) {
  let nextId = 0
  const businesses = scenarios.map((s, i) => ({ businessId: i + 1, categoryIds: [i + 1], province: 'Simulation', avgRating: 0 }))
  const reviews = scenarios.flatMap((s, i) => s.groups.flatMap((g) => Array.from({ length: g.count }, () => ({
    reviewId: ++nextId, businessId: i + 1, writerUserId: nextId,
    overallRating: g.ratings.reduce((a, b) => a + b, 0) / g.ratings.length,
    content: coordinatedCopies ? 'The same copied review submitted by different new accounts.' : `Controlled review ${nextId}`,
    createdAt: new Date(NOW.getTime() - g.ageDays * DAY), ...g,
  }))))
  const byId = new Map(reviews.map((r) => [r.reviewId, r]))
  const currentTrust = new Map(reviews.map((r) => [r.writerUserId, r.trust]))
  const currentFraud = new Map(reviews.map((r) => [r.reviewId, r.status]))
  const db = {
    getApprovedBusinesses: jest.fn().mockResolvedValue(businesses),
    getApprovedReviewsByBusinessIds: jest.fn().mockResolvedValue(reviews),
    getReviewCriteriaByReviewIds: jest.fn(async ([id]: number[]) => byId.get(id)!.ratings.map((ratingValue, k) => ({ criterionId: k + 1, ratingValue }))),
    getCriterionWeightsByCategoryIds: jest.fn(async ([id]: number[]) => (scenarios[id - 1].criterionWeights ?? [1, 1]).map((weight, k) => ({ criterionId: k + 1, weight }))),
    getUserTrustScoresByUserIds: jest.fn(async (ids: number[]) => ids.map((id) => ({ userId: id, trustScore: currentTrust.get(id)! }))),
    upsertReviewFraudScore: jest.fn(async (data) => { currentFraud.set(data.reviewId, data.fraudStatus) }),
    updateBusinessAvgRating: jest.fn(),
  }
  const tx = { rankingSnapshot: { deleteMany: jest.fn(), createMany: jest.fn() }, rankingSnapshotHistory: { createMany: jest.fn(), deleteMany: jest.fn() } }
  const prisma = {
    reviewFraudScore: { findMany: jest.fn(async () => reviews.map((r) => ({ reviewId: BigInt(r.reviewId), fraudStatus: currentFraud.get(r.reviewId) }))) },
    user: { findMany: jest.fn(async () => reviews.map((r) => ({ userId: BigInt(r.writerUserId), createdAt: NOW }))) },
    userTrustScore: { upsert: jest.fn(async ({ where, update }) => { currentTrust.set(Number(where.userId), update.trustScore) }) },
    review: {
      groupBy: jest.fn(async ({ where }) => where.status === 'approved'
        ? reviews.map((r) => ({ writerUserId: BigInt(r.writerUserId), _count: { reviewId: 1 } })) : []),
      findMany: jest.fn(async ({ where }) => reviews.filter((r) => r.businessId === Number(where.businessId) && r.reviewId !== Number(where.reviewId.not))),
      count: jest.fn(async ({ where }) => reviews.filter((r) => r.writerUserId === Number(where.writerUserId) && r.createdAt >= where.createdAt.gte && r.createdAt < where.createdAt.lt).length),
    },
    $transaction: jest.fn(async (fn) => fn(tx)),
  }
  const configService = { getConfig: jest.fn().mockResolvedValue(config) }
  const scoring = new MultiCriteriaScoringService(db as any)
  const weighting = new ReviewWeightingService(db as any, configService as any)
  const scores = new Map<number, number>()
  const weights = new Map<number, number>()
  const computeScore = scoring.computeScore.bind(scoring)
  const computeWeight = weighting.computeWeight.bind(weighting)
  jest.spyOn(scoring, 'computeScore').mockImplementation(async (id, categories) => {
    const value = await computeScore(id, categories); scores.set(id, value); return value
  })
  jest.spyOn(weighting, 'computeWeight').mockImplementation(async (review, settings) => {
    const value = await computeWeight(review, settings); weights.set(review.writerUserId, value); return value
  })
  await new RankingCalculationService(
    configService as any, Object.assign(new RankingDbService(prisma as any), db), { invalidateRankingCache: jest.fn() } as any,
    coordinatedCopies ? new TrustScoreService(new RankingDbService(prisma as any), configService as any) : { computeAll: jest.fn() } as any,
    coordinatedCopies ? new FraudDetectionService(configService as any, Object.assign(new RankingDbService(prisma as any), db), {
      computeSimilarity: () => { throw new Error('Coordinated probe uses exact duplicates only') },
    } as any) : { computeForReviews: jest.fn() } as any,
    scoring, weighting,
  ).execute()
  const snapshots = tx.rankingSnapshot.createMany.mock.calls[0][0].data
  return scenarios.map((scenario, i) => {
    const own = reviews.filter((r) => r.businessId === i + 1)
    const weightSum = own.reduce((sum, r) => sum + weights.get(r.reviewId)!, 0)
    const weightedSum = own.reduce((sum, r) => sum + weights.get(r.reviewId)! * scores.get(r.reviewId)!, 0)
    const snapshot = snapshots.find((s) => Number(s.businessId) === i + 1 && s.scope === 'GLOBAL')
    return {
      id: scenario.id, input: scenario, totalReviews: own.length,
      contributingReviews: own.filter((r) => weights.get(r.reviewId)! > 0).length, weightSum,
      preBayesianScore: weightSum > 0 ? weightedSum / weightSum : null,
      score: snapshot?.rankingScore ?? null, rank: snapshot?.rank ?? null,
      fraudCounts: Object.fromEntries(['VALID', 'SUSPICIOUS', 'REJECTED'].map((status) => [status, own.filter((r) => currentFraud.get(r.reviewId) === status).length])),
      scopes: snapshots.filter((s) => Number(s.businessId) === i + 1).map((s) => s.scope),
    }
  })
}

async function trustProbes() {
  const profiles = [
    { id: 'new_empty', n: 0, a: 0, f: 0 }, { id: 'new_one', n: 1, a: 0, f: 0 },
    { id: 'old_empty', n: 0, a: 365, f: 0 }, { id: 'active', n: 20, a: 365, f: 0 },
    { id: 'active_rejected_5', n: 20, a: 365, f: 5 }, { id: 'active_rejected_10', n: 20, a: 365, f: 10 },
  ]
  const prisma = {
    user: { findMany: jest.fn().mockResolvedValue(profiles.map((p, i) => ({ userId: BigInt(i + 1), createdAt: new Date(NOW.getTime() - p.a * DAY) }))) },
    review: { groupBy: jest.fn(async ({ where }) => profiles.map((p, i) => ({ writerUserId: BigInt(i + 1), _count: { reviewId: where.status === 'approved' ? p.n : p.f } }))) },
    userTrustScore: { upsert: jest.fn() },
  }
  await new TrustScoreService(new RankingDbService(prisma as any), {} as any).computeAll(DEFAULTS)
  return profiles.map((p, i) => ({ ...p, trust: prisma.userTrustScore.upsert.mock.calls[i][0].update.trustScore }))
}

async function fraudProbes() {
  const inputs = [
    { id: 'clean_new', trust: 0.5, preceding: 0, duplicate: false },
    { id: 'copy_new', trust: 0.5, preceding: 0, duplicate: true },
    { id: 'burst_only', trust: 0.5, preceding: 5, duplicate: false },
    { id: 'copy_burst', trust: 0.5, preceding: 5, duplicate: true },
    { id: 'copy_trusted', trust: 0.95, preceding: 0, duplicate: true },
    { id: 'copy_boundary_below', trust: 0.95, preceding: 3, duplicate: true },
    { id: 'copy_boundary_above', trust: 0.95, preceding: 4, duplicate: true },
  ]
  const results: Array<typeof inputs[number] & { fraudScore: number; fraudStatus: string }> = []
  for (const input of inputs) {
    const content = 'An exact duplicate with enough characters for the duplicate check.'
    const prisma = { review: {
      findMany: jest.fn().mockResolvedValue(input.duplicate ? [{ reviewId: 2n, content }] : []),
      count: jest.fn().mockResolvedValue(input.preceding),
    } }
    const db = { getUserTrustScoresByUserIds: jest.fn().mockResolvedValue([{ userId: 1, trustScore: input.trust }]), upsertReviewFraudScore: jest.fn() }
    const similarity = { computeSimilarity: jest.fn(() => { throw new Error('These probes must only use exact text matching') }) }
    await new FraudDetectionService({} as any, Object.assign(new RankingDbService(prisma as any), db), similarity as any).computeForReviews([
      { reviewId: 1, businessId: 1, writerUserId: 1, content, createdAt: NOW },
    ], DEFAULTS)
    const output = db.upsertReviewFraudScore.mock.calls[0][0]
    results.push({ ...input, fraudScore: output.fraudScore, fraudStatus: output.fraudStatus })
  }
  return results
}

describe('Reproducible scoring experiments for the graduation report', () => {
  let baseline: Awaited<ReturnType<typeof runRanking>>
  let trust: Awaited<ReturnType<typeof trustProbes>>
  let fraud: Awaited<ReturnType<typeof fraudProbes>>
  let coordinated: Awaited<ReturnType<typeof runRanking>>
  const sensitivity: Array<{ parameter: string; value: number; results: Awaited<ReturnType<typeof runRanking>> }> = []
  const result = (id: string) => baseline.find((r) => r.id === id)!

  beforeAll(async () => {
    jest.useFakeTimers().setSystemTime(NOW)
    baseline = await runRanking(SCENARIOS, DEFAULTS)
    trust = await trustProbes()
    fraud = await fraudProbes()
    coordinated = await runRanking([{ id: 'coordinated_copies', groups: [group(100, 5)] }], DEFAULTS, true)
    const sweeps = [
      { parameter: 'bayesianM', values: [1, 5, 10, 20, 50], ids: ['five_1', 'four_100', 'base', 'suspicious_boost'] },
      { parameter: 'bayesianC', values: [0.5, 0.63, 0.75], ids: ['five_1', 'four_100', 'base'] },
      { parameter: 'suspiciousDelta', values: [0, 0.001, 0.01, 0.1, 0.3, 0.5, 1], ids: ['base', 'suspicious_boost', 'suspicious_attack', 'suspicious_only'] },
      { parameter: 'timeDecayLambda', values: [0, 0.001, 0.01, 0.05], ids: ['balanced', 'improving', 'declining', 'old_only'] },
    ]
    for (const sweep of sweeps) for (const value of sweep.values) {
      sensitivity.push({ parameter: sweep.parameter, value, results: await runRanking(SCENARIOS.filter((s) => sweep.ids.includes(s.id)), { ...DEFAULTS, [sweep.parameter]: value }) })
    }
  })
  afterAll(() => jest.useRealTimers())

  it('uses the actual seeded defaults and keeps every ranked score in [0,100]', () => {
    const seed = readFileSync(resolve(ROOT, 'apps/api/prisma/seed.ts'), 'utf8')
    for (const [key, value] of Object.entries(DEFAULTS)) {
      const match = seed.match(new RegExp(`\\b${key}: ([0-9.]+)`))
      expect(match).not.toBeNull()
      expect(Number(match![1])).toBe(value)
    }
    for (const r of [...baseline, ...sensitivity.flatMap((s) => s.results)]) {
      if (r.score !== null) { expect(r.score).toBeGreaterThanOrEqual(0); expect(r.score).toBeLessThanOrEqual(100) }
    }
  })
  it('omits empty and all-rejected businesses from every scope', () => {
    for (const id of ['empty', 'rejected_only']) { expect(result(id).score).toBeNull(); expect(result(id).scopes).toEqual([]) }
  })
  it('shrinks scarce evidence and ranks 100 four-star reviews above a single five-star review', () => {
    expect(result('five_1').score).toBe(65.74)
    expect(result('four_100').score).toBe(73.67)
    expect(result('four_100').rank).toBeLessThan(result('five_1').rank)
    expect(result('one_1').score).toBe(58.33)
    expect(result('one_100').score).toBe(7.00)
    expect(result('five_100').score).toBe(95.89)
  })
  it('makes rejected boosting and rejected attacks inert for both score and evidence count', () => {
    for (const id of ['rejected_boost', 'rejected_attack']) {
      expect(result(id).score).toBe(result('base').score)
      expect(result(id).contributingReviews).toBe(10)
    }
  })
  it('documents the remaining influence of large suspicious cohorts', () => {
    expect(result('suspicious_boost').score).toBeGreaterThan(result('base').score)
    expect(result('suspicious_attack').score).toBeLessThan(result('base').score)
    expect(result('suspicious_boost').contributingReviews).toBe(110)
    expect(result('suspicious_only').score).toBeNull()
  })
  it('retains absolute weight as Bayesian evidence even for uniform ratings', () => {
    for (const id of ['old_only', 'low_trust_only']) {
      expect(result(id).weightSum).toBeLessThan(result('five_100').weightSum)
      expect(result(id).score).toBeLessThan(result('five_100').score!)
    }
  })
  it('responds to recent improvement/decline and trust when conflicting ratings coexist', () => {
    expect(result('improving').score).toBeGreaterThan(result('balanced').score)
    expect(result('declining').score).toBeLessThan(result('balanced').score)
    expect(result('trusted_positive').score).toBeGreaterThan(result('balanced').score)
    expect(result('trusted_negative').score).toBeLessThan(result('balanced').score)
  })
  it('uses relative criterion weights, independent of multiplying all weights by ten', () => {
    expect(result('criteria_equal').score).toBe(57.22)
    expect(result('criteria_3_to_1').score).toBe(68.33)
    expect(result('criteria_scaled').score).toBe(result('criteria_3_to_1').score)
  })
  it('keeps suspicious-only businesses unranked for zero and positive weights', () => {
    const zero = sensitivity.find((s) => s.parameter === 'suspiciousDelta' && s.value === 0)!
    const tiny = sensitivity.find((s) => s.parameter === 'suspiciousDelta' && s.value === 0.01)!
    expect(zero.results.find((r) => r.id === 'suspicious_only')!.score).toBeNull()
    expect(tiny.results.find((r) => r.id === 'suspicious_only')!.score).toBeNull()
    expect(tiny.results.find((r) => r.id === 'suspicious_boost')!.contributingReviews).toBe(110)
  })
  it('verifies real trust and fraud arithmetic under explicit moderation and signal inputs', () => {
    expect(trust.find((p) => p.id === 'new_empty')!.trust).toBe(0.5)
    expect(trust.find((p) => p.id === 'active_rejected_10')!.trust).toBeLessThan(trust.find((p) => p.id === 'active')!.trust)
    expect(fraud.map((p) => p.fraudStatus)).toEqual(['VALID', 'SUSPICIOUS', 'SUSPICIOUS', 'REJECTED', 'SUSPICIOUS', 'SUSPICIOUS', 'REJECTED'])
  })
  it('keeps coordinated copies from distinct accounts out of all ranking scopes', () => {
    expect(coordinated[0].fraudCounts).toEqual({ VALID: 0, SUSPICIOUS: 100, REJECTED: 0 })
    expect(coordinated[0].score).toBeNull()
    expect(coordinated[0].scopes).toEqual([])
  })
  it('ensures tiny-weight negative reviews lower the score', () => {
    const tiny = sensitivity.find((s) => s.parameter === 'suspiciousDelta' && s.value === 0.001)!
    expect(tiny.results.find((r) => r.id === 'suspicious_attack')!.score).toBeLessThan(result('base').score!)
  })
  it('preserves the direction of positive/negative additions across every suspicious weight tested', () => {
    for (const sweep of sensitivity.filter((s) => s.parameter === 'suspiciousDelta')) {
      const base = sweep.results.find((r) => r.id === 'base')!.score!
      const boost = sweep.results.find((r) => r.id === 'suspicious_boost')!.score!
      const attack = sweep.results.find((r) => r.id === 'suspicious_attack')!.score!
      expect(boost).toBeGreaterThanOrEqual(base)
      expect(attack).toBeLessThanOrEqual(base)
      if (sweep.value === 0) { expect(boost).toBe(base); expect(attack).toBe(base) }
    }
  })
  it('requires positive VALID evidence, not just a VALID label or unknown fraud state', async () => {
    const inputs = [
      { id: 'unknown', groups: [group(10, 5, { status: 'UNKNOWN' })] },
      { id: 'valid_zero', groups: [group(1, 5, { trust: 0 }), group(10, 5, { status: 'SUSPICIOUS' })] },
      { id: 'valid_positive', groups: [group(1, 4), group(10, 5, { status: 'SUSPICIOUS' })] },
    ]
    const results = await runRanking(inputs, { ...DEFAULTS, weightAlpha: 1, weightBeta: 0, weightGamma: 0 })
    expect(results[0].scopes).toEqual([])
    expect(results[1].scopes).toEqual([])
    expect(results[2].scopes).toEqual(['GLOBAL', 'CATEGORY', 'PROVINCE'])
  })
  it('exports deterministic evidence only when explicitly requested', () => {
    if (process.env.EXPORT_SCORING_SIMULATION !== '1') return
    const sourcePaths = [
      'apps/api/src/modules/ranking/tests/scoring-simulation.spec.ts',
      ...['ranking-calculation', 'multi-criteria-scoring', 'review-weighting', 'trust-score', 'fraud-detection'].map((name) => `apps/api/src/modules/ranking/application/services/${name}.service.ts`),
      'apps/api/prisma/seed.ts',
    ]
    const payload = {
      schemaVersion: 2, formulaVersion: 'weighted-evidence-valid-gate-v2', clock: NOW.toISOString(), config: DEFAULTS,
      sources: sourcePaths.map((path) => ({ path, sha256: createHash('sha256').update(readFileSync(resolve(ROOT, path))).digest('hex') })),
      baseline, sensitivity, trust, fraud, coordinated,
    }
    const output = resolve(ROOT, 'docs/bao-cao-do-an/du-lieu/kiem-chung-tinh-diem-v2.json')
    mkdirSync(resolve(output, '..'), { recursive: true })
    writeFileSync(output, JSON.stringify(payload, null, 2) + '\n')
  })
})
