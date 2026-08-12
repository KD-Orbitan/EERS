'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';
import { RankingListItem, TrendingBusinessItem } from '@/features/ranking/types/ranking.type';

export interface TrendingBusinessesParams {
  limit?: number;
}

// "Trending" businesses reuse the GLOBAL trend field GET /rankings already
// returns per item (rankChange/scoreChange, see DECISIONS.md D-031) — there's
// no dedicated top-trending endpoint, so this fetches the top page of the
// unfiltered global leaderboard (max limit=100) and ranks it by score growth
// % client-side, instead of by rank like the regular list.
export function useTrendingBusinessesQuery({ limit = 5 }: TrendingBusinessesParams = {}) {
  return useQuery({
    queryKey: [...QUERY_KEYS.RANKINGS, 'trending'],
    queryFn: async (): Promise<TrendingBusinessItem[]> => {
      const response = await apiClient.get('/rankings', { params: { page: 1, limit: 100 } });
      const items = response.data.data as RankingListItem[];

      return items
        .flatMap((item) => {
          if (!item.trend || item.trend.scoreChange <= 0) return [];
          const baselineScore = item.rankingScore - item.trend.scoreChange;
          if (baselineScore <= 0) return [];

          const growthPercent = (item.trend.scoreChange / baselineScore) * 100;
          const trending: TrendingBusinessItem = {
            businessId: item.businessId,
            businessName: item.businessName,
            rank: item.rank,
            rankingScore: item.rankingScore,
            reviewCount: item.reviewCount,
            province: item.province,
            trend: item.trend,
            growthPercent,
          };
          return [trending];
        })
        .sort((a, b) => b.growthPercent - a.growthPercent)
        .slice(0, limit);
    },
    staleTime: 10 * 60_000,
    retry: 1,
  });
}
