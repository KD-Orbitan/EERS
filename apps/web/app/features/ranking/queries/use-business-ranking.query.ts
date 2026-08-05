'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';
import { BusinessRanking } from '@/features/ranking/types/ranking.type';

export function useBusinessRankingQuery(businessId: number | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.BUSINESS_RANKING(businessId ?? 0),
    queryFn: async (): Promise<BusinessRanking> => {
      const response = await apiClient.get(`/rankings/businesses/${businessId}`);
      return response.data.data as BusinessRanking;
    },
    enabled: typeof businessId === 'number' && Number.isFinite(businessId),
    staleTime: 10 * 60_000,
    retry: 1,
  });
}
