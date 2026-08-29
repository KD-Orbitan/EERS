'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';
import { MyClaimListItem } from '@/features/business-claim/types/business-claim.type';
import { PaginationMeta } from '@/features/business/types/business.type';

export interface MyClaimsParams {
  page?: number;
  limit?: number;
}

interface MyClaimsResult {
  items: MyClaimListItem[];
  meta: PaginationMeta;
}

export function useMyClaimsQuery(params: MyClaimsParams = {}) {
  return useQuery({
    queryKey: [...QUERY_KEYS.MY_CLAIMS, params],
    queryFn: async (): Promise<MyClaimsResult> => {
      const response = await apiClient.get('/business-claims/my', { params });
      return { items: response.data.data as MyClaimListItem[], meta: response.data.meta as PaginationMeta };
    },
    staleTime: 60_000,
    retry: 1,
  });
}
