'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { UserCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/get-error-message';
import { useSubmitClaimMutation } from '@/features/business-claim/mutations/use-submit-claim.mutation';
import { submitClaimSchema, SubmitClaimInput } from '@/features/business-claim/schemas/submit-claim.schema';

interface ClaimBusinessDialogProps {
  businessId: number;
}

// Trigger button styled to match the "Write Review" action in BusinessDetail
// (same hero-overlay button treatment), but opens a submission dialog
// instead of navigating — modeled on ReportReviewModal's Radix Dialog +
// react-hook-form shape.
export function ClaimBusinessDialog({ businessId }: ClaimBusinessDialogProps) {
  const [isOpen, setOpen] = useState(false);
  const submitClaimMutation = useSubmitClaimMutation();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SubmitClaimInput>({
    resolver: zodResolver(submitClaimSchema),
    defaultValues: { businessId, message: '' },
  });

  const messageLength = watch('message')?.length ?? 0;
  const pending = submitClaimMutation.isPending || isSubmitting;

  const onSubmit = async (data: SubmitClaimInput) => {
    try {
      await submitClaimMutation.mutateAsync(data);
      toast.success('Claim submitted. An admin will review it shortly.');
      reset();
      setOpen(false);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Unable to submit claim. Please try again.'));
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) reset();
        setOpen(open);
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-primary-700"
        >
          <UserCheck className="h-4 w-4" />
          Claim this business
        </button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-sans text-lg font-bold text-ink-900">Claim this business</DialogTitle>
          <p className="mt-1 text-sm text-ink-700">
            Explain your relationship to this business. Our admin team will review your request.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700" htmlFor="message">
              Message
            </label>
            <textarea
              id="message"
              rows={5}
              maxLength={1000}
              placeholder="e.g. I am the owner/manager of this business and can provide proof of ownership if needed..."
              className="w-full rounded-lg border border-ink-300 px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
              {...register('message')}
            />
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="text-red-600">{errors.message?.message ?? ''}</span>
              <span className="text-ink-500">{messageLength}/1000</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Submitting...' : 'Submit Claim'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
