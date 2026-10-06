import { Injectable } from '@nestjs/common'
import { RankingQueryRepository } from '../ports/ranking-query.repository'
import { RankingCachePort, RankingSnapshotCacheItem } from '../ports/ranking-cache.port'
import { RankingTrendConfigPort } from '../ports/ranking-trend-config.port'

export type RankingListQuery = {
  page?: number
  limit?: number
  categoryId?: number
  province?: string
  search?: string
}

@Injectable()
export class GetGlobalRankingUseCase {
  constructor(
    private readonly repository: RankingQueryRepository,
    private readonly rankingCacheService: RankingCachePort,
    private readonly rankingTrendConfigService: RankingTrendConfigPort,
  ) {}

  private async querySnapshots(query: RankingListQuery) {
    let items = await this.repository.getSnapshots({ categoryId: query.categoryId, province: query.province })

    if (query.search) {
      const term = query.search.toLowerCase()
      items = items.filter((item) => item.businessName.toLowerCase().includes(term))
    }

    if (query.province) {
      const normalize = (value: string) => value.trim().replace(/^(tỉnh|thành phố|tp\.?)\s*/iu, '').trim().toLocaleLowerCase('vi')
      items = items.filter((item) => normalize(item.province ?? '') === normalize(query.province!))
    }

    return items
  }

  async execute(query: RankingListQuery) {
    const page = query.page && query.page > 0 ? query.page : 1
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 20
    // Province aliases and combined category/province filters need the full query.
    const useCache = !query.search && !query.province
    let items: RankingSnapshotCacheItem[]

    if (useCache) {
      items = await this.rankingCacheService.getCachedRanking(query.categoryId, query.province) ?? []
      if (items.length === 0) {
        items = await this.querySnapshots(query)
        await this.rankingCacheService.setCachedRanking(items, query.categoryId, query.province)
      }
    } else {
      items = await this.querySnapshots(query)
    }

    const start = (page - 1) * limit
    const pageItems = items.slice(start, start + limit)

    // Trend baselines come from ranking_snapshot_history, which is GLOBAL-scope
    // only (see DECISIONS.md D-031) — CATEGORY/PROVINCE-filtered lists have no
    // baseline to compare against, so trend is always null for them.
    const isGlobalScope = !query.categoryId && !query.province
    const trendByBusinessId = new Map<number, { period: string; rankChange: number; scoreChange: number }>()
    if (isGlobalScope && pageItems.length > 0) {
      const period = await this.rankingTrendConfigService.getPeriod()
      const baselines = await this.rankingTrendConfigService.getBaselines(
        pageItems.map((item) => item.businessId),
        period,
      )
      for (const item of pageItems) {
        const baseline = baselines.get(item.businessId)
        if (baseline) {
          trendByBusinessId.set(item.businessId, {
            period,
            rankChange: baseline.rank - item.rank,
            scoreChange: Number((item.rankingScore - baseline.rankingScore).toFixed(4)),
          })
        }
      }
    }

    return {
      items: pageItems.map((item) => ({ ...item, trend: trendByBusinessId.get(item.businessId) ?? null })),
      total: items.length,
    }
  }
}
