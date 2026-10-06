export type RankingSnapshotCacheItem = {
  rank: number
  businessId: number
  businessName: string
  avgRating: number
  reviewCount: number
  rankingScore: number
  province?: string | null
}

export abstract class RankingCachePort {
  abstract getCachedRanking(categoryId?: number, province?: string): Promise<RankingSnapshotCacheItem[] | null>
  abstract setCachedRanking(items: RankingSnapshotCacheItem[], categoryId?: number, province?: string): Promise<void>
  abstract invalidateRankingCache(): Promise<void>
}
