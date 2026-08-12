'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getErrorMessage } from '@/lib/get-error-message';
import { useMyReportsQuery } from '@/features/report/queries/use-my-reports.query';
import { useWithdrawReportMutation } from '@/features/report/mutations/use-withdraw-report.mutation';
import { ReportStatus } from '@/features/report/types/report.type';

const statusVariant: Record<ReportStatus, 'neutral' | 'success' | 'warning' | 'danger'> = {
  pending: 'warning',
  reviewing: 'neutral',
  resolved: 'success',
  rejected: 'danger',
};

export default function MyReportsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useMyReportsQuery({ page });
  const withdrawReportMutation = useWithdrawReportMutation();

  const onWithdraw = async (reportId: number) => {
    if (!window.confirm('Withdraw this report? This cannot be undone.')) return;

    try {
      await withdrawReportMutation.mutateAsync(reportId);
      toast.success('Report withdrawn.');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Unable to withdraw report. Please try again.'));
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 font-serif text-3xl font-bold text-ink-900">My Reports</h1>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-20 animate-pulse rounded-2xl bg-white shadow-xs ring-1 ring-slate-200" />
            ))}
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-xs ring-1 ring-slate-200">
            <p className="text-sm text-ink-700">You haven&apos;t reported any reviews.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.items.map((report) => (
              <div
                key={report.reportId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-xs ring-1 ring-slate-200"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-serif text-sm font-bold text-ink-900">{report.reason.name}</p>
                    <Badge variant={statusVariant[report.status]}>{report.status}</Badge>
                  </div>
                  <p className="mt-1 max-w-xl truncate text-sm text-ink-700">{report.review.content}</p>
                  <p className="mt-1 text-xs text-ink-500">{new Date(report.createdAt).toLocaleDateString()}</p>
                </div>

                {report.status === 'pending' ? (
                  <button
                    type="button"
                    onClick={() => onWithdraw(report.reportId)}
                    disabled={withdrawReportMutation.isPending}
                    className="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                    Withdraw
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        )}

        {data?.meta && data.meta.totalPages > 1 ? (
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setPage((prev) => prev - 1)}
              disabled={data.meta.page <= 1}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-slate-600">
              Page {data.meta.page} of {data.meta.totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((prev) => prev + 1)}
              disabled={data.meta.page >= data.meta.totalPages}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        ) : null}

        <Link href="/profile" className="mt-6 inline-block text-sm font-medium text-ink-700 hover:text-primary-600">
          &larr; Back to profile
        </Link>
      </div>
    </main>
  );
}
