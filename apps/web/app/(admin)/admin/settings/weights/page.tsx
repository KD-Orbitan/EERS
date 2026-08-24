'use client';

import { useState } from 'react';
import { useCategoriesQuery } from '@/features/business/queries/use-categories.query';
import { CriterionWeightsForm } from '@/features/admin/components/criterion-weights-form';

export default function CriterionWeightsPage() {
  const { data: categories } = useCategoriesQuery();
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-sans text-3xl font-bold text-ink-900">Criterion Weights</h1>
        <p className="mt-1 text-sm text-ink-700">
          Weight each criterion within a category (used in D-012 Step 3 multi-criteria scoring).
        </p>
      </div>

      <div className="max-w-sm">
        <label className="mb-1 block text-sm font-medium text-ink-700" htmlFor="category-picker">
          Category
        </label>
        <select
          id="category-picker"
          value={categoryId ?? ''}
          onChange={(event) => setCategoryId(event.target.value ? Number(event.target.value) : undefined)}
          className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
        >
          <option value="">Select a category...</option>
          {categories?.map((category) => (
            <option key={category.categoryId} value={category.categoryId}>
              {category.categoryName}
            </option>
          ))}
        </select>
      </div>

      {categoryId ? <CriterionWeightsForm categoryId={categoryId} /> : null}
    </div>
  );
}
