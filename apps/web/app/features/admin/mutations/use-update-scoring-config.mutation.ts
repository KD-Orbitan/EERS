'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';
import { ScoringConfigInput } from '@/features/admin/schemas/scoring-config.schema';

export function useUpdateScoringConfigMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ScoringConfigInput) => {
      const response = await apiClient.patch('/admin/scoring-config', input);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADMIN_SCORING_CONFIG });
    },
  });
}
