'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';
import { RankingListItem } from '@/features/ranking/types/ranking.type';
import { PaginationMeta } from '@/features/business/types/business.type';

export interface RankingListParams {
  page?: number;
  limit?: number;
  categoryId?: number;
  province?: string;
  search?: string;
}

interface RankingListResult {
  items: RankingListItem[];
  meta: PaginationMeta;
}

export function useRankingsQuery(params: RankingListParams = {}) {
  return useQuery({
    queryKey: [...QUERY_KEYS.RANKINGS, params],
    queryFn: async (): Promise<RankingListResult> => {
      const response = await apiClient.get('/rankings', { params });
      return { items: response.data.data as RankingListItem[], meta: response.data.meta as PaginationMeta };
    },
    staleTime: 10 * 60_000,
    retry: 1,
  });
}
