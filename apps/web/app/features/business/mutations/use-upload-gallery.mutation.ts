'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';
import { BusinessGalleryImage } from '@/features/business/types/business.type';

interface UploadGalleryResponse {
  images: BusinessGalleryImage[];
}

export function useUploadGalleryMutation(businessId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach((file) => formData.append('images', file));
      const response = await apiClient.post(`/businesses/${businessId}/gallery`, formData);
      return response.data.data as UploadGalleryResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BUSINESS_DETAIL(businessId) });
    },
  });
}
