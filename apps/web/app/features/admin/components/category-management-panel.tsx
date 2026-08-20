'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/get-error-message';
import { useCategoriesQuery } from '@/features/business/queries/use-categories.query';
import { useCreateCategoryMutation } from '@/features/admin/mutations/use-create-category.mutation';
import { createCategorySchema, CreateCategoryInput } from '@/features/admin/schemas/create-category.schema';

export function CategoryManagementPanel() {
  const { data: categories, isLoading } = useCategoriesQuery();
  const createMutation = useCreateCategoryMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateCategoryInput>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: { categoryName: '' },
  });

  const pending = createMutation.isPending || isSubmitting;

  const onSubmit = async (data: CreateCategoryInput) => {
    try {
      await createMutation.mutateAsync(data.categoryName);
      toast.success('Category created.');
      reset();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Unable to create category.'));
    }
  };

  return (
    <div className="rounded-3xl bg-white p-6 shadow-xs ring-1 ring-slate-200">
      <h2 className="font-serif text-base font-bold text-ink-900">Categories</h2>
      <p className="mt-1 text-xs text-ink-500">Business categories (e.g. Healthcare, Retail). Names must be unique.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 flex items-start gap-3">
        <div className="flex-1">
          <input
            placeholder="New category name..."
            maxLength={100}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
            {...register('categoryName')}
          />
          {errors.categoryName?.message ? <p className="mt-1 text-xs text-red-600">{errors.categoryName.message}</p> : null}
        </div>
        <Button type="submit" disabled={pending} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          {pending ? 'Adding...' : 'Add'}
        </Button>
      </form>

      <div className="mt-4 space-y-1">
        {isLoading ? (
          <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
        ) : !categories || categories.length === 0 ? (
          <p className="text-sm text-ink-500">No categories yet.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <li
                key={category.categoryId}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-ink-700"
              >
                {category.categoryName}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
