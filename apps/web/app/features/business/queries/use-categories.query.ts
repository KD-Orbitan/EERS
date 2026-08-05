'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';
import { BusinessCategory } from '@/features/business/types/business.type';

export function useCategoriesQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.CATEGORIES,
    queryFn: async (): Promise<BusinessCategory[]> => {
      const response = await apiClient.get('/categories');
      return response.data.data as BusinessCategory[];
    },
    staleTime: 5 * 60_000,
    retry: 1,
  });
}
