'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';
import { RejectReasonInput } from '@/features/admin/schemas/reject-reason.schema';

export function useRejectBusinessMutation(businessId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: RejectReasonInput) => {
      const response = await apiClient.post(`/admin/businesses/${businessId}/reject`, input);
      return response.data.data as { businessId: number; status: 'rejected' };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BUSINESS_DETAIL(businessId) });
    },
  });
}
