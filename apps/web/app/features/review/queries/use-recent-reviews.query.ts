'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';
import { RecentReviewItem } from '@/features/review/types/review.type';

export interface RecentReviewsParams {
  limit?: number;
}

export function useRecentReviewsQuery(params: RecentReviewsParams = {}) {
  return useQuery({
    queryKey: [...QUERY_KEYS.RECENT_REVIEWS, params],
    queryFn: async (): Promise<RecentReviewItem[]> => {
      const response = await apiClient.get('/reviews/recent', { params });
      return response.data.data as RecentReviewItem[];
    },
    staleTime: 5 * 60_000,
    retry: 1,
  });
}
