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
import { useCategoriesQuery } from '@/features/business/queries/use-categories.query';
import { useCreateCategoryMutation } from '@/features/admin/mutations/use-create-category.mutation';
import { createCategorySchema, CreateCategoryInput } from '@/features/admin/schemas/create-category.schema';

export function CategoryManagementPanel() {
  const { data: categories, isLoading } = useCategoriesQuery();
  const list = useListFilter(categories, (item) => item.categoryName);
  const createMutation = useCreateCategoryMutation();
  const manageMutation = useManageTaxonomyMutation('categories');
  const [editingId, setEditingId] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<CreateCategoryInput>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: { categoryName: '' },
  });

  const pending = createMutation.isPending || manageMutation.isPending || isSubmitting;

  const onSubmit = async (data: CreateCategoryInput) => {
    try {
      if (editingId !== null) await manageMutation.mutateAsync({ action: 'update', id: editingId, values: data });
      else await createMutation.mutateAsync(data.categoryName);
      toast.success(editingId !== null ? 'Category updated.' : 'Category created.');
      setEditingId(null);
      reset({ categoryName: '' });
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Unable to save category.'));
    }
  };

  const onDelete = async (id: number, name: string) => {
    if (!window.confirm(`Delete "${name}" and its criterion assignments/weights? Categories used by businesses cannot be deleted.`)) return;
    try {
      await manageMutation.mutateAsync({ action: 'delete', id });
      if (editingId === id) { setEditingId(null); reset({ categoryName: '' }); }
      toast.success('Category deleted.');
    } catch (error: unknown) { toast.error(getErrorMessage(error, 'Unable to delete category.')); }
  };

  return (
    <div className="rounded-3xl bg-ink-50 p-6 shadow-xs ring-1 ring-ink-200">
      <h2 className="font-sans text-base font-bold text-ink-900">Categories</h2>
      <p className="mt-1 text-xs text-ink-500">Business categories (e.g. Healthcare, Retail). Names must be unique.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 flex flex-wrap items-start gap-3">
        <div className="flex-1">
          <input
            aria-label="Category name"
            placeholder={editingId !== null ? 'Category name' : 'New category name...'}
            maxLength={100}
            className="w-full rounded-lg border border-ink-300 px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
            {...register('categoryName')}
          />
          {errors.categoryName?.message ? <p className="mt-1 text-xs text-red-600">{errors.categoryName.message}</p> : null}
        </div>
        <Button type="submit" disabled={pending} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          {pending ? 'Saving...' : editingId !== null ? 'Save changes' : 'Add'}
        </Button>
        {editingId !== null ? <Button type="button" variant="outline" disabled={pending} onClick={() => { setEditingId(null); reset({ categoryName: '' }); }}>Cancel edit</Button> : null}
      </form>

      <ListSearch value={list.search} onChange={list.setSearch} placeholder="Search categories..." />
      <div className="mt-4 space-y-1">
        {isLoading ? (
          <div className="h-20 animate-pulse rounded-xl bg-ink-100" />
        ) : !categories || categories.length === 0 ? (
          <p className="text-sm text-ink-500">No categories yet.</p>
        ) : (
          <ul className="divide-y divide-ink-100">
            {list.items.map((category) => (
              <li
                key={category.categoryId}
                className="flex flex-wrap items-center justify-between gap-3 py-2 text-sm text-ink-700"
              >
                <span>{category.categoryName}</span>
                <div className="flex gap-2">
                  <button type="button" disabled={pending} aria-label={`Edit ${category.categoryName}`}
                    onClick={() => { setEditingId(category.categoryId); reset({ categoryName: category.categoryName }); setFocus('categoryName'); }}
                    className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs text-primary-600 hover:bg-primary-50 disabled:opacity-50"><Pencil className="h-3.5 w-3.5" /> Edit</button>
                  <button type="button" disabled={pending} aria-label={`Delete ${category.categoryName}`}
                    onClick={() => onDelete(category.categoryId, category.categoryName)}
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
