'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';

export function useWithdrawClaimMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (claimId: number) => {
      await apiClient.delete(`/business-claims/${claimId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MY_CLAIMS });
    },
  });
}
