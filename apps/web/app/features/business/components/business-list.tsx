'use client';

import { BusinessCard, BusinessCardData } from '@/features/business/components/business-card';
import { PaginationMeta } from '@/features/business/types/business.type';

interface BusinessListProps {
  businesses: BusinessCardData[];
  isLoading: boolean;
  pagination?: PaginationMeta;
  onPageChange?: (page: number) => void;
  onDelete?: (businessId: number) => void;
  emptyMessage?: string;
}

export function BusinessList({
  businesses,
  isLoading,
  pagination,
  onPageChange,
  onDelete,
  emptyMessage = 'No businesses found. Try adjusting your search or filters.',
}: BusinessListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-56 animate-pulse rounded-2xl bg-white shadow-xs ring-1 ring-slate-200" />
        ))}
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-xs ring-1 ring-slate-200">
        <p className="text-sm text-slate-600">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {businesses.map((business) => (
          <BusinessCard key={business.businessId} business={business} onDelete={onDelete} />
        ))}
      </div>

      {pagination && pagination.totalPages > 1 && onPageChange ? (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-slate-600">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}
