'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';

interface UploadLogoResponse {
  logoUrl: string;
}

export function useUploadLogoMutation(businessId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('logo', file);
      const response = await apiClient.post(`/businesses/${businessId}/logo`, formData);
      return response.data.data as UploadLogoResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BUSINESS_DETAIL(businessId) });
    },
  });
}
