'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { rejectReasonSchema, RejectReasonInput } from '@/features/admin/schemas/reject-reason.schema';

interface RejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RejectReasonInput) => Promise<void>;
  isLoading?: boolean;
  title?: string;
}

export function RejectModal({ isOpen, onClose, onSubmit, isLoading, title = 'Reject' }: RejectModalProps) {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RejectReasonInput>({
    resolver: zodResolver(rejectReasonSchema),
    defaultValues: { reason: '' },
  });

  const reasonLength = watch('reason')?.length ?? 0;
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
          <DialogTitle className="font-serif text-lg font-bold text-ink-900">{title}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(async (data) => {
            await onSubmit(data);
            reset();
          })}
          className="space-y-3"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700" htmlFor="reason">
              Reason
            </label>
            <textarea
              id="reason"
              rows={4}
              maxLength={500}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
              placeholder="Explain why this is being rejected (min 10 characters)..."
              {...register('reason')}
            />
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="text-red-600">{errors.reason?.message ?? ''}</span>
              <span className="text-ink-500">{reasonLength}/500</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending} className="bg-red-600 hover:bg-red-700">
              {pending ? 'Rejecting...' : 'Reject'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
