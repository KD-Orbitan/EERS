'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';
import { NotificationListItem } from '@/features/notification/types/notification.type';
import { PaginationMeta } from '@/features/business/types/business.type';

export interface NotificationsParams {
  search?: string;
  page?: number;
  limit?: number;
  isRead?: boolean;
}

interface NotificationsResult {
  items: NotificationListItem[];
  meta: PaginationMeta;
}

export function useNotificationsQuery(params: NotificationsParams = {}) {
  return useQuery({
    queryKey: [...QUERY_KEYS.NOTIFICATIONS, params],
    queryFn: async (): Promise<NotificationsResult> => {
      const response = await apiClient.get('/notifications', { params });
      return { items: response.data.data as NotificationListItem[], meta: response.data.meta as PaginationMeta };
    },
    staleTime: 30_000,
    retry: 1,
  });
}
