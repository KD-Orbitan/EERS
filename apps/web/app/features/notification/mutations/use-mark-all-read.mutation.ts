'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';

export function useMarkAllReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    onMutate: async () => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS }),
        queryClient.cancelQueries({ queryKey: QUERY_KEYS.UNREAD_COUNT }),
      ]);
    },
    mutationFn: async () => {
      const response = await apiClient.patch('/notifications/read-all');
      return (response.data.data as { updatedCount: number }).updatedCount;
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.UNREAD_COUNT }),
      ]);
    },
  });
}
