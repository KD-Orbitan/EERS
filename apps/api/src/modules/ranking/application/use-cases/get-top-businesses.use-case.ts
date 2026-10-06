import { Injectable } from '@nestjs/common'
import { RankingQueryRepository } from '../ports/ranking-query.repository'
import { RankingCachePort } from '../ports/ranking-cache.port'

@Injectable()
export class GetTopBusinessesUseCase {
  constructor(private readonly repository: RankingQueryRepository, private readonly rankingCacheService: RankingCachePort) {}

  async execute({ limit = 10, categoryId, province }: { limit?: number; categoryId?: number; province?: string }) {
    const normalizedLimit = Math.min(Math.max(limit, 1), 20)
    const cacheItems = province ? null : await this.rankingCacheService.getCachedRanking(categoryId, province)
    let items = cacheItems

    if (!items) {
      const snapshots = await this.repository.getSnapshots({ categoryId, province, ...(province ? {} : { limit: normalizedLimit }) })
      const normalize = (value: string) => value.trim().replace(/^(tỉnh|thành phố|tp\.?)\s*/iu, '').trim().toLocaleLowerCase('vi')
      const matching = province ? snapshots.filter((snapshot) => normalize(snapshot.province ?? '') === normalize(province)) : snapshots
      items = matching.map((snapshot) => ({
        rank: snapshot.rank,
        businessId: Number(snapshot.businessId),
        businessName: snapshot.businessName,
        avgRating: Number(snapshot.avgRating),
        reviewCount: snapshot.reviewCount,
        rankingScore: Number(snapshot.rankingScore),
      }))
      if (!province) await this.rankingCacheService.setCachedRanking(items, categoryId, province)
    }

    return items.slice(0, normalizedLimit)
  }
}
