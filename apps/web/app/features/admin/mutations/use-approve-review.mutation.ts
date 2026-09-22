'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';

// businessId is passed per-call (not fixed at construction) since this is
// used from the global admin review queue, where each row belongs to a
// different business.
export function useApproveReviewMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reviewId, reason }: { reviewId: number; businessId: number; reason?: string }) => {
      const response = await apiClient.post(`/admin/reviews/${reviewId}/approve`, { reason });
      return response.data.data as { reviewId: number; status: 'approved' };
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADMIN_REVIEWS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BUSINESS_REVIEWS(variables.businessId) });
    },
  });
}
