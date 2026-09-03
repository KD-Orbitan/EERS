'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import Cookies from 'js-cookie';
import apiClient, { getAccessToken, setAccessToken } from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';
import { AUTH_HINT_COOKIE } from '@/lib/constants';

export interface User {
  userId: number;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: 'USER' | 'BUSINESS_OWNER' | 'ADMIN';
  status: 'active' | 'inactive' | 'banned';
  createdAt: string;
}

async function fetchCurrentUser(): Promise<User> {
  const response = await apiClient.get('/auth/me');
  return response.data.data as User;
}

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.AUTH_ME,
    queryFn: fetchCurrentUser,
    retry: false,
  });

  return useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user && !error),
      error: error ?? null,
      logout: async () => {
        try {
          await apiClient.post('/auth/logout');
        } finally {
          setAccessToken(null);
          Cookies.remove(AUTH_HINT_COOKIE, { path: '/' });
          queryClient.clear();
        }
      },
      setAccessToken,
      getAccessToken,
    }),
    [error, isLoading, queryClient, user],
  );
}
