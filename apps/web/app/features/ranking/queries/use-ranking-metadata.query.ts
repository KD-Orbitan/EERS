'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';
import { RankingMetadata } from '@/features/ranking/types/ranking.type';

export function useRankingMetadataQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.RANKINGS_METADATA,
    queryFn: async (): Promise<RankingMetadata> => {
      const response = await apiClient.get('/rankings/metadata');
      return response.data.data as RankingMetadata;
    },
    staleTime: 15 * 60_000,
    retry: 1,
  });
}
