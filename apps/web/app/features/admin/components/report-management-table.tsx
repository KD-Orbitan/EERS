'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/get-error-message';
import { useAdminReportsQuery } from '@/features/report/queries/use-admin-reports.query';
import { useResolveReportMutation } from '@/features/admin/mutations/use-resolve-report.mutation';
import { useRejectReportMutation } from '@/features/admin/mutations/use-reject-report.mutation';
import { ReportStatus } from '@/features/report/types/report.type';

const statusVariant: Record<ReportStatus, 'neutral' | 'success' | 'warning' | 'danger'> = {
  pending: 'warning',
  reviewing: 'neutral',
  resolved: 'success',
  rejected: 'danger',
};

const STATUS_FILTERS: Array<{ value: ReportStatus | ''; label: string }> = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'reviewing', label: 'Reviewing' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'rejected', label: 'Rejected' },
];

export function ReportManagementTable() {
  const [status, setStatus] = useState<ReportStatus | ''>('pending');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useAdminReportsQuery({ page, limit: 20, status: status || undefined });
  const resolveMutation = useResolveReportMutation();
  const rejectMutation = useRejectReportMutation();

  const onResolve = async (reportId: number) => {
    try {
      await resolveMutation.mutateAsync({ reportId });
      toast.success('Report resolved.');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Unable to resolve report.'));
    }
  };

  const onReject = async (reportId: number) => {
    try {
      await rejectMutation.mutateAsync(reportId);
      toast.success('Report rejected.');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Unable to reject report.'));
    }
  };

  return (
    <div className="space-y-4">
      <div className="max-w-xs">
        <label className="mb-1 block text-sm font-medium text-ink-700" htmlFor="status-filter">
          Status
        </label>
        <select
          id="status-filter"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as ReportStatus | '');
            setPage(1);
          }}
          className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
        >
          {STATUS_FILTERS.map((filter) => (
            <option key={filter.value} value={filter.value}>
              {filter.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-2xl bg-white shadow-xs ring-1 ring-slate-200" />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="rounded-3xl bg-white p-10 text-center shadow-xs ring-1 ring-slate-200">
          <p className="text-sm text-ink-700">No reports found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.items.map((report) => (
            <div key={report.reportId} className="rounded-2xl bg-white p-5 shadow-xs ring-1 ring-slate-200">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-sans text-sm font-bold text-ink-900">{report.reason.name}</p>
                    <Badge variant={statusVariant[report.status]}>{report.status}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-ink-500">
                    Reported by {report.reporter.name} on {new Date(report.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <p className="mt-3 whitespace-pre-wrap text-sm text-ink-700">{report.review.content}</p>

              {report.status === 'pending' || report.status === 'reviewing' ? (
                <div className="mt-3 flex items-center gap-3 border-t border-slate-100 pt-3">
                  <Button
                    onClick={() => onResolve(report.reportId)}
                    disabled={resolveMutation.isPending || rejectMutation.isPending}
                    className="gap-1.5 bg-emerald-600 py-1.5 text-xs hover:bg-emerald-700"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Resolve
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => onReject(report.reportId)}
                    disabled={resolveMutation.isPending || rejectMutation.isPending}
                    className="gap-1.5 py-1.5 text-xs text-red-600 hover:bg-red-50"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Reject
                  </Button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {data?.meta && data.meta.totalPages > 1 ? (
        <div className="flex items-center justify-center gap-3">
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
    </div>
  );
}
