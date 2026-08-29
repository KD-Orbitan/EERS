'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';

export function useApproveClaimMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (claimId: number) => {
      const response = await apiClient.post(`/admin/business-claims/${claimId}/approve`);
      return response.data.data as { claimId: number; status: 'approved' };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADMIN_CLAIMS });
    },
  });
}
