'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';
import { CriterionItem } from '@/features/review/types/review.type';

export function useCategoryCriteriaQuery(categoryId: number | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.CATEGORY_CRITERIA(categoryId ?? 0),
    queryFn: async (): Promise<CriterionItem[]> => {
      const response = await apiClient.get(`/categories/${categoryId}/criteria`);
      return response.data.data as CriterionItem[];
    },
    enabled: typeof categoryId === 'number' && Number.isFinite(categoryId),
    staleTime: 30_000,
  });
}
