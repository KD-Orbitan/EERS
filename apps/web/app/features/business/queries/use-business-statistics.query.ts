'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';
import { BusinessStatistics } from '@/features/business/types/business.type';

export function useBusinessStatisticsQuery(businessId: number | undefined, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.BUSINESS_STATISTICS(businessId ?? 0),
    queryFn: async (): Promise<BusinessStatistics> => {
      const response = await apiClient.get(`/businesses/${businessId}/statistics`);
      return response.data.data as BusinessStatistics;
    },
    enabled: enabled && typeof businessId === 'number' && Number.isFinite(businessId),
    staleTime: 60_000,
    retry: 1,
  });
}
