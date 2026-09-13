'use client';

import { ListSearch, ListPagination } from '@/components/ui/list-controls';
import { useListFilter } from '@/hooks/use-list-filter';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useManageTaxonomyMutation } from '@/features/admin/mutations/use-manage-taxonomy.mutation';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/get-error-message';
import { useAllCriteriaQuery } from '@/features/admin/queries/use-all-criteria.query';
import { useCreateCriterionMutation } from '@/features/admin/mutations/use-create-criterion.mutation';
import { createCriterionSchema, CreateCriterionInput } from '@/features/admin/schemas/create-criterion.schema';

export function CriterionManagementPanel() {
  const { data: criteria, isLoading } = useAllCriteriaQuery();
  const list = useListFilter(criteria, (item) => item.name + ' ' + (item.description ?? ''));
  const createMutation = useCreateCriterionMutation();
  const manageMutation = useManageTaxonomyMutation('criteria');
  const [editingId, setEditingId] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<CreateCriterionInput>({
    resolver: zodResolver(createCriterionSchema),
    defaultValues: { name: '', description: '' },
  });

  const pending = createMutation.isPending || manageMutation.isPending || isSubmitting;

  const onSubmit = async (data: CreateCriterionInput) => {
    try {
      if (editingId !== null) await manageMutation.mutateAsync({ action: 'update', id: editingId, values: data });
      else await createMutation.mutateAsync({ name: data.name, description: data.description });
      toast.success(editingId !== null ? 'Criterion updated.' : 'Criterion created.');
      setEditingId(null);
      reset({ name: '', description: '' });
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Unable to save criterion.'));
    }
  };

  const onDelete = async (id: number, name: string) => {
    if (!window.confirm(`Delete "${name}"? Criteria assigned to categories or used in reviews cannot be deleted.`)) return;
    try {
      await manageMutation.mutateAsync({ action: 'delete', id });
      if (editingId === id) { setEditingId(null); reset({ name: '', description: '' }); }
      toast.success('Criterion deleted.');
    } catch (error: unknown) { toast.error(getErrorMessage(error, 'Unable to delete criterion.')); }
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
              aria-label="Criterion name"
              placeholder={editingId !== null ? 'Criterion name' : 'New criterion name...'}
              maxLength={100}
              className="w-full rounded-lg border border-ink-300 px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
              {...register('name')}
            />
            {errors.name?.message ? <p className="mt-1 text-xs text-red-600">{errors.name.message}</p> : null}
          </div>
          <Button type="submit" disabled={pending} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            {pending ? 'Saving...' : editingId !== null ? 'Save changes' : 'Add'}
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
        {editingId !== null ? <Button type="button" variant="outline" disabled={pending} onClick={() => { setEditingId(null); reset({ name: '', description: '' }); }}>Cancel edit</Button> : null}
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
              <li key={criterion.criterionId} className="flex flex-wrap items-center justify-between gap-3 py-2">
                <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink-900">{criterion.name}</p>
                {criterion.description ? <p className="text-xs text-ink-500">{criterion.description}</p> : null}
                </div>
                <div className="flex gap-2">
                  <button type="button" disabled={pending} aria-label={`Edit ${criterion.name}`}
                    onClick={() => { setEditingId(criterion.criterionId); reset({ name: criterion.name, description: criterion.description ?? '' }); setFocus('name'); }}
                    className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs text-primary-600 hover:bg-primary-50 disabled:opacity-50"><Pencil className="h-3.5 w-3.5" /> Edit</button>
                  <button type="button" disabled={pending} aria-label={`Delete ${criterion.name}`}
                    onClick={() => onDelete(criterion.criterionId, criterion.name)}
                    className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                </div>
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
