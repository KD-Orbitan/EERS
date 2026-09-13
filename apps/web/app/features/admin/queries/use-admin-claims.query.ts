'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';
import { AdminClaimListItem, BusinessClaimStatus } from '@/features/business-claim/types/business-claim.type';
import { PaginationMeta } from '@/features/business/types/business.type';

export interface AdminClaimsParams {
  search?: string;
  page?: number;
  limit?: number;
  status?: BusinessClaimStatus;
}

interface AdminClaimsResult {
  items: AdminClaimListItem[];
  meta: PaginationMeta;
}

export function useAdminClaimsQuery(params: AdminClaimsParams = {}) {
  return useQuery({
    queryKey: [...QUERY_KEYS.ADMIN_CLAIMS, params],
    queryFn: async (): Promise<AdminClaimsResult> => {
      const response = await apiClient.get('/admin/business-claims', { params });
      return { items: response.data.data as AdminClaimListItem[], meta: response.data.meta as PaginationMeta };
    },
    staleTime: 30_000,
    retry: 1,
  });
}
