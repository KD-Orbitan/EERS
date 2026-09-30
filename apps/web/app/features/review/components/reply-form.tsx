'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { replySchema, ReplyInput } from '@/features/review/schemas/reply.schema';

interface ReplyFormProps {
  onSubmit: (input: ReplyInput) => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function ReplyForm({ onSubmit, onCancel, isLoading }: ReplyFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ReplyInput>({
    resolver: zodResolver(replySchema),
  });

  const busy = isSubmitting || isLoading;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
      <textarea
        rows={3}
        placeholder="Write a response to this review..."
        className="w-full rounded-xl border border-ink-200 bg-ink-50 px-3 py-2 text-sm leading-relaxed text-ink-700 outline-none transition placeholder:text-ink-500 focus:border-primary-600 focus:ring-2 focus:ring-primary-100"
        {...register('content')}
      />
      {errors.content?.message ? <p className="text-xs text-red-600">{errors.content.message}</p> : null}
      <div className="flex justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" disabled={busy}>
          {busy ? 'Posting...' : 'Post Reply'}
        </Button>
      </div>
    </form>
  );
}
