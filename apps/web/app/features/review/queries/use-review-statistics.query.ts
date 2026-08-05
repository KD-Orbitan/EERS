'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';
import { ReviewStatistics } from '@/features/review/types/review.type';

export function useReviewStatisticsQuery(businessId: number | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.BUSINESS_REVIEW_STATISTICS(businessId ?? 0),
    queryFn: async (): Promise<ReviewStatistics> => {
      const response = await apiClient.get(`/businesses/${businessId}/review-statistics`);
      return response.data.data as ReviewStatistics;
    },
    enabled: typeof businessId === 'number' && Number.isFinite(businessId),
    staleTime: 60_000,
    retry: 1,
  });
}
