'use client';

import { CategoryManagementPanel } from '@/features/admin/components/category-management-panel';
import { CriterionManagementPanel } from '@/features/admin/components/criterion-management-panel';
import { CategoryCriteriaAssignmentPanel } from '@/features/admin/components/category-criteria-assignment-panel';

export default function CategoriesAndCriteriaPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-ink-900">Categories &amp; Criteria</h1>
        <p className="mt-1 text-sm text-ink-700">
          Manage business categories, rating criteria, and which criteria apply to each category.
        </p>
      </div>

      <CategoryManagementPanel />
      <CriterionManagementPanel />
      <CategoryCriteriaAssignmentPanel />
    </div>
  );
}
