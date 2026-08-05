'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { CriterionItem } from '@/features/review/types/review.type';

// A business can belong to multiple categories, and criteriaRatings on a
// review must cover criteria from the business's categories (API.md, POST
// /reviews). Fetches criteria per category and dedupes by criterionId.
export function useBusinessCriteriaQuery(categoryIds: number[]) {
  return useQuery({
    queryKey: ['categories', 'criteria', [...categoryIds].sort()],
    queryFn: async (): Promise<CriterionItem[]> => {
      const responses = await Promise.all(
        categoryIds.map((categoryId) => apiClient.get(`/categories/${categoryId}/criteria`)),
      );
      const seen = new Map<number, CriterionItem>();
      for (const response of responses) {
        for (const criterion of response.data.data as CriterionItem[]) {
          seen.set(criterion.criterionId, criterion);
        }
      }
      return Array.from(seen.values());
    },
    enabled: categoryIds.length > 0,
    staleTime: 5 * 60_000,
    retry: 1,
  });
}
