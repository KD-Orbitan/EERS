'use client';

import { useQueries } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';
import { BusinessCategory } from '@/features/business/types/business.type';
import { TopRankingItem } from '@/features/ranking/types/ranking.type';

export interface CategoryLeaderboard {
  category: BusinessCategory;
  items: TopRankingItem[];
  isLoading: boolean;
}

// "Best in Category" leaderboards (Trustpilot's "Best in Bank" pattern) — top
// N businesses per category via the existing GET /rankings/top?categoryId
// endpoint (already supported, no new endpoint needed). Deliberately carries
// no trend/growth data: ranking_snapshot_history only tracks GLOBAL scope
// (DECISIONS.md D-031), and category-filtered results always return
// trend: null.
export function useCategoryLeaderboardsQuery(categories: BusinessCategory[], limit = 3): CategoryLeaderboard[] {
  const results = useQueries({
    queries: categories.map((category) => ({
      queryKey: [...QUERY_KEYS.RANKINGS_TOP, { categoryId: category.categoryId, limit }],
      queryFn: async (): Promise<TopRankingItem[]> => {
        const response = await apiClient.get('/rankings/top', { params: { categoryId: category.categoryId, limit } });
        return response.data.data as TopRankingItem[];
      },
      staleTime: 15 * 60_000,
      retry: 1,
    })),
  });

  return categories.map((category, index) => ({
    category,
    items: results[index]?.data ?? [],
    isLoading: results[index]?.isLoading ?? false,
  }));
}
