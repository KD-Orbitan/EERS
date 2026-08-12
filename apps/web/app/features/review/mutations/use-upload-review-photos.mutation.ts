'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';
import { ReviewPhoto } from '@/features/review/types/review.type';

interface UploadReviewPhotosResponse {
  photos: ReviewPhoto[];
}

export async function uploadReviewPhotos(reviewId: number, files: File[]) {
  const formData = new FormData();
  files.forEach((file) => formData.append('photos', file));
  const response = await apiClient.post(`/reviews/${reviewId}/photos`, formData);
  return response.data.data as UploadReviewPhotosResponse;
}

export function useUploadReviewPhotosMutation(reviewId: number, businessId?: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (files: File[]) => uploadReviewPhotos(reviewId, files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.REVIEW_DETAIL(reviewId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MY_REVIEWS });
      if (businessId) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BUSINESS_REVIEWS(businessId) });
      }
    },
  });
}
