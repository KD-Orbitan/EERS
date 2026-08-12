'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';

interface UploadCoverResponse {
  coverUrl: string;
}

export function useUploadCoverMutation(businessId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('cover', file);
      const response = await apiClient.post(`/businesses/${businessId}/cover`, formData);
      return response.data.data as UploadCoverResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BUSINESS_DETAIL(businessId) });
    },
  });
}
