'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';
import { RejectClaimReasonInput } from '@/features/business-claim/schemas/reject-claim-reason.schema';

export function useRejectClaimMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ claimId, ...input }: RejectClaimReasonInput & { claimId: number }) => {
      const response = await apiClient.post(`/admin/business-claims/${claimId}/reject`, input);
      return response.data.data as { claimId: number; status: 'rejected' };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADMIN_CLAIMS });
    },
  });
}
