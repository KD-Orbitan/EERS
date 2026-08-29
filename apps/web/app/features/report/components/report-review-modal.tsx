'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useReportReasonsQuery } from '@/features/report/queries/use-report-reasons.query';
import { createReportSchema, CreateReportInput } from '@/features/report/schemas/create-report.schema';

interface ReportReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateReportInput) => Promise<void>;
  isLoading?: boolean;
}

// One report per user per review (backend UNIQUE(userId, reviewId)) — the
// trigger button that opens this modal is only rendered for reviews the
// current user hasn't already reported (see ReviewCard).
export function ReportReviewModal({ isOpen, onClose, onSubmit, isLoading }: ReportReviewModalProps) {
  const { data: reasons, isLoading: isReasonsLoading } = useReportReasonsQuery(isOpen);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateReportInput>({
    resolver: zodResolver(createReportSchema),
  });

  const descriptionLength = watch('description')?.length ?? 0;
  const pending = isLoading || isSubmitting;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          reset();
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-sans text-lg font-bold text-ink-900">Report this review</DialogTitle>
          <p className="mt-1 text-sm text-ink-700">Let us know what&apos;s wrong. Our team will look into it.</p>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(async (data) => {
            await onSubmit(data);
            reset();
          })}
          className="space-y-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700" htmlFor="reasonId">
              Reason
            </label>
            <select
              id="reasonId"
              disabled={isReasonsLoading}
              className="w-full rounded-lg border border-ink-300 px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
              {...register('reasonId', { valueAsNumber: true })}
            >
              <option value="">{isReasonsLoading ? 'Loading reasons...' : 'Select a reason...'}</option>
              {reasons?.map((reason) => (
                <option key={reason.reasonId} value={reason.reasonId}>
                  {reason.name}
                </option>
              ))}
            </select>
            {errors.reasonId?.message ? <p className="mt-1 text-sm text-red-600">{errors.reasonId.message}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700" htmlFor="description">
              Additional details (optional)
            </label>
            <textarea
              id="description"
              rows={4}
              maxLength={1000}
              placeholder="Add any extra context that might help our review..."
              className="w-full rounded-lg border border-ink-300 px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
              {...register('description')}
            />
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="text-red-600">{errors.description?.message ?? ''}</span>
              <span className="text-ink-500">{descriptionLength}/1000</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Submitting...' : 'Submit Report'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
