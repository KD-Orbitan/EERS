export interface RankingListItem {
  rank: number;
  businessId: number;
  businessName: string;
  avgRating: number;
  reviewCount: number;
  rankingScore: number;
  /** Present on the live API though not in API.md's documented shape. */
  province?: string;
  /** Null when a categoryId/province filter is applied, or with no baseline yet (see DECISIONS.md D-031). */
  trend?: RankingTrend | null;
}

export interface TopRankingItem {
  rank: number;
  businessId: number;
  businessName: string;
  avgRating: number;
  rankingScore: number;
  province?: string;
}

export type RankingTrendPeriod = 'DAY' | 'WEEK' | 'MONTH';

export interface RankingTrend {
  period: RankingTrendPeriod;
  rankChange: number;
  scoreChange: number;
}

/** Derived client-side from RankingListItem.trend (GLOBAL scope only, D-031) — not a distinct API shape. */
export interface TrendingBusinessItem {
  businessId: number;
  businessName: string;
  rank: number;
  rankingScore: number;
  reviewCount: number;
  province?: string;
  trend: RankingTrend;
  growthPercent: number;
}

export interface BusinessRanking {
  businessId: number;
  rank: number | null;
  rankingScore: number | null;
  reviewCount: number;
  avgRating: number;
  lastCalculatedAt: string;
  trend?: RankingTrend | null;
}

export interface RankingMetadata {
  lastCalculatedAt: string;
  totalRankedBusinesses: number;
}

export interface CompetitorItem {
  businessId: number;
  businessName: string;
  rank: number;
  rankingScore: number;
  avgRating: number;
}

export interface MarketCompetitorsResponse {
  categoryId: number | null;
  categoryName: string | null;
  businessRank: number | null;
  competitors: CompetitorItem[];
}
