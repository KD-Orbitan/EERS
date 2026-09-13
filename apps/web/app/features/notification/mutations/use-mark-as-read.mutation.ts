'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';

export function useMarkAsReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    onMutate: async () => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS }),
        queryClient.cancelQueries({ queryKey: QUERY_KEYS.UNREAD_COUNT }),
      ]);
    },
    mutationFn: async (notificationId: number) => {
      await apiClient.patch(`/notifications/${notificationId}/read`);
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.UNREAD_COUNT }),
      ]);
    },
  });
}
