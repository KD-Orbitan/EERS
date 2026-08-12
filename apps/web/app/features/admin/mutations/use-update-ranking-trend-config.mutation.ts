'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';
import { RankingTrendConfigInput } from '@/features/admin/schemas/ranking-trend-config.schema';

export function useUpdateRankingTrendConfigMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: RankingTrendConfigInput) => {
      const response = await apiClient.patch('/admin/rankings/trend-config', input);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADMIN_RANKING_TREND_CONFIG });
    },
  });
}
