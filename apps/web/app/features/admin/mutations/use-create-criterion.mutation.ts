'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';
import { CriterionItem } from '@/features/review/types/review.type';

export function useCreateCriterionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      const response = await apiClient.post('/admin/criteria', { name, description: description || undefined });
      return response.data.data as CriterionItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CRITERIA });
    },
  });
}
