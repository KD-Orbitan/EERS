'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';
import { UserProfile } from '@/features/user/types/user.type';

export function useUserProfileQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.USER_PROFILE,
    queryFn: async (): Promise<UserProfile> => {
      const response = await apiClient.get('/users/profile');
      return response.data.data as UserProfile;
    },
    staleTime: 5 * 60_000,
  });
}
