'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';
import { CriterionWeightItem } from '@/features/admin/types/admin.type';

export function useCriterionWeightsQuery(categoryId: number | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.ADMIN_CRITERION_WEIGHTS(categoryId ?? 0),
    queryFn: async (): Promise<CriterionWeightItem[]> => {
      const response = await apiClient.get(`/admin/criterion-weights/${categoryId}`);
      return response.data.data as CriterionWeightItem[];
    },
    enabled: typeof categoryId === 'number' && Number.isFinite(categoryId),
    staleTime: 30 * 60_000,
  });
}
