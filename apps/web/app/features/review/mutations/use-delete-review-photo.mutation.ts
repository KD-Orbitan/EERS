'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';

export function useDeleteReviewPhotoMutation(reviewId: number, businessId?: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (imageId: number) => {
      await apiClient.delete(`/reviews/${reviewId}/photos/${imageId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.REVIEW_DETAIL(reviewId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MY_REVIEWS });
      if (businessId) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BUSINESS_REVIEWS(businessId) });
      }
    },
  });
}
