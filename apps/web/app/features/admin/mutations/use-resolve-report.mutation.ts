'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';

export function useResolveReportMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reportId, note }: { reportId: number; note?: string }) => {
      const response = await apiClient.post(`/admin/reports/${reportId}/resolve`, { note });
      return response.data.data as { reportId: number; status: 'resolved' };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADMIN_REPORTS });
    },
  });
}
