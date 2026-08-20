'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';

export function useRemoveCriterionAssignmentMutation(categoryId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (criterionId: number) => {
      await apiClient.delete(`/admin/categories/${categoryId}/criteria/${criterionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CATEGORY_CRITERIA(categoryId) });
    },
  });
}
