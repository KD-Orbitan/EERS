'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';

export function useAssignCriterionMutation(categoryId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (criterionId: number) => {
      const response = await apiClient.post(`/admin/categories/${categoryId}/criteria/${criterionId}`);
      return response.data.data as { categoryId: number; criterionId: number };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CATEGORY_CRITERIA(categoryId) });
    },
  });
}
