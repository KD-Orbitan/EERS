import { Injectable } from '@nestjs/common'
import { RedisService } from '../../../../infrastructure/cache/redis.service'
import { CACHE_KEYS } from '@eers/shared-constants'

export type RankingSnapshotCacheItem = {
  rank: number
  businessId: number
  businessName: string
  avgRating: number
  reviewCount: number
  rankingScore: number
  province?: string | null
}

@Injectable()
export class RankingCacheService {
  constructor(private readonly redisService: RedisService) {}

  private getCacheKey(categoryId?: number, province?: string): string {
    if (categoryId) {
      return CACHE_KEYS.RANKING_CATEGORY(categoryId)
    }
    if (province) {
      return CACHE_KEYS.RANKING_PROVINCE(province)
    }
    return CACHE_KEYS.RANKING_GLOBAL
  }

  async getCachedRanking(categoryId?: number, province?: string): Promise<RankingSnapshotCacheItem[] | null> {
    const key = this.getCacheKey(categoryId, province)
    const cached = await this.redisService.get(key)
    if (!cached) {
      return null
    }
    try {
      return JSON.parse(cached) as RankingSnapshotCacheItem[]
    } catch {
      return null
    }
  }

  async setCachedRanking(items: RankingSnapshotCacheItem[], categoryId?: number, province?: string): Promise<void> {
    const key = this.getCacheKey(categoryId, province)
    await this.redisService.set(key, JSON.stringify(items), 3600)
  }

  async invalidateRankingCache(): Promise<void> {
    await this.redisService.del(CACHE_KEYS.RANKING_GLOBAL)

    const redis = await this.redisService.getRedis()
    const categoryKeys = await redis.keys('ranking:category:*')
    const provinceKeys = await redis.keys('ranking:province:*')
    const keysToDelete = [...categoryKeys, ...provinceKeys]
    if (keysToDelete.length > 0) {
      await redis.del(...keysToDelete)
    }
  }
}
