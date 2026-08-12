// One-off script: backfill synthetic ranking_snapshot_history rows so the
// ranking trend feature (see docs/DECISIONS.md D-031) has enough historical
// data to show a non-null rank/score change for every admin-selectable
// period (DAY/WEEK/MONTH), instead of `trend: null` from insufficient history.
// Not part of seed.ts (that must stay deterministic/offline) — run manually,
// after at least one real ranking recalculation has populated ranking_snapshots
// (POST /admin/rankings/recalculate):
//   pnpm --filter api exec ts-node prisma/backfill-ranking-trend-history.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Days-ago offsets to backfill: covers the DAY (1d), WEEK (7d) and MONTH (30d)
// lookbacks with margin on both sides, while staying under the 40-day
// retention cutoff the real ranking cron enforces (D-031).
const OFFSETS_DAYS = [35, 28, 21, 14, 10, 7, 5, 3, 2, 1]
const DAY_MS = 24 * 60 * 60 * 1000

function randomInRange(min: number, max: number) {
  return min + Math.random() * (max - min)
}

async function main() {
  const currentSnapshots = await prisma.rankingSnapshot.findMany({ where: { scope: 'GLOBAL' } })
  if (currentSnapshots.length === 0) {
    console.error('No GLOBAL ranking_snapshots found. Run a ranking recalculation first (POST /admin/rankings/recalculate).')
    process.exit(1)
  }

  const businessIds = currentSnapshots.map((snapshot) => snapshot.businessId)

  // Clear anything older than a day so re-running this script is idempotent
  // (rows from this or a previous backfill run get replaced with fresh ones;
  // anything a real cron run wrote in the last 24h is left untouched).
  const { count: deletedCount } = await prisma.rankingSnapshotHistory.deleteMany({
    where: { businessId: { in: businessIds }, calculatedAt: { lt: new Date(Date.now() - DAY_MS) } },
  })
  console.log(`Cleared ${deletedCount} stale history row(s) older than 24h.`)

  const rows: { businessId: bigint; rank: number; rankingScore: number; calculatedAt: Date }[] = []

  for (const snapshot of currentSnapshots) {
    const currentScore = Number(snapshot.rankingScore)
    const currentRank = snapshot.rank

    // Each business gets its own drift direction/magnitude so trends vary —
    // some businesses trending up, some down, some roughly flat — instead of
    // every row moving in lockstep.
    const scoreDriftPerDay = randomInRange(-0.02, 0.02) // up to ±2%/day
    const rankDriftPerDay = -scoreDriftPerDay * randomInRange(80, 160) // opposite sign: score up => past rank number was worse (higher)

    for (const daysAgo of OFFSETS_DAYS) {
      const noise = randomInRange(-0.01, 0.01)
      const historicalScore = Math.max(0.01, currentScore * (1 - scoreDriftPerDay * daysAgo + noise))
      const historicalRank = Math.max(1, Math.round(currentRank + rankDriftPerDay * daysAgo + randomInRange(-1, 1)))

      rows.push({
        businessId: snapshot.businessId,
        rank: historicalRank,
        rankingScore: Number(historicalScore.toFixed(4)),
        calculatedAt: new Date(Date.now() - daysAgo * DAY_MS),
      })
    }
  }

  await prisma.rankingSnapshotHistory.createMany({ data: rows })
  console.log(`Inserted ${rows.length} history row(s) across ${currentSnapshots.length} business(es) and ${OFFSETS_DAYS.length} past dates.`)
  console.log('Done. Trend should now show for the DAY/WEEK/MONTH lookback (whichever is set at GET /admin/rankings/trend-config).')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
