'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';
import { BookmarkListItem } from '@/features/business/types/bookmark.type';
import { PaginationMeta } from '@/features/business/types/business.type';

export interface MyBookmarksParams {
  page?: number;
  limit?: number;
}

interface MyBookmarksResult {
  items: BookmarkListItem[];
  meta: PaginationMeta;
}

export function useMyBookmarksQuery(params: MyBookmarksParams = {}) {
  return useQuery({
    queryKey: [...QUERY_KEYS.MY_BOOKMARKS, params],
    queryFn: async (): Promise<MyBookmarksResult> => {
      const response = await apiClient.get('/bookmarks/my', { params });
      return { items: response.data.data as BookmarkListItem[], meta: response.data.meta as PaginationMeta };
    },
    staleTime: 60_000,
    retry: 1,
  });
}
