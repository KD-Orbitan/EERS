'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';
import { AdminBusinessListItem } from '@/features/admin/types/admin.type';
import { BusinessStatus, PaginationMeta } from '@/features/business/types/business.type';

export interface AdminBusinessesParams {
  page?: number;
  limit?: number;
  status?: BusinessStatus;
  search?: string;
}

interface AdminBusinessesResult {
  items: AdminBusinessListItem[];
  meta: PaginationMeta;
}

export function useAdminBusinessesQuery(params: AdminBusinessesParams = {}) {
  return useQuery({
    queryKey: [...QUERY_KEYS.ADMIN_BUSINESSES, params],
    queryFn: async (): Promise<AdminBusinessesResult> => {
      const response = await apiClient.get('/admin/businesses', { params });
      return { items: response.data.data as AdminBusinessListItem[], meta: response.data.meta as PaginationMeta };
    },
    staleTime: 30_000,
    retry: 1,
  });
}
