'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';

export function useAddBookmarkMutation(businessId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post(`/businesses/${businessId}/bookmark`);
      return response.data.data as { bookmarkId: number; businessId: number };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BUSINESS_BOOKMARK_STATUS(businessId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MY_BOOKMARKS });
    },
  });
}
