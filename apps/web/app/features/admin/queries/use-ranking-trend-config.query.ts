'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';
import { RankingTrendConfig } from '@/features/admin/types/admin.type';

export function useRankingTrendConfigQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.ADMIN_RANKING_TREND_CONFIG,
    queryFn: async (): Promise<RankingTrendConfig> => {
      const response = await apiClient.get('/admin/rankings/trend-config');
      return response.data.data as RankingTrendConfig;
    },
    staleTime: 30 * 60_000,
  });
}
