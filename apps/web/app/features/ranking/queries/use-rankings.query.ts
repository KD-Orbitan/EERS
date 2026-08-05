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

// GET /rankings currently nests one level deeper than every other paginated
// endpoint in this API — { success, data: { data: [...], meta: {...} } }
// instead of { success, data: [...], meta: {...} } — and its meta has no
// totalPages. Parsed defensively so this still works if the backend is
// later fixed to match the documented D-024 envelope.
export function useRankingsQuery(params: RankingListParams = {}) {
  return useQuery({
    queryKey: [...QUERY_KEYS.RANKINGS, params],
    queryFn: async (): Promise<RankingListResult> => {
      const response = await apiClient.get('/rankings', { params });
      const body = response.data;
      const isNested = !Array.isArray(body.data) && Array.isArray(body.data?.data);

      const items = (isNested ? body.data.data : body.data) as RankingListItem[];
      const rawMeta = (isNested ? body.data.meta : body.meta) ?? {};
      const page = rawMeta.page ?? params.page ?? 1;
      const limit = rawMeta.limit ?? params.limit ?? 20;
      const total = rawMeta.total ?? items.length;

      return {
        items,
        meta: {
          page,
          limit,
          total,
          totalPages: rawMeta.totalPages ?? Math.max(1, Math.ceil(total / limit)),
        },
      };
    },
    staleTime: 10 * 60_000,
    retry: 1,
  });
}
