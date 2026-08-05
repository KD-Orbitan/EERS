'use client';

import { ChevronDown, Clock, MapPin, Tag } from 'lucide-react';
import { useCategoriesQuery } from '@/features/business/queries/use-categories.query';

interface RankingFiltersProps {
  categoryId?: number;
  province: string;
  onCategoryChange: (categoryId: number | undefined) => void;
  onProvinceChange: (value: string) => void;
}

// Pill-button filter row from Figma's "Header & Filters" (node 1:616). The
// "Timeframe" filter there has no backing data — GET /rankings only supports
// a single current snapshot, no historical range — so it's rendered as a
// disabled placeholder rather than a fake working control.
export function RankingFilters({ categoryId, province, onCategoryChange, onProvinceChange }: RankingFiltersProps) {
  const { data: categories } = useCategoriesQuery();

  return (
    <div className="flex flex-wrap gap-3">
      <div className="relative flex items-center gap-2 rounded-xl border border-slate-200 bg-primary-50 px-4 py-2.5">
        <Tag className="h-4 w-4 shrink-0 text-primary-600" />
        <select
          value={categoryId ?? ''}
          onChange={(event) => onCategoryChange(event.target.value ? Number(event.target.value) : undefined)}
          className="appearance-none bg-transparent pr-5 text-sm text-ink-700 outline-none"
        >
          <option value="">All industries</option>
          {categories?.map((category) => (
            <option key={category.categoryId} value={category.categoryId}>
              {category.categoryName}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 h-3.5 w-3.5 text-ink-500" />
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-primary-50 px-4 py-2.5">
        <MapPin className="h-4 w-4 shrink-0 text-primary-600" />
        <input
          type="text"
          placeholder="Province"
          value={province}
          onChange={(event) => onProvinceChange(event.target.value)}
          className="w-28 bg-transparent text-sm text-ink-700 outline-none placeholder:text-ink-400"
        />
      </div>

      <div
        className="flex cursor-not-allowed items-center gap-2 rounded-xl border border-slate-200 bg-primary-50 px-4 py-2.5 opacity-60"
        title="Historical trends are not available yet"
      >
        <Clock className="h-4 w-4 shrink-0 text-primary-600" />
        <span className="text-sm text-ink-700">All time</span>
        <ChevronDown className="h-3.5 w-3.5 text-ink-500" />
      </div>
    </div>
  );
}
