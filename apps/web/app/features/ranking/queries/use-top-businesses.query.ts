'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';
import { TopRankingItem } from '@/features/ranking/types/ranking.type';

export interface TopBusinessesParams {
  limit?: number;
  categoryId?: number;
  province?: string;
}

export function useTopBusinessesQuery(params: TopBusinessesParams = {}) {
  return useQuery({
    queryKey: [...QUERY_KEYS.RANKINGS_TOP, params],
    queryFn: async (): Promise<TopRankingItem[]> => {
      const response = await apiClient.get('/rankings/top', { params });
      return response.data.data as TopRankingItem[];
    },
    staleTime: 15 * 60_000,
    retry: 1,
  });
}
