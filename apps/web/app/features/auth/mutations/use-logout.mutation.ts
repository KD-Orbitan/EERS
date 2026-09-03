'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import Cookies from 'js-cookie';
import apiClient, { setAccessToken } from '@/lib/api-client';
import { AUTH_HINT_COOKIE } from '@/lib/constants';

export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await apiClient.post('/auth/logout');
    },
    onSuccess: () => {
      setAccessToken(null);
      Cookies.remove(AUTH_HINT_COOKIE, { path: '/' });
      queryClient.clear();
    },
  });
}
