import { Injectable } from '@nestjs/common'
import { RankingQueryRepository } from '../ports/ranking-query.repository'
import { RankingTrendConfigPort } from '../ports/ranking-trend-config.port'

@Injectable()
export class GetBusinessRankingUseCase {
  constructor(
    private readonly repository: RankingQueryRepository,
    private readonly rankingTrendConfigService: RankingTrendConfigPort,
  ) {}

  async execute(businessId: number) {
    const ranking = await this.repository.getBusinessGlobalRanking(businessId)
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
