'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';

interface UploadAvatarResponse {
  avatarUrl: string;
}

export function useUploadAvatarMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);
      const response = await apiClient.post('/users/avatar', formData);
      return response.data.data as UploadAvatarResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER_PROFILE });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.AUTH_ME });
    },
  });
}
