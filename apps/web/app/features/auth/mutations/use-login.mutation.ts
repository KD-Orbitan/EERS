'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import Cookies from 'js-cookie';
import apiClient, { setAccessToken } from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';
import { LoginInput } from '@/features/auth/schemas/auth.schema';
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

export function useLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: LoginInput) => {
      const response = await apiClient.post('/auth/login', input);
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
