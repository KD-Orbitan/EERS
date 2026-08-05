'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';
import { MyReviewListItem } from '@/features/review/types/review.type';
import { PaginationMeta } from '@/features/business/types/business.type';

export interface MyReviewsParams {
  page?: number;
  limit?: number;
}

interface MyReviewsResult {
  items: MyReviewListItem[];
  meta: PaginationMeta;
}

export function useMyReviewsQuery(params: MyReviewsParams = {}) {
  return useQuery({
    queryKey: [...QUERY_KEYS.MY_REVIEWS, params],
    queryFn: async (): Promise<MyReviewsResult> => {
      const response = await apiClient.get('/reviews/my', { params });
      return { items: response.data.data as MyReviewListItem[], meta: response.data.meta as PaginationMeta };
    },
    staleTime: 60_000,
    retry: 1,
  });
}
