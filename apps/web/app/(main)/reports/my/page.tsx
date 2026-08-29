'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMyReportsQuery } from '@/features/report/queries/use-my-reports.query';
import { MyReportRow } from '@/features/report/components/my-report-row';

export default function MyReportsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useMyReportsQuery({ page });

  return (
    <main className="min-h-screen bg-ink-50 px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 font-sans text-3xl font-bold text-ink-900">My Reports</h1>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-20 animate-pulse rounded-2xl bg-ink-50 shadow-xs ring-1 ring-ink-200" />
            ))}
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="rounded-2xl bg-ink-50 p-10 text-center shadow-xs ring-1 ring-ink-200">
            <p className="text-sm text-ink-700">You haven&apos;t reported any reviews.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.items.map((report) => (
              <MyReportRow key={report.reportId} report={report} />
            ))}
          </div>
        )}

        {data?.meta && data.meta.totalPages > 1 ? (
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setPage((prev) => prev - 1)}
              disabled={data.meta.page <= 1}
              className="rounded-lg border border-ink-300 bg-ink-50 px-4 py-2 text-sm font-medium text-ink-700 transition hover:bg-ink-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-ink-600">
              Page {data.meta.page} of {data.meta.totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((prev) => prev + 1)}
              disabled={data.meta.page >= data.meta.totalPages}
              className="rounded-lg border border-ink-300 bg-ink-50 px-4 py-2 text-sm font-medium text-ink-700 transition hover:bg-ink-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        ) : null}

        <Link href="/profile?tab=reports" className="mt-6 inline-block text-sm font-medium text-ink-700 hover:text-primary-600">
          &larr; Back to profile
        </Link>
      </div>
    </main>
  );
}
