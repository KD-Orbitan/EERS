'use client';

import Link from 'next/link';
import { useMyReportsQuery } from '@/features/report/queries/use-my-reports.query';
import { MyReportRow } from '@/features/report/components/my-report-row';

// "My Reports" profile tab: a 5-item preview + "View all" link to the full
// /reports/my page.
export function MyReportsPanel() {
  const { data, isLoading } = useMyReportsQuery({ page: 1, limit: 5 });
  const total = data?.meta?.total ?? 0;

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-serif text-lg font-bold text-ink-900">
          {total} {total === 1 ? 'Report' : 'Reports'}
        </h2>
        {total > 0 ? (
          <Link href="/reports/my" className="text-sm font-medium text-primary-600 hover:text-primary-700">
            View all
          </Link>
        ) : null}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <p className="text-sm text-ink-700">You haven&apos;t reported any reviews.</p>
      ) : (
        <div className="space-y-3">
          {data.items.map((report) => (
            <MyReportRow key={report.reportId} report={report} />
          ))}
        </div>
      )}
    </>
  );
}
