'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

type TaxonomyChange =
  | { action: 'delete'; id: number }
  | { action: 'update'; id: number; values: { categoryName: string } | { name: string; description?: string } };

export function useManageTaxonomyMutation(kind: 'categories' | 'criteria') {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (change: TaxonomyChange) => {
      const path = `/admin/${kind}/${change.id}`;
      if (change.action === 'delete') await apiClient.delete(path);
      else await apiClient.patch(path, change.values);
    },
    onSuccess: async () => {
      // Labels appear in selectors, business/review details and ranking results too.
      await Promise.all([
        ['categories'], ['criteria'], ['admin', 'weights'], ['admin', 'businesses'],
        ['businesses'], ['reviews'], ['rankings'],
      ].map((queryKey) => queryClient.invalidateQueries({ queryKey })));
    },
  });
}
