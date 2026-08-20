'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';
import { ReviewTrendPoint } from '@/features/business/types/business.type';

export function useReviewTrendQuery(businessId: number | undefined, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.BUSINESS_REVIEW_TREND(businessId ?? 0),
    queryFn: async (): Promise<ReviewTrendPoint[]> => {
      const response = await apiClient.get(`/businesses/${businessId}/review-trend`);
      return response.data.data as ReviewTrendPoint[];
    },
    enabled: enabled && typeof businessId === 'number' && Number.isFinite(businessId),
    staleTime: 60_000,
    retry: 1,
  });
}
