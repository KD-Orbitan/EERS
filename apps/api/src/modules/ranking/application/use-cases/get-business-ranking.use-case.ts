import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../infrastructure/database/prisma.service'
import { RankingTrendConfigService } from '../../infrastructure/services/ranking-trend-config.service'

@Injectable()
export class GetBusinessRankingUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rankingTrendConfigService: RankingTrendConfigService,
  ) {}

  async execute(businessId: number) {
    const ranking = await this.prisma.rankingSnapshot.findFirst({
      where: { businessId: BigInt(businessId), scope: 'GLOBAL' },
      orderBy: { rank: 'asc' },
    })
    if (!ranking) {
      return null
    }

    const trend = await this.computeTrend(businessId, ranking.rank, Number(ranking.rankingScore))
    return { rank: ranking.rank, rankingScore: Number(ranking.rankingScore), trend }
  }

  private async computeTrend(businessId: number, currentRank: number, currentScore: number) {
    const period = await this.rankingTrendConfigService.getPeriod()
    const baselines = await this.rankingTrendConfigService.getBaselines([businessId], period)
    const baseline = baselines.get(businessId)
    if (!baseline) {
      return null
    }

    return {
      period,
      rankChange: baseline.rank - currentRank,
      scoreChange: Number((currentScore - baseline.rankingScore).toFixed(4)),
    }
  }
}
