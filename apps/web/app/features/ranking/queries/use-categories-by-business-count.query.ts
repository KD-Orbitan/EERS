'use client';

import { useQueries } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';
import { useCategoriesQuery } from '@/features/business/queries/use-categories.query';
import { BusinessCategory, PaginationMeta } from '@/features/business/types/business.type';

export interface CategoryWithBusinessCount {
  category: BusinessCategory;
  businessCount: number;
}

// Categories ordered by how many ranked businesses they have, most first.
// There's no documented endpoint that returns a business count per category
// (API.md's GET /categories is just categoryId/categoryName), so this reuses
// the already-documented GET /rankings?categoryId=&limit=1 — its pagination
// meta.total is exactly "how many businesses rank in this category" — same
// approach useCategoryLeaderboardsQuery already takes of firing one request
// per category via useQueries.
export function useCategoriesByBusinessCountQuery(): { data: CategoryWithBusinessCount[]; isLoading: boolean } {
  const { data: categories, isLoading: isLoadingCategories } = useCategoriesQuery();
  const list = categories ?? [];

  const results = useQueries({
    queries: list.map((category) => ({
      queryKey: [...QUERY_KEYS.RANKINGS, { categoryId: category.categoryId, limit: 1 }],
      queryFn: async (): Promise<number> => {
        const response = await apiClient.get('/rankings', { params: { categoryId: category.categoryId, limit: 1 } });
        return (response.data.meta as PaginationMeta).total;
      },
      staleTime: 15 * 60_000,
      retry: 1,
    })),
  });

  const isLoading = isLoadingCategories || results.some((result) => result.isLoading);

  const data = list
    .map((category, index) => ({ category, businessCount: results[index]?.data ?? 0 }))
    .sort((a, b) => b.businessCount - a.businessCount);

  return { data, isLoading };
}
