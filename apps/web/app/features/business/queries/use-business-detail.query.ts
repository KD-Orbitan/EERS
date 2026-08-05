'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';
import { BusinessDetail } from '@/features/business/types/business.type';

export function useBusinessDetailQuery(businessId: number | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.BUSINESS_DETAIL(businessId ?? 0),
    queryFn: async (): Promise<BusinessDetail> => {
      const response = await apiClient.get(`/businesses/${businessId}`);
      return response.data.data as BusinessDetail;
    },
    enabled: typeof businessId === 'number' && Number.isFinite(businessId),
    staleTime: 60_000,
    retry: 1,
  });
}
