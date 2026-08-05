'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';
import { MyBusinessListItem, PaginationMeta } from '@/features/business/types/business.type';

export interface MyBusinessesParams {
  page?: number;
  limit?: number;
}

interface MyBusinessesResult {
  items: MyBusinessListItem[];
  meta: PaginationMeta;
}

export function useMyBusinessesQuery(params: MyBusinessesParams = {}) {
  return useQuery({
    queryKey: [...QUERY_KEYS.MY_BUSINESSES, params],
    queryFn: async (): Promise<MyBusinessesResult> => {
      const response = await apiClient.get('/businesses/my', { params });
      return { items: response.data.data as MyBusinessListItem[], meta: response.data.meta as PaginationMeta };
    },
    staleTime: 60_000,
    retry: 1,
  });
}
