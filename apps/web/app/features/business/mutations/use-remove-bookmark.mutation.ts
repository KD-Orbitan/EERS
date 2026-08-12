'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';

export function useRemoveBookmarkMutation(businessId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/businesses/${businessId}/bookmark`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BUSINESS_BOOKMARK_STATUS(businessId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MY_BOOKMARKS });
    },
  });
}
