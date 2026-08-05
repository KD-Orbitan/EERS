'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';
import { BusinessListItem, PaginationMeta } from '@/features/business/types/business.type';

export interface BusinessListParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: number;
  province?: string;
  sortBy?: 'avgRating' | 'createdAt' | 'reviewCount';
  sortOrder?: 'asc' | 'desc';
}

interface BusinessListResult {
  items: BusinessListItem[];
  meta: PaginationMeta;
}

export function useBusinessesQuery(params: BusinessListParams = {}) {
  return useQuery({
    queryKey: [...QUERY_KEYS.BUSINESSES, params],
    queryFn: async (): Promise<BusinessListResult> => {
      const response = await apiClient.get('/businesses', { params });
      return { items: response.data.data as BusinessListItem[], meta: response.data.meta as PaginationMeta };
    },
    staleTime: 60_000,
    retry: 1,
  });
}
