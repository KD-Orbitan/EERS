'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';

export function useTriggerRecalculationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/admin/rankings/recalculate');
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.RANKINGS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.RANKINGS_TOP });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.RANKINGS_METADATA });
    },
  });
}
