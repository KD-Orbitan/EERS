// Run from apps/api with production env explicitly supplied:
// node --env-file=.env.production.local -r ts-node/register -r tsconfig-paths/register prisma/seed-expanded-business-reviews.ts [--apply]
// Default is read-only. Targets only the September 6 demo business batch.
import 'reflect-metadata'
import { randomBytes } from 'node:crypto'
import { hash } from 'bcrypt'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../src/infrastructure/database/prisma.service'
import { RedisService } from '../src/infrastructure/cache/redis.service'
import { RankingDbService } from '../src/modules/ranking/infrastructure/services/ranking-db.service'
import { RankingCacheService } from '../src/modules/ranking/infrastructure/services/ranking-cache.service'
import { ScoringConfigService } from '../src/modules/ranking/infrastructure/services/scoring-config.service'
import { PgTrgmSimilarityService } from '../src/modules/ranking/infrastructure/services/pg-trgm-similarity.service'
import { TrustScoreService } from '../src/modules/ranking/application/services/trust-score.service'
import { FraudDetectionService } from '../src/modules/ranking/application/services/fraud-detection.service'
import { MultiCriteriaScoringService } from '../src/modules/ranking/application/services/multi-criteria-scoring.service'
import { ReviewWeightingService } from '../src/modules/ranking/application/services/review-weighting.service'
import { RankingCalculationService } from '../src/modules/ranking/application/services/ranking-calculation.service'

const prisma = new PrismaService()
const target = { email: { startsWith: 'demo-20260906-c', endsWith: '@example.invalid' } }
const scenarios: Record<number, string[]> = {
  1: ['Website bàn giao có giao diện dễ sử dụng, tài liệu hướng dẫn đầy đủ và chức năng tìm kiếm hoạt động tốt.', 'Buổi hỗ trợ cấu hình phần mềm giải đáp được thắc mắc; thời gian phản hồi qua email vẫn cần cải thiện.', 'Tiến độ tích hợp dữ liệu chưa như kỳ vọng, một số bước nhập thông tin còn phải thực hiện thủ công.'],
  2: ['Bài thực hành được chuẩn bị kỹ, giáo viên giải thích dễ hiểu và dành thời gian sửa từng lỗi cho học viên.', 'Phòng học gọn gàng, học liệu thuận tiện tra cứu; lịch học cuối tuần còn ít lựa chọn.', 'Khâu thông báo đổi buổi chưa kịp thời, hoạt động nhóm cần phân chia thời lượng hợp lý hơn.'],
  3: ['Quầy tiếp nhận hướng dẫn rõ ràng, khu vực chờ sạch sẽ và thông tin đặt lịch dễ tìm.', 'Nhân viên giải đáp quy trình chu đáo; thời gian làm thủ tục vào buổi sáng còn hơi lâu.', 'Biển chỉ dẫn giữa các khu vực chưa rõ, việc xác nhận lịch qua điện thoại cần nhanh hơn.'],
  4: ['Bảng dự toán trình bày dễ theo dõi, các khoản phí được giải thích cụ thể trước khi sử dụng dịch vụ.', 'Tài liệu tư vấn có cấu trúc rõ, nhân viên hỗ trợ đầy đủ; lịch hẹn trực tuyến chưa thật thuận tiện.', 'Quá trình bổ sung hồ sơ mất nhiều bước, hướng dẫn chuẩn bị chứng từ cần ngắn gọn và dễ hiểu hơn.'],
  5: ['Hàng hóa sắp xếp dễ tìm, nhãn giá rõ ràng và khu vực thanh toán được giữ ngăn nắp.', 'Nhân viên giới thiệu sản phẩm phù hợp nhu cầu; một vài mẫu trong danh mục chưa có sẵn.', 'Thời gian chờ đóng gói còn dài, thông tin về đổi trả cần đặt ở vị trí dễ nhìn hơn.'],
}
let redis: RedisService | undefined

async function main() {
  const businesses = await prisma.business.findMany({ where: target, orderBy: { businessId: 'asc' }, include: { businessCategories: true } })
  if (businesses.length !== 25 || businesses.some(b => b.status !== 'approved' || b.deletedAt || b.businessCategories.length !== 1)) throw new Error('Unexpected demo business set')
  const criteria = await prisma.categoryCriterion.findMany()
  const role = await prisma.role.findUniqueOrThrow({ where: { roleName: 'USER' } })
  for (const b of businesses) {
    const categoryId = b.businessCategories[0].categoryId
    if (!scenarios[categoryId] || criteria.filter(c => c.categoryId === categoryId).length !== 4) throw new Error('Unexpected category criteria')
  }
  console.log(JSON.stringify({ businesses: businesses.length, plannedReviews: 75, plannedCriterionRatings: 300, apply: process.argv.includes('--apply') }))
  if (!process.argv.includes('--apply')) return
  if (!process.env.REDIS_URL) throw new Error('REDIS_URL required')
  redis = new RedisService(new ConfigService({ redis: { url: process.env.REDIS_URL } }))
  await (await redis.getRedis()).ping()
  const password = await hash(randomBytes(48).toString('hex'), 12)
  const result = await prisma.$transaction(async tx => {
    await tx.$executeRawUnsafe('SELECT pg_advisory_xact_lock(20260911, 75)')
    const reviewers: bigint[] = []
    for (let i = 0; i < 25; i++) {
      const user = await tx.user.upsert({
        where: { email: `demo-ranking-20260911-${i + 1}@example.invalid` }, update: {},
        create: { name: `Demo Reviewer ${i + 1}`, email: `demo-ranking-20260911-${i + 1}@example.invalid`, password, roleId: role.roleId, status: 'active' },
      })
      reviewers.push(user.userId)
    }
    let created = 0
    for (const [bIndex, b] of businesses.entries()) {
      const categoryId = b.businessCategories[0].categoryId
      const categoryCriteria = criteria.filter(c => c.categoryId === categoryId)
      for (let i = 0; i < 3; i++) {
        const writerUserId = reviewers[(bIndex * 3 + i) % reviewers.length]
        const existing = await tx.review.findFirst({ where: { businessId: b.businessId, writerUserId, deletedAt: null } })
        if (existing) continue
        const rating = [5, 4, 3][i]
        await tx.review.create({ data: {
          businessId: b.businessId, writerUserId, status: 'approved', overallRating: rating,
          content: `[DEMO - đánh giá giả lập cho đồ án, không phải trải nghiệm khách hàng thực tế] ${b.name}: ${scenarios[categoryId][i]}`,
          reviewCriteria: { create: categoryCriteria.map((c, j) => ({ criterionId: c.criterionId, ratingValue: Math.max(1, Math.min(5, rating + [0, -1, 0, 1][(i + j) % 4])) })) },
        } })
        created++
      }
    }
    return { created }
  }, { timeout: 120000, maxWait: 10000 })
  console.log(JSON.stringify(result))
  const db = new RankingDbService(prisma)
  const config = new ScoringConfigService(prisma)
  const cache = new RankingCacheService(redis)
  const ranking = new RankingCalculationService(config, db, cache,
    new TrustScoreService(db, config),
    new FraudDetectionService(config, db, new PgTrgmSimilarityService(prisma)),
    new MultiCriteriaScoringService(db), new ReviewWeightingService(db, config))
  console.log('Recalculating with current application ranking services...')
  await ranking.execute()
  const snapshots = await prisma.rankingSnapshot.findMany({ where: { scope: 'GLOBAL', businessId: { in: businesses.map(b => b.businessId) } }, select: { businessId: true, reviewCount: true, rankingScore: true } })
  const reviews = await prisma.review.findMany({ where: { businessId: { in: businesses.map(b => b.businessId) }, writer: { email: { startsWith: 'demo-ranking-20260911-', endsWith: '@example.invalid' } }, deletedAt: null }, include: { fraudScore: true, _count: { select: { reviewCriteria: true } } } })
  if (snapshots.length !== 25 || reviews.length !== 75 || reviews.some(r => r._count.reviewCriteria !== 4)) throw new Error('Post-seed verification failed')
  const categories = await prisma.rankingSnapshot.groupBy({ by: ['scopeId'], where: { scope: 'CATEGORY' }, _count: true })
  console.log(JSON.stringify({ rankedNewBusinesses: snapshots.length, reviews: reviews.length, validReviews: reviews.filter(r => r.fraudScore?.fraudStatus === 'VALID').length, criterionRatings: 300, categories }, (_, v) => typeof v === 'bigint' ? String(v) : v))
}

main().catch(error => { console.error('Seed failed:', error.code ?? error.name); process.exitCode = 1 }).finally(async () => {
  if (redis) (await redis.getRedis()).disconnect()
  await prisma.$disconnect()
})
