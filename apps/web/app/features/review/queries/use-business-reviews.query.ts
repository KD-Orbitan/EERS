'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';
import { ReviewListItem, ReviewStatus } from '@/features/review/types/review.type';
import { PaginationMeta } from '@/features/business/types/business.type';

export interface BusinessReviewsParams {
  page?: number;
  limit?: number;
  rating?: number;
  // Only admins get non-approved results back (see
  // GetBusinessReviewsUseCase) — used by the admin review moderation page.
  status?: ReviewStatus;
}

interface BusinessReviewsResult {
  items: ReviewListItem[];
  meta: PaginationMeta;
}

export function useBusinessReviewsQuery(businessId: number | undefined, params: BusinessReviewsParams = {}) {
  return useQuery({
    queryKey: [...QUERY_KEYS.BUSINESS_REVIEWS(businessId ?? 0), params],
    queryFn: async (): Promise<BusinessReviewsResult> => {
      const response = await apiClient.get(`/businesses/${businessId}/reviews`, { params });
      return { items: response.data.data as ReviewListItem[], meta: response.data.meta as PaginationMeta };
    },
    enabled: typeof businessId === 'number' && Number.isFinite(businessId),
    staleTime: 60_000,
    retry: 1,
  });
}
