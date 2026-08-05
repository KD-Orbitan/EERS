'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';
import { UpdateReviewInput } from '@/features/review/schemas/update-review.schema';

interface UpdateReviewResponse {
  reviewId: number;
  status: 'pending';
}

export function useUpdateReviewMutation(reviewId: number, businessId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateReviewInput) => {
      const response = await apiClient.patch(`/reviews/${reviewId}`, input);
      return response.data.data as UpdateReviewResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.REVIEW_DETAIL(reviewId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MY_REVIEWS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BUSINESS_REVIEWS(businessId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BUSINESS_REVIEW_STATISTICS(businessId) });
    },
  });
}
