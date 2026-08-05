'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';

export function useUpdateCriterionWeightMutation(categoryId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ criterionId, weight }: { criterionId: number; weight: number }) => {
      const response = await apiClient.patch(`/admin/criterion-weights/${categoryId}/${criterionId}`, { weight });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADMIN_CRITERION_WEIGHTS(categoryId) });
    },
  });
}
