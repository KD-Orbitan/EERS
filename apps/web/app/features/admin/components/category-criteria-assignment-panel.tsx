'use client';

import { ListSearch, ListPagination } from '@/components/ui/list-controls';
import { useListFilter } from '@/hooks/use-list-filter';

import { useState } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/get-error-message';
import { useCategoriesQuery } from '@/features/business/queries/use-categories.query';
import { useAllCriteriaQuery } from '@/features/admin/queries/use-all-criteria.query';
import { useCategoryCriteriaQuery } from '@/features/admin/queries/use-category-criteria.query';
import { useAssignCriterionMutation } from '@/features/admin/mutations/use-assign-criterion.mutation';
import { useRemoveCriterionAssignmentMutation } from '@/features/admin/mutations/use-remove-criterion-assignment.mutation';

export function CategoryCriteriaAssignmentPanel() {
  const { data: categories } = useCategoriesQuery();
  const [selectedCategoryId, setCategoryId] = useState<number | undefined>(undefined);
  const categoryId = categories?.some((category) => category.categoryId === selectedCategoryId) ? selectedCategoryId : undefined;

  const { data: allCriteria, isLoading: isCriteriaLoading } = useAllCriteriaQuery();
  const { data: assignedCriteria, isLoading: isAssignedLoading } = useCategoryCriteriaQuery(categoryId);
  const list = useListFilter(allCriteria, (item) => item.name + ' ' + (item.description ?? ''));
  const assignMutation = useAssignCriterionMutation(categoryId ?? 0);
  const removeMutation = useRemoveCriterionAssignmentMutation(categoryId ?? 0);

  const assignedIds = new Set((assignedCriteria ?? []).map((c) => c.criterionId));
  const pendingCriterionId = assignMutation.variables ?? removeMutation.variables;
  const isMutating = assignMutation.isPending || removeMutation.isPending;

  const onToggle = async (criterionId: number, isAssigned: boolean) => {
    if (!categoryId) return;
    try {
      if (isAssigned) {
        await removeMutation.mutateAsync(criterionId);
        toast.success('Criterion removed from category.');
      } else {
        await assignMutation.mutateAsync(criterionId);
        toast.success('Criterion assigned to category.');
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Unable to update assignment.'));
    }
  };

  const isLoading = isCriteriaLoading || (categoryId ? isAssignedLoading : false);

  return (
    <div className="rounded-3xl bg-ink-50 p-6 shadow-xs ring-1 ring-ink-200">
      <h2 className="font-sans text-base font-bold text-ink-900">Assign Criteria to Category</h2>
      <p className="mt-1 text-xs text-ink-500">
        Businesses inherit criteria from their categories — pick a category, then check the criteria it should use.
      </p>

      <div className="mt-4 max-w-sm">
        <label className="mb-1 block text-sm font-medium text-ink-700" htmlFor="assignment-category-picker">
          Category
        </label>
        <select
          id="assignment-category-picker"
          value={categoryId ?? ''}
          onChange={(event) => setCategoryId(event.target.value ? Number(event.target.value) : undefined)}
          className="w-full rounded-xl border border-ink-300 px-3 py-2.5 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
        >
          <option value="">Select a category...</option>
          {categories?.map((category) => (
            <option key={category.categoryId} value={category.categoryId}>
              {category.categoryName}
            </option>
          ))}
        </select>
      </div>

      <ListSearch value={list.search} onChange={list.setSearch} placeholder="Search criteria..." />
      {!categoryId ? null : isLoading ? (
        <div className="mt-4 h-32 animate-pulse rounded-xl bg-ink-100" />
      ) : !allCriteria || allCriteria.length === 0 ? (
        <p className="mt-4 text-sm text-ink-500">No criteria exist yet — add one above first.</p>
      ) : (
        <ul className="mt-4 divide-y divide-ink-100 rounded-xl border border-ink-200">
          {list.items.map((criterion) => {
            const isAssigned = assignedIds.has(criterion.criterionId);
            const isRowMutating = isMutating && pendingCriterionId === criterion.criterionId;
            return (
              <li key={criterion.criterionId} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <label className="flex flex-1 cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isAssigned}
                    disabled={isRowMutating}
                    onChange={() => onToggle(criterion.criterionId, isAssigned)}
                    className="h-4 w-4 rounded border-ink-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span>
                    <span className="text-sm font-medium text-ink-900">{criterion.name}</span>
                    {criterion.description ? (
                      <span className="ml-2 text-xs text-ink-500">{criterion.description}</span>
                    ) : null}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
      {!isLoading && categoryId && list.total === 0 && list.search ? <p className="mt-3 text-sm text-ink-500">No matching results.</p> : null}
      {categoryId ? <ListPagination page={list.page} limit={list.limit} total={list.total} onPageChange={list.setPage} /> : null}
    </div>
  );
}
