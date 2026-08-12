'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';
import { MarketCompetitorsResponse } from '@/features/ranking/types/ranking.type';

export function useMarketCompetitorsQuery(businessId: number | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.BUSINESS_MARKET_COMPETITORS(businessId ?? 0),
    queryFn: async (): Promise<MarketCompetitorsResponse> => {
      const response = await apiClient.get(`/rankings/businesses/${businessId}/competitors`);
      return response.data.data as MarketCompetitorsResponse;
    },
    enabled: typeof businessId === 'number' && Number.isFinite(businessId),
    staleTime: 5 * 60_000,
    retry: 1,
  });
}
