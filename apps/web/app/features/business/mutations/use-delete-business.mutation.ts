'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';

export function useDeleteBusinessMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (businessId: number) => {
      await apiClient.delete(`/businesses/${businessId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MY_BUSINESSES });
    },
  });
}
