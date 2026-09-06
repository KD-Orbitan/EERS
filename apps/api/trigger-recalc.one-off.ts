// Temporary one-off script — not a repo fixture, delete after use.
// Boots the real Nest DI context and calls RankingCalculationService
// directly, so it reuses the exact production algorithm instead of
// re-implementing it. Requires DATABASE_URL + REDIS_URL env vars.
import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './src/app.module'
import { RankingCalculationService } from './src/modules/ranking/application/services/ranking-calculation.service'

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn', 'log'] })
  const service = app.get(RankingCalculationService)
  console.log('Running ranking recalculation...')
  await service.execute()
  console.log('Done.')
  await app.close()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
