'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';
import { RejectReasonInput } from '@/features/admin/schemas/reject-reason.schema';

export function useRejectReviewMutation(businessId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reviewId, ...input }: RejectReasonInput & { reviewId: number }) => {
      const response = await apiClient.post(`/admin/reviews/${reviewId}/reject`, input);
      return response.data.data as { reviewId: number; status: 'rejected' };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BUSINESS_REVIEWS(businessId) });
    },
  });
}
