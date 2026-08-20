'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';
import { CategoryItem } from '@/features/admin/types/admin.type';

export function useCreateCategoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoryName: string) => {
      const response = await apiClient.post('/admin/categories', { categoryName });
      return response.data.data as CategoryItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CATEGORIES });
    },
  });
}
