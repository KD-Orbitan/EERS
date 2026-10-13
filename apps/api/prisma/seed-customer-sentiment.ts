/** Demo-only sentiment labels; no model inference. Dry run unless --apply is supplied.
 * node --env-file=.env -r ts-node/register prisma/seed-customer-sentiment.ts --apply
 */
import { PrismaClient, Prisma, SentimentType } from '@prisma/client'
const prisma = new PrismaClient()
const demoScope: Prisma.ReviewWhereInput = {
  status: 'approved', deletedAt: null, sentiment: null, sentimentAnalyzedAt: null,
  business: { status: 'approved', deletedAt: null },
  OR: [
    { writer: { email: { in: Array.from({ length: 12 }, (_, i) => `demo-reviewer-${i + 1}@eers-demo.vn`) } } },
    { writer: { email: { startsWith: 'demo-ranking-20260911-', endsWith: '@example.invalid' } } },
  ],
}
// The expanded demo seed defines three scenarios per business: praise (5),
// mixed feedback (4), and a complaint (3). The original demo uses star bands.
function demoLabel(isExpandedDemo: boolean, rating: number): SentimentType {
  if (isExpandedDemo) return rating >= 5 ? 'positive' : rating === 4 ? 'neutral' : 'negative'
  return rating >= 4 ? 'positive' : rating === 3 ? 'neutral' : 'negative'
}
async function main() {
  const reviews = await prisma.review.findMany({ where: demoScope, select: { reviewId: true, businessId: true, content: true, overallRating: true, writer: { select: { email: true } } }, orderBy: { reviewId: 'asc' } })
  const planned = reviews.map(review => ({ ...review, label: demoLabel(review.writer.email.startsWith('demo-ranking-20260911-'), review.overallRating) }))
  console.log(JSON.stringify({ mode: process.argv.includes('--apply') ? 'apply' : 'preview', reviews: planned.length, businesses: new Set(planned.map(review => String(review.businessId))).size, counts: Object.fromEntries(['positive', 'neutral', 'negative'].map(label => [label, planned.filter(review => review.label === label).length])) }))
  if (!process.argv.includes('--apply')) return
  let updated = 0
  for (const review of planned) {
    updated += await prisma.$transaction(async tx => {
      const result = await tx.review.updateMany({ where: { AND: [demoScope, { reviewId: review.reviewId }] }, data: { sentiment: review.label, sentimentScore: null, sentimentAnalyzedAt: new Date() } })
      if (result.count) await tx.log.create({ data: { action: 'DEMO_SENTIMENT_SEEDED', entityType: 'Review', entityId: review.reviewId, newData: { sentiment: review.label, source: 'manual-demo', note: 'Simulated label for demo reviews; not AI inference or model confidence.' } } })
      return result.count
    })
  }
  const coverage = await prisma.review.groupBy({ by: ['businessId', 'sentiment'], where: { businessId: { in: [...new Set(planned.map(review => review.businessId))] }, status: 'approved', deletedAt: null, sentiment: { not: null } }, _count: true })
  console.log(JSON.stringify({ updated, verifiedLabeledReviews: coverage.reduce((sum, row) => sum + row._count, 0), businessesWithSentiment: new Set(coverage.map(row => String(row.businessId))).size }))
}
main().catch(error => { console.error(error instanceof Error ? error.message.replace(/postgres(?:ql)?:\/\/[^\s]+/g, '[redacted database URL]') : 'Seed failed'); process.exitCode = 1 }).finally(() => prisma.$disconnect())
