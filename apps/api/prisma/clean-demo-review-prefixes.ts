/** Remove presentation-only demo prefixes without changing review scores.
 * node --env-file=.env -r ts-node/register prisma/clean-demo-review-prefixes.ts [--apply]
 */
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const reviews = await prisma.review.findMany({ where: { content: { startsWith: '[DEMO' }, deletedAt: null }, select: { reviewId: true, content: true } })
  const planned = reviews.map(review => ({ ...review, cleaned: review.content.replace(/^\[DEMO(?:\s*-[^\]]*)?\]\s*/i, '') })).filter(review => review.cleaned && review.cleaned !== review.content)
  console.log(JSON.stringify({ mode: process.argv.includes('--apply') ? 'apply' : 'preview', reviews: planned.length }))
  if (!process.argv.includes('--apply')) return
  let updated = 0
  for (let start = 0; start < planned.length; start += 5) {
    const results = await Promise.all(planned.slice(start, start + 5).map(review => prisma.$transaction(async tx => {
      const result = await tx.review.updateMany({ where: { reviewId: review.reviewId, content: review.content }, data: { content: review.cleaned } })
      if (result.count) await tx.log.create({ data: { action: 'DEMO_REVIEW_PREFIX_REMOVED', entityType: 'Review', entityId: review.reviewId, oldData: { content: review.content }, newData: { content: review.cleaned, source: 'demo' } } })
      return result.count
    }, { maxWait: 10000, timeout: 20000 })))
    updated += results.reduce((sum, count) => sum + count, 0)
  }
  console.log(JSON.stringify({ updated }))
}
main().catch(() => { console.error('Review cleanup failed'); process.exitCode = 1 }).finally(() => prisma.$disconnect())
