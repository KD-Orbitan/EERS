export interface RankingListItem {
  rank: number;
  businessId: number;
  businessName: string;
  avgRating: number;
  reviewCount: number;
  rankingScore: number;
  /** Present on the live API though not in API.md's documented shape. */
  province?: string;
}

export interface TopRankingItem {
  rank: number;
  businessId: number;
  businessName: string;
  avgRating: number;
  rankingScore: number;
  province?: string;
}

export interface BusinessRanking {
  businessId: number;
  rank: number | null;
  rankingScore: number | null;
  reviewCount: number;
  avgRating: number;
  lastCalculatedAt: string;
}

export interface RankingMetadata {
  lastCalculatedAt: string;
  totalRankedBusinesses: number;
}
