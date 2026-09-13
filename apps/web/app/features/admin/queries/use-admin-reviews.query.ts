'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';
import { AdminReviewListItem } from '@/features/admin/types/admin.type';
import { PaginationMeta } from '@/features/business/types/business.type';
import { ReviewStatus } from '@/features/review/types/review.type';

export interface AdminReviewsParams {
  search?: string;
  page?: number;
  limit?: number;
  status?: ReviewStatus;
}

interface AdminReviewsResult {
  items: AdminReviewListItem[];
  meta: PaginationMeta;
}

export function useAdminReviewsQuery(params: AdminReviewsParams = {}) {
  return useQuery({
    queryKey: [...QUERY_KEYS.ADMIN_REVIEWS, params],
    queryFn: async (): Promise<AdminReviewsResult> => {
      const response = await apiClient.get('/admin/reviews', { params });
      return { items: response.data.data as AdminReviewListItem[], meta: response.data.meta as PaginationMeta };
    },
    staleTime: 30_000,
    retry: 1,
  });
}
