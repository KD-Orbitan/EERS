'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';

export function useReorderGalleryMutation(businessId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (imageIds: number[]) => {
      const response = await apiClient.patch(`/businesses/${businessId}/gallery/reorder`, { imageIds });
      return response.data.data as { message: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BUSINESS_DETAIL(businessId) });
    },
  });
}
