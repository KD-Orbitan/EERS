'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';
import { ScoringConfig } from '@/features/admin/types/admin.type';

export function useScoringConfigQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.ADMIN_SCORING_CONFIG,
    queryFn: async (): Promise<ScoringConfig> => {
      const response = await apiClient.get('/admin/scoring-config');
      return response.data.data as ScoringConfig;
    },
    staleTime: 30 * 60_000,
  });
}
