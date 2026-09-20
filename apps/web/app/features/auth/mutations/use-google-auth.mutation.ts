'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import Cookies from 'js-cookie';
import apiClient, { setAccessToken } from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';

import { AUTH_HINT_COOKIE } from '@/lib/constants';

interface LoginResponse {
  accessToken: string;
  expiresIn: number;
  user: {
    userId: number;
    name: string;
    role: 'USER' | 'BUSINESS_OWNER' | 'ADMIN';
  };
}

export function useGoogleAuthMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (idToken: string) => {
      const response = await apiClient.post('/auth/google', { idToken });
      return response.data.data as LoginResponse;
    },
    onSuccess: (data) => {
      setAccessToken(data.accessToken);
      // Matches the API's refreshToken cookie maxAge (7 days, see auth.controller.ts).
      Cookies.set(AUTH_HINT_COOKIE, '1', { expires: 7, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.AUTH_ME });
    },
  });
}

