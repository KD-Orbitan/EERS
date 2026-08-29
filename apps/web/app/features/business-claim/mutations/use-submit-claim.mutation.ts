'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';
import { SubmitClaimInput } from '@/features/business-claim/schemas/submit-claim.schema';

export function useSubmitClaimMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SubmitClaimInput) => {
      const response = await apiClient.post('/business-claims', input);
      return response.data.data as { claimId: number; status: 'pending' };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MY_CLAIMS });
    },
  });
}
