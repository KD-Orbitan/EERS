'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';
import { BookmarkStatus } from '@/features/business/types/bookmark.type';

export function useBookmarkStatusQuery(businessId: number | undefined, enabled: boolean) {
  return useQuery({
    queryKey: QUERY_KEYS.BUSINESS_BOOKMARK_STATUS(businessId ?? 0),
    queryFn: async (): Promise<BookmarkStatus> => {
      const response = await apiClient.get(`/businesses/${businessId}/bookmark`);
      return response.data.data as BookmarkStatus;
    },
    enabled: enabled && typeof businessId === 'number' && Number.isFinite(businessId),
    staleTime: 60_000,
    retry: 1,
  });
}
