import { NestFactory } from '@nestjs/core'
import { AppModule } from '../src/app.module'
import { PrismaService } from '../src/infrastructure/database/prisma.service'
import { RankingCalculationService } from '../src/modules/ranking/application/services/ranking-calculation.service'

// One-off maintenance run: ranking_snapshot_history rows written before the
// bayesian_c scale fix + the [0,1]→[0,100] display-scale rescale
// (DECISIONS.md D-012 Step 6b) are on incompatible scales with rows written
// after. Trend growth% (D-031) diffs current vs. baseline rankingScore, so
// mixing scales produces nonsense numbers for up to
// RANKING_HISTORY_RETENTION_DAYS (40 days). Clearing history + forcing an
// immediate recalculation gives every remaining row the same, correct scale.
async function main() {
  const app = await NestFactory.createApplicationContext(AppModule)
  try {
    const prisma = app.get(PrismaService)
    const deleted = await prisma.rankingSnapshotHistory.deleteMany({})
    console.log(`Cleared ${deleted.count} stale-scale ranking_snapshot_history rows`)

    const rankingCalculationService = app.get(RankingCalculationService)
    await rankingCalculationService.execute()
    console.log('Ranking recalculation complete — ranking_snapshots and a fresh ranking_snapshot_history baseline are now on the [0,100] scale')
  } finally {
    await app.close()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
