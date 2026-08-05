'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';
import { CreateReviewInput } from '@/features/review/schemas/create-review.schema';

interface CreateReviewResponse {
  reviewId: number;
  status: 'pending';
}

export function useCreateReviewMutation(businessId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateReviewInput) => {
      const response = await apiClient.post('/reviews', input);
      return response.data.data as CreateReviewResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BUSINESS_REVIEWS(businessId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BUSINESS_REVIEW_STATISTICS(businessId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BUSINESS_DETAIL(businessId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MY_REVIEWS });
    },
  });
}
