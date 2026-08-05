'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { useCategoriesQuery } from '@/features/business/queries/use-categories.query';

interface BusinessSearchBarProps {
  search: string;
  categoryId?: number;
  province: string;
  onSearchChange: (value: string) => void;
  onCategoryChange: (categoryId: number | undefined) => void;
  onProvinceChange: (value: string) => void;
}

export function BusinessSearchBar({
  search,
  categoryId,
  province,
  onSearchChange,
  onCategoryChange,
  onProvinceChange,
}: BusinessSearchBarProps) {
  const [searchInput, setSearchInput] = useState(search);
  const { data: categories } = useCategoriesQuery();

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchInput !== search) {
        onSearchChange(searchInput);
      }
    }, 500);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  return (
    <div className="grid grid-cols-1 gap-3 rounded-2xl bg-white p-4 shadow-xs ring-1 ring-slate-200 sm:grid-cols-[2fr_1fr_1fr]">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
        <input
          type="text"
          placeholder="Search businesses..."
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-primary-50 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
        />
      </div>

      <select
        value={categoryId ?? ''}
        onChange={(event) => onCategoryChange(event.target.value ? Number(event.target.value) : undefined)}
        className="w-full rounded-xl border border-slate-200 bg-primary-50 px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
      >
        <option value="">All categories</option>
        {categories?.map((category) => (
          <option key={category.categoryId} value={category.categoryId}>
            {category.categoryName}
          </option>
        ))}
      </select>

      <input
        type="text"
        placeholder="Province"
        value={province}
        onChange={(event) => onProvinceChange(event.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-primary-50 px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
      />
    </div>
  );
}
