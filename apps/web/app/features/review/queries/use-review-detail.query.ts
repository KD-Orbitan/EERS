'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';
import { ReviewDetail } from '@/features/review/types/review.type';

export function useReviewDetailQuery(reviewId: number | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.REVIEW_DETAIL(reviewId ?? 0),
    queryFn: async (): Promise<ReviewDetail> => {
      const response = await apiClient.get(`/reviews/${reviewId}`);
      return response.data.data as ReviewDetail;
    },
    enabled: typeof reviewId === 'number' && Number.isFinite(reviewId),
    staleTime: 60_000,
    retry: 1,
  });
}
