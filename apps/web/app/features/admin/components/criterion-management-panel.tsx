'use client';

import { ListSearch, ListPagination } from '@/components/ui/list-controls';
import { useListFilter } from '@/hooks/use-list-filter';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/get-error-message';
import { useAllCriteriaQuery } from '@/features/admin/queries/use-all-criteria.query';
import { useCreateCriterionMutation } from '@/features/admin/mutations/use-create-criterion.mutation';
import { createCriterionSchema, CreateCriterionInput } from '@/features/admin/schemas/create-criterion.schema';

export function CriterionManagementPanel() {
  const { data: criteria, isLoading } = useAllCriteriaQuery();
  const list = useListFilter(criteria, (item) => item.name + ' ' + (item.description ?? ''));
  const createMutation = useCreateCriterionMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateCriterionInput>({
    resolver: zodResolver(createCriterionSchema),
    defaultValues: { name: '', description: '' },
  });

  const pending = createMutation.isPending || isSubmitting;

  const onSubmit = async (data: CreateCriterionInput) => {
    try {
      await createMutation.mutateAsync({ name: data.name, description: data.description });
      toast.success('Criterion created.');
      reset();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Unable to create criterion.'));
    }
  };

  return (
    <div className="rounded-3xl bg-ink-50 p-6 shadow-xs ring-1 ring-ink-200">
      <h2 className="font-sans text-base font-bold text-ink-900">Criteria</h2>
      <p className="mt-1 text-xs text-ink-500">
        Rating dimensions (e.g. Cleanliness, Service). Assign these to categories below.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-2">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <input
              placeholder="New criterion name..."
              maxLength={100}
              className="w-full rounded-lg border border-ink-300 px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
              {...register('name')}
            />
            {errors.name?.message ? <p className="mt-1 text-xs text-red-600">{errors.name.message}</p> : null}
          </div>
          <Button type="submit" disabled={pending} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            {pending ? 'Adding...' : 'Add'}
          </Button>
        </div>
        <div>
          <input
            placeholder="Description (optional)..."
            maxLength={500}
            className="w-full rounded-lg border border-ink-300 px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
            {...register('description')}
          />
          {errors.description?.message ? <p className="mt-1 text-xs text-red-600">{errors.description.message}</p> : null}
        </div>
      </form>

      <ListSearch value={list.search} onChange={list.setSearch} placeholder="Search criteria..." />
      <div className="mt-4 space-y-1">
        {isLoading ? (
          <div className="h-20 animate-pulse rounded-xl bg-ink-100" />
        ) : !criteria || criteria.length === 0 ? (
          <p className="text-sm text-ink-500">No criteria yet.</p>
        ) : (
          <ul className="divide-y divide-ink-100">
            {list.items.map((criterion) => (
              <li key={criterion.criterionId} className="py-2">
                <p className="text-sm font-medium text-ink-900">{criterion.name}</p>
                {criterion.description ? <p className="text-xs text-ink-500">{criterion.description}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </div>
      {!isLoading && list.total === 0 && list.search ? <p className="mt-3 text-sm text-ink-500">No matching results.</p> : null}
      <ListPagination page={list.page} limit={list.limit} total={list.total} onPageChange={list.setPage} />
    </div>
  );
}
