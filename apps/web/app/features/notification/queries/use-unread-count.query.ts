'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';

export function useUnreadCountQuery(enabled: boolean) {
  return useQuery({
    queryKey: QUERY_KEYS.UNREAD_COUNT,
    queryFn: async (): Promise<number> => {
      const response = await apiClient.get('/notifications/unread-count');
      return (response.data.data as { count: number }).count;
    },
    enabled,
    staleTime: 20_000,
    refetchInterval: 30_000,
    retry: 1,
  });
}
