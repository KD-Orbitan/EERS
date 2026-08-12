'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';
import { CriteriaScoresResponse } from '@/features/review/types/criteria-score.type';

export function useCriteriaScoresQuery(businessId: number | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.BUSINESS_CRITERIA_SCORES(businessId ?? 0),
    queryFn: async (): Promise<CriteriaScoresResponse> => {
      const response = await apiClient.get(`/businesses/${businessId}/criteria-scores`);
      return response.data.data as CriteriaScoresResponse;
    },
    enabled: typeof businessId === 'number' && Number.isFinite(businessId),
    staleTime: 60_000,
    retry: 1,
  });
}
