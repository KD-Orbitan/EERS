'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';
import { AdminUserListItem } from '@/features/admin/types/admin.type';
import { PaginationMeta } from '@/features/business/types/business.type';

export interface AdminUsersParams {
  page?: number;
  limit?: number;
  status?: 'active' | 'inactive' | 'banned';
  search?: string;
}

interface AdminUsersResult {
  items: AdminUserListItem[];
  meta: PaginationMeta;
}

export function useAdminUsersQuery(params: AdminUsersParams = {}) {
  return useQuery({
    queryKey: [...QUERY_KEYS.ADMIN_USERS, params],
    queryFn: async (): Promise<AdminUsersResult> => {
      const response = await apiClient.get('/admin/users', { params });
      return { items: response.data.data as AdminUserListItem[], meta: response.data.meta as PaginationMeta };
    },
    staleTime: 30_000,
    retry: 1,
  });
}
