'use client';

import { useEffect, useId } from 'react';

export function ListSearch({ value, onChange, placeholder = 'Search...' }: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const id = useId();
  return (
    <div className="my-4 w-full max-w-md">
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-ink-700">Search</label>
      <input id={id} type="search" value={value} maxLength={200} placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-ink-300 bg-ink-50 px-3 py-2.5 text-sm text-ink-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200" />
    </div>
  );
}

export function ListPagination({ page, limit, total, onPageChange, disabled = false }: {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  useEffect(() => {
    if (!disabled && page > totalPages) onPageChange(totalPages);
  }, [disabled, page, totalPages, onPageChange]);
  const buttonClass = 'rounded-lg border border-ink-300 bg-ink-50 px-3 py-2 text-sm text-ink-700 hover:bg-ink-100 disabled:cursor-not-allowed disabled:opacity-50';
  return (
    <nav aria-label="Pagination" className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-ink-600" aria-live="polite">
        {total} results · Page {Math.min(page, totalPages)} of {totalPages}
      </p>
      <div className="flex gap-2">
        <button type="button" className={buttonClass} disabled={disabled || page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}>Previous</button>
        <button type="button" className={buttonClass} disabled={disabled || page >= totalPages}
          onClick={() => onPageChange(page + 1)}>Next</button>
      </div>
    </nav>
  );
}
