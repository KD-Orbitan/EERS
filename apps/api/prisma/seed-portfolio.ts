import 'reflect-metadata'
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
import { portfolioCategories, portfolioCriteria, portfolioLocations, portfolioReviewers } from './portfolio-data'

const prisma = new PrismaService()
let redis: RedisService | undefined
const domain = '@portfolio.example.invalid'

async function main() {
  // A branch alone does not isolate persistent data. Require a dedicated database.
  const url = new URL(process.env.DATABASE_URL ?? '')
  if (url.pathname !== '/eers_portfolio') throw new Error('Use the dedicated eers_portfolio database.')
  const apply = process.argv.includes('--apply')
  console.log(JSON.stringify({ apply, businesses: 15, reviews: 90, categories: 5, criterionRatings: 360 }))
  if (!apply) return
  const password = process.env.PORTFOLIO_DEMO_PASSWORD
  if (!password || password.length < 12) throw new Error('Set PORTFOLIO_DEMO_PASSWORD to at least 12 characters.')
  if (!process.env.REDIS_URL) throw new Error('Set REDIS_URL to the dedicated portfolio Redis instance.')
  redis = new RedisService(new ConfigService({ redis: { url: process.env.REDIS_URL } }))
  await (await redis.getRedis()).ping()
  const passwordHash = await hash(password, 12)
  await prisma.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(20261005, 1)`
    const existingUsers = await tx.user.count()
    const existingBusinesses = await tx.business.count()
    if (existingUsers || existingBusinesses) {
      const demoUsers = await tx.user.count({ where: { email: { endsWith: domain } } })
      const demoBusinesses = await tx.business.count({ where: { email: { endsWith: domain } } })
      if (existingUsers !== 8 || demoUsers !== 8 || existingBusinesses !== 15 || demoBusinesses !== 15) {
        throw new Error('Database is not empty or contains other data. Seed a fresh portfolio database.')
      }
      console.log('Portfolio dataset already exists; keeping edits and refreshing rankings.')
      return
    }
    if (await tx.category.count() || await tx.criterion.count() || await tx.reason.count() || await tx.location.count()) {
      throw new Error('Start with an empty migrated database; do not run the original seeds first.')
    }
    for (const [roleId, roleName] of [[1, 'USER'], [2, 'BUSINESS_OWNER'], [3, 'ADMIN']] as const) {
      await tx.role.upsert({ where: { roleId }, update: {}, create: { roleId, roleName } })
    }
    const admin = await tx.user.create({ data: { name: 'Portfolio Administrator', email: `admin${domain}`, password: passwordHash, roleId: 3 } })
    const owner = await tx.user.create({ data: { name: 'Sam Rivers', email: `owner${domain}`, password: passwordHash, roleId: 2 } })
    const reviewers: bigint[] = []
    for (const [index, name] of portfolioReviewers.entries()) {
      const user = await tx.user.create({ data: { name, email: `reviewer${index + 1}${domain}`, password: passwordHash, roleId: 1, createdAt: new Date(Date.now() - 180 * 86400000) } })
      reviewers.push(user.userId)
    }
    const criteria: number[] = []
    for (const criterion of portfolioCriteria) {
      const record = await tx.criterion.upsert({ where: { name: criterion.name }, update: {}, create: criterion })
      criteria.push(record.criterionId)
    }
    for (const name of ['Spam', 'Fake Review', 'Harassment', 'Offensive Content', 'Conflict of Interest', 'Other']) {
      if (!await tx.reason.findFirst({ where: { name } })) await tx.reason.create({ data: { name } })
    }
    await tx.scoringConfig.upsert({ where: { configId: 1 }, update: {}, create: { configId: 1 } })
    await tx.rankingTrendConfig.upsert({ where: { configId: 1 }, update: {}, create: { configId: 1, period: 'WEEK' } })
    for (const [categoryIndex, item] of portfolioCategories.entries()) {
      const category = await tx.category.upsert({ where: { categoryName: item.name }, update: {}, create: { categoryName: item.name } })
      for (const criterionId of criteria) {
        const key = { categoryId: category.categoryId, criterionId }
        await tx.categoryCriterion.upsert({ where: { categoryId_criterionId: key }, update: {}, create: key })
        await tx.criterionWeight.upsert({ where: { categoryId_criterionId: key }, update: {}, create: { ...key, weight: 0.25 } })
      }
      for (const [index, name] of item.businesses.entries()) {
        const number = categoryIndex * 3 + index + 1
        const location = portfolioLocations[index]
        const business = await tx.business.create({ data: {
          name, description: item.description, services: item.services,
          email: `business${number}${domain}`, phone: `+84280000${String(number).padStart(4, '0')}`,
          website: `https://business${number}.example.invalid`, status: 'approved',
          ownerUserId: owner.userId, approvedByUserId: admin.userId,
          openingHours: 'Monday: 08:00-18:00\nTuesday: 08:00-18:00\nWednesday: 08:00-18:00\nThursday: 08:00-18:00\nFriday: 08:00-18:00\nSaturday: 09:00-16:00\nSunday: Closed',
          priceRange: '100,000-500,000 VND / service', amenities: 'Wi-Fi, Parking, Air conditioning, Cash, Credit / debit card',
          businessCategories: { create: { categoryId: category.categoryId } },
          locations: { create: { location: { create: { ...location, latitude: location.latitude + categoryIndex * 0.001, longitude: location.longitude + categoryIndex * 0.001 } } } },
        } })
        for (const [reviewIndex, content] of item.reviews.entries()) {
          const rating = Math.max(1, [5, 4, 5, 3, 2, 4][reviewIndex] - (index === 2 ? 1 : 0))
          const createdAt = new Date(Date.now() - (45 - number * 2 + reviewIndex * 3) * 86400000)
          const review = await tx.review.create({ data: {
            businessId: business.businessId, writerUserId: reviewers[reviewIndex],
            content: `My experience with ${name}: ${content}`, overallRating: rating, status: 'approved',
            createdAt, managedByUserId: admin.userId, moderatedAt: createdAt,
            // Authored demo labels, not claims of live model inference.
            sentiment: rating >= 4 ? 'positive' : rating === 3 ? 'neutral' : 'negative',
            sentimentScore: rating >= 4 ? 0.85 : rating === 3 ? 0.7 : 0.75, sentimentAnalyzedAt: createdAt,
            reviewCriteria: { create: criteria.map((criterionId, i) => ({ criterionId, ratingValue: Math.max(1, rating - (i === 1 && reviewIndex === 3 ? 1 : 0)) })) },
          } })
          if (reviewIndex === 4) await tx.reply.create({ data: { userId: owner.userId, reviewId: review.reviewId, content: 'Thank you for the detailed feedback. We are reviewing our response process and will use your comments to improve the experience.' } })
        }
      }
    }
    await tx.notification.create({ data: { userId: owner.userId, type: 'SYSTEM', title: 'Welcome to your business dashboard', content: 'Your demo businesses are ready. Explore customer feedback, criterion scores, and rankings.', targetPath: '/businesses' } })
  }, { timeout: 120000 })

  const db = new RankingDbService(prisma)
  const config = new ScoringConfigService(prisma)
  await new RankingCalculationService(prisma, config, db, new RankingCacheService(redis),
    new TrustScoreService(prisma, config),
    new FraudDetectionService(prisma, config, db, new PgTrgmSimilarityService(prisma)),
    new MultiCriteriaScoringService(db), new ReviewWeightingService(db, config)).execute()
  const [businesses, reviews, criterionRatings, rankedBusinesses] = await Promise.all([
    prisma.business.count(), prisma.review.count(), prisma.reviewCriterion.count(),
    prisma.rankingSnapshot.count({ where: { scope: 'GLOBAL' } }),
  ])
  if (businesses !== 15 || reviews !== 90 || criterionRatings !== 360 || rankedBusinesses !== 15) throw new Error('Portfolio verification failed.')
  console.log(JSON.stringify({ businesses, reviews, criterionRatings, rankedBusinesses }))
}

main().catch(error => {
  console.error('Portfolio seed failed:', error instanceof Error ? error.message : 'Unknown error')
  process.exitCode = 1
}).finally(async () => {
  if (redis) (await redis.getRedis()).disconnect()
  await prisma.$disconnect()
})
