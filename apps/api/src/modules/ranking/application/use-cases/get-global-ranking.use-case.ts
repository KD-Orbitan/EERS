import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../infrastructure/database/prisma.service'
import { RankingCacheService, RankingSnapshotCacheItem } from '../../infrastructure/services/ranking-cache.service'
import { RankingTrendConfigService } from '../../infrastructure/services/ranking-trend-config.service'

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
    private readonly prisma: PrismaService,
    private readonly rankingCacheService: RankingCacheService,
    private readonly rankingTrendConfigService: RankingTrendConfigService,
  ) {}

  private buildCacheItem(row: any): RankingSnapshotCacheItem {
    return {
      rank: row.rank,
      businessId: Number(row.businessId),
      businessName: row.business.name,
      avgRating: Number(row.avgRating),
      reviewCount: Number(row.reviewCount),
      rankingScore: Number(row.rankingScore),
      province: row.business.locations?.[0]?.location?.province ?? null,
    }
  }

  private async querySnapshots(query: RankingListQuery) {
    const where: any = {}
    if (query.categoryId) {
      where.scope = 'CATEGORY'
      where.scopeId = BigInt(query.categoryId)
    } else if (query.province) {
      where.scope = 'PROVINCE'
    } else {
      where.scope = 'GLOBAL'
    }

    const snapshots = await this.prisma.rankingSnapshot.findMany({
      where,
      orderBy: [{ rank: 'asc' }],
      include: {
        business: {
          include: {
            locations: { include: { location: true } },
          },
        },
      },
    })

    let items = snapshots.map((snapshot) => ({
      rank: snapshot.rank,
      businessId: Number(snapshot.businessId),
      businessName: snapshot.business.name,
      avgRating: Number(snapshot.avgRating),
      reviewCount: snapshot.reviewCount,
      rankingScore: Number(snapshot.rankingScore),
      province: snapshot.business.locations[0]?.location?.province ?? null,
    }))

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
