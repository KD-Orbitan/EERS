import { RankingSnapshotCacheItem } from './ranking-cache.port'

export type RankingSelection = { categoryId?: number; province?: string; limit?: number }
export type CompetitorRecord = {
  businessId: number
  businessName: string
  rank: number
  rankingScore: number
  avgRating: number
}

export abstract class RankingQueryRepository {
  abstract getBusinessGlobalRanking(businessId: number): Promise<{ rank: number; rankingScore: number } | null>
  abstract getSnapshots(selection: RankingSelection): Promise<RankingSnapshotCacheItem[]>
  abstract getMetadata(): Promise<{ lastCalculatedAt: Date | null; totalRankedBusinesses: number }>
  abstract getBusinessCategoryRanks(businessId: number): Promise<Array<{ scopeId: number | null; rank: number }>>
  abstract getCategoryName(categoryId: number): Promise<string | null>
  abstract getCategoryCompetitors(categoryId: number, excludeBusinessId: number): Promise<CompetitorRecord[]>
}
