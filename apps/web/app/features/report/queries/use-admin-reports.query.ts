'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';
import { AdminReportListItem, ReportStatus } from '@/features/report/types/report.type';
import { PaginationMeta } from '@/features/business/types/business.type';

export interface AdminReportsParams {
  search?: string;
  page?: number;
  limit?: number;
  status?: ReportStatus;
}

interface AdminReportsResult {
  items: AdminReportListItem[];
  meta: PaginationMeta;
}

export function useAdminReportsQuery(params: AdminReportsParams = {}) {
  return useQuery({
    queryKey: [...QUERY_KEYS.ADMIN_REPORTS, params],
    queryFn: async (): Promise<AdminReportsResult> => {
      const response = await apiClient.get('/admin/reports', { params });
      return { items: response.data.data as AdminReportListItem[], meta: response.data.meta as PaginationMeta };
    },
    staleTime: 30_000,
    retry: 1,
  });
}
