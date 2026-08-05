'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';
import { ReplyInput } from '@/features/review/schemas/reply.schema';

interface CreateReplyVariables {
  reviewId: number;
  input: ReplyInput;
}

interface CreateReplyResponse {
  replyId: number;
}

export function useCreateReplyMutation(businessId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reviewId, input }: CreateReplyVariables) => {
      const response = await apiClient.post(`/reviews/${reviewId}/reply`, input);
      return response.data.data as CreateReplyResponse;
    },
    onSuccess: (_data, { reviewId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.REVIEW_DETAIL(reviewId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BUSINESS_REVIEWS(businessId) });
    },
  });
}
