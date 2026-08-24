'use client';

import { toast } from 'sonner';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getErrorMessage } from '@/lib/get-error-message';
import { useWithdrawReportMutation } from '@/features/report/mutations/use-withdraw-report.mutation';
import { MyReportListItem, ReportStatus } from '@/features/report/types/report.type';

const statusVariant: Record<ReportStatus, 'neutral' | 'success' | 'warning' | 'danger'> = {
  pending: 'warning',
  reviewing: 'neutral',
  resolved: 'success',
  rejected: 'danger',
};

// Shared by the full /reports/my page and the "My Reports" profile tab
// preview, so withdraw behavior can't drift between the two.
export function MyReportRow({ report }: { report: MyReportListItem }) {
  const withdrawReportMutation = useWithdrawReportMutation();

  const onWithdraw = async () => {
    if (!window.confirm('Withdraw this report? This cannot be undone.')) return;

    try {
      await withdrawReportMutation.mutateAsync(report.reportId);
      toast.success('Report withdrawn.');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Unable to withdraw report. Please try again.'));
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-xs ring-1 ring-slate-200">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-sans text-sm font-bold text-ink-900">{report.reason.name}</p>
          <Badge variant={statusVariant[report.status]}>{report.status}</Badge>
        </div>
        <p className="mt-1 max-w-xl truncate text-sm text-ink-700">{report.review.content}</p>
        <p className="mt-1 text-xs text-ink-500">{new Date(report.createdAt).toLocaleDateString()}</p>
      </div>

      {report.status === 'pending' ? (
        <button
          type="button"
          onClick={onWithdraw}
          disabled={withdrawReportMutation.isPending}
          className="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700"
        >
          <X className="h-4 w-4" />
          Withdraw
        </button>
      ) : null}
    </div>
  );
}
