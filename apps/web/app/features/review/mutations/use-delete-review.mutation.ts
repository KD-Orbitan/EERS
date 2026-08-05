'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';

interface DeleteReviewVariables {
  reviewId: number;
  businessId: number;
}

export function useDeleteReviewMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reviewId }: DeleteReviewVariables) => {
      await apiClient.delete(`/reviews/${reviewId}`);
    },
    onSuccess: (_data, { businessId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MY_REVIEWS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BUSINESS_REVIEWS(businessId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BUSINESS_REVIEW_STATISTICS(businessId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BUSINESS_DETAIL(businessId) });
    },
  });
}
