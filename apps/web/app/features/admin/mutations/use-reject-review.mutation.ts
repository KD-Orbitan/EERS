'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';
import { RejectReasonInput } from '@/features/admin/schemas/reject-reason.schema';

// businessId is passed per-call — see use-approve-review.mutation.ts.
export function useRejectReviewMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reviewId, businessId: _businessId, ...input }: RejectReasonInput & { reviewId: number; businessId: number }) => {
      const response = await apiClient.post(`/admin/reviews/${reviewId}/reject`, input);
      return response.data.data as { reviewId: number; status: 'rejected' };
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADMIN_REVIEWS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BUSINESS_REVIEWS(variables.businessId) });
    },
  });
}
