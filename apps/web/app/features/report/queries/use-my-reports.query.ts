'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';
import { MyReportListItem } from '@/features/report/types/report.type';
import { PaginationMeta } from '@/features/business/types/business.type';

export interface MyReportsParams {
  page?: number;
  limit?: number;
}

interface MyReportsResult {
  items: MyReportListItem[];
  meta: PaginationMeta;
}

export function useMyReportsQuery(params: MyReportsParams = {}) {
  return useQuery({
    queryKey: [...QUERY_KEYS.MY_REPORTS, params],
    queryFn: async (): Promise<MyReportsResult> => {
      const response = await apiClient.get('/reports/my', { params });
      return { items: response.data.data as MyReportListItem[], meta: response.data.meta as PaginationMeta };
    },
    staleTime: 60_000,
    retry: 1,
  });
}
