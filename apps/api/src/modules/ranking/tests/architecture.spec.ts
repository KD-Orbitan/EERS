import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Test } from '@nestjs/testing'
import { MODULE_METADATA } from '@nestjs/common/constants'
import { RankingModule } from '../ranking.module'
import { PrismaService } from '../../../infrastructure/database/prisma.service'
import { RedisService } from '../../../infrastructure/cache/redis.service'
import { RankingRepository } from '../application/ports/ranking.repository'
import { RankingQueryRepository } from '../application/ports/ranking-query.repository'
import { RankingCalculationService } from '../application/services/ranking-calculation.service'
import { GetGlobalRankingUseCase } from '../application/use-cases/get-global-ranking.use-case'
import { RankingDbService } from '../infrastructure/services/ranking-db.service'
import { PrismaRankingQueryRepository } from '../infrastructure/repositories/prisma-ranking-query.repository'

function sources(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? sources(path) : path.endsWith('.ts') ? [path] : []
  })
}

describe('Ranking architecture', () => {
  it('keeps application dependencies independent of infrastructure and Prisma', () => {
    for (const file of sources(join(__dirname, '../application'))) {
      const source = readFileSync(file, 'utf8')
      expect({ file, forbidden: /(?:from\s*|import\s*\(|require\s*\()\s*['"][^'"]*(?:infrastructure|@prisma\/client)/.test(source) }).toEqual({ file, forbidden: false })
      expect(source).not.toMatch(/PrismaService|this\.prisma|\$transaction/)
    }
  })

  it('resolves application services through the actual module provider bindings', async () => {
    const module = await Test.createTestingModule({
      providers: [
        ...Reflect.getMetadata(MODULE_METADATA.PROVIDERS, RankingModule),
        { provide: PrismaService, useValue: {} },
        { provide: RedisService, useValue: {} },
      ],
    }).compile()
    try {
      expect(module.get(RankingRepository)).toBe(module.get(RankingDbService))
      expect(module.get(RankingQueryRepository)).toBe(module.get(PrismaRankingQueryRepository))
      expect(module.get(RankingCalculationService)).toBeInstanceOf(RankingCalculationService)
      expect(module.get(GetGlobalRankingUseCase)).toBeInstanceOf(GetGlobalRankingUseCase)
    } finally {
      await module.close()
    }
  })
})
