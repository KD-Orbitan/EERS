'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';
import { ReportReason } from '@/features/report/types/report.type';

export function useReportReasonsQuery(enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.REPORT_REASONS,
    queryFn: async (): Promise<ReportReason[]> => {
      const response = await apiClient.get('/reports/reasons');
      return response.data.data as ReportReason[];
    },
    staleTime: 10 * 60_000,
    enabled,
  });
}
