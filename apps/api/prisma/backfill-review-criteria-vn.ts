// One-off script: backfill ReviewCriterion rows for the 60 demo reviews
// created by prisma/seed-reviews-vn.ts. Those reviews were seeded before
// prisma/seed-criteria-vn.ts existed, so each review's criteriaRatings ended
// up empty (categoryCriteria was empty at seed time) — this fills them in
// from the review's own overallRating, using the same deterministic spread
// seed-reviews-vn.ts already documents. Only touches reviews with zero
// existing ReviewCriterion rows, so it's safe to re-run.
// Run manually after prisma/seed-criteria-vn.ts:
//   pnpm --filter api exec ts-node prisma/backfill-review-criteria-vn.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const CRITERION_VARIANCE = [0, 1, -1, 0]

function clampRating(value: number) {
  return Math.min(5, Math.max(1, value))
}

async function main() {
  console.log('Backfilling review criteria for demo reviews...')

  const reviews = await prisma.review.findMany({
    where: { writer: { email: { endsWith: '@eers-demo.vn' } }, deletedAt: null },
    select: { reviewId: true, businessId: true, overallRating: true, createdAt: true },
  })

  let updated = 0
  let skipped = 0

  for (const review of reviews) {
    const existing = await prisma.reviewCriterion.findFirst({ where: { reviewId: review.reviewId } })
    if (existing) {
      skipped++
      continue
    }

    const categoryCriteria = await prisma.categoryCriterion.findMany({
      where: { category: { businessCategories: { some: { businessId: review.businessId } } } },
      select: { criterionId: true },
    })

    await Promise.all(
      categoryCriteria.map((criterion, i) =>
        prisma.reviewCriterion.create({
          data: {
            reviewId: review.reviewId,
            criterionId: criterion.criterionId,
            ratingValue: clampRating(review.overallRating + CRITERION_VARIANCE[i % CRITERION_VARIANCE.length]),
            createdAt: review.createdAt,
          },
        }),
      ),
    )
    updated++
  }

  console.log(`Done. Backfilled ${updated} review(s), skipped ${skipped} already-scored review(s).`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
