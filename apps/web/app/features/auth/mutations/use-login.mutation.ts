'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient, { setAccessToken } from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';
import { LoginInput } from '@/features/auth/schemas/auth.schema';

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
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.AUTH_ME });
    },
  });
}
