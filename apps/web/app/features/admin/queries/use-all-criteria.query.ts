'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';
import { CriterionItem } from '@/features/review/types/review.type';

export function useAllCriteriaQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.CRITERIA,
    queryFn: async (): Promise<CriterionItem[]> => {
      const response = await apiClient.get('/criteria');
      return response.data.data as CriterionItem[];
    },
    staleTime: 5 * 60_000,
    retry: 1,
  });
}
