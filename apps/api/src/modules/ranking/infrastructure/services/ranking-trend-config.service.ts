import { RankingTrendConfigPort, RankingTrendPeriod } from '../../application/ports/ranking-trend-config.port'
export { RANKING_HISTORY_RETENTION_DAYS } from '../../application/ports/ranking-trend-config.port'
export type { RankingTrendPeriod } from '../../application/ports/ranking-trend-config.port'
import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../infrastructure/database/prisma.service'

const PERIOD_DAYS: Record<RankingTrendPeriod, number> = {
  DAY: 1,
  WEEK: 7,
  MONTH: 30,
}

@Injectable()
export class RankingTrendConfigService implements RankingTrendConfigPort {
  constructor(private readonly prisma: PrismaService) {}

  async getPeriod(): Promise<RankingTrendPeriod> {
    const config = await this.prisma.rankingTrendConfig.findFirst()
    return (config?.period as RankingTrendPeriod) ?? 'WEEK'
  }

  periodToDays(period: RankingTrendPeriod): number {
    return PERIOD_DAYS[period]
  }

  async getBaselines(
    businessIds: number[],
    period: RankingTrendPeriod,
  ): Promise<Map<number, { rank: number; rankingScore: number }>> {
    const result = new Map<number, { rank: number; rankingScore: number }>()
    if (businessIds.length === 0) {
      return result
    }

    const cutoff = new Date(Date.now() - this.periodToDays(period) * 24 * 60 * 60 * 1000)
    const rows = await this.prisma.rankingSnapshotHistory.findMany({
      where: { businessId: { in: businessIds.map((id) => BigInt(id)) }, calculatedAt: { lte: cutoff } },
      orderBy: { calculatedAt: 'desc' },
      distinct: ['businessId'],
    })

    for (const row of rows) {
      result.set(Number(row.businessId), { rank: row.rank, rankingScore: Number(row.rankingScore) })
    }
    return result
  }
}
