'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';
import { CreateReportInput } from '@/features/report/schemas/create-report.schema';

interface CreateReportVariables extends CreateReportInput {
  reviewId: number;
}

export function useCreateReportMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reviewId, ...input }: CreateReportVariables) => {
      const response = await apiClient.post('/reports', { reviewId, ...input });
      return response.data.data as { reportId: number; status: 'pending' };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MY_REPORTS });
    },
  });
}
