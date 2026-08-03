'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient, { setAccessToken } from '@/lib/api-client';

export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await apiClient.post('/auth/logout');
    },
    onSuccess: () => {
      setAccessToken(null);
      queryClient.clear();
    },
  });
}
