import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../infrastructure/database/prisma.service'
import { RankingCacheService, RankingSnapshotCacheItem } from '../../infrastructure/services/ranking-cache.service'

export type RankingListQuery = {
  page?: number
  limit?: number
  categoryId?: number
  province?: string
  search?: string
}

@Injectable()
export class GetGlobalRankingUseCase {
  constructor(private readonly prisma: PrismaService, private readonly rankingCacheService: RankingCacheService) {}

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
      items = items.filter((item) => item.province === query.province)
    }

    return items
  }

  async execute(query: RankingListQuery) {
    const page = query.page && query.page > 0 ? query.page : 1
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 20
    const useCache = !query.search
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
    return {
      data: items.slice(start, start + limit),
      meta: {
        page,
        limit,
        total: items.length,
      },
    }
  }
}
