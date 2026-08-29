'use client';

import Link from 'next/link';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { getErrorMessage } from '@/lib/get-error-message';
import { useBookmarkStatusQuery } from '@/features/business/queries/use-bookmark-status.query';
import { useAddBookmarkMutation } from '@/features/business/mutations/use-add-bookmark.mutation';
import { useRemoveBookmarkMutation } from '@/features/business/mutations/use-remove-bookmark.mutation';

interface BookmarkButtonProps {
  businessId: number;
}

// Anonymous visitors see a "log in to bookmark" link instead of a toggle,
// mirroring how the Edit/Delete block in BusinessDetail is gated on isOwner
// rather than rendering a disabled action.
export function BookmarkButton({ businessId }: BookmarkButtonProps) {
  const { isAuthenticated } = useAuth();
  const { data, isLoading } = useBookmarkStatusQuery(businessId, isAuthenticated);
  const addBookmarkMutation = useAddBookmarkMutation(businessId);
  const removeBookmarkMutation = useRemoveBookmarkMutation(businessId);

  if (!isAuthenticated) {
    return (
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-ink-50/10 px-4 py-2.5 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-ink-50/20"
      >
        <Bookmark className="h-4 w-4" />
        Bookmark
      </Link>
    );
  }

  const isBookmarked = Boolean(data?.isBookmarked);
  const isPending = addBookmarkMutation.isPending || removeBookmarkMutation.isPending || isLoading;

  const onToggle = async () => {
    try {
      if (isBookmarked) {
        await removeBookmarkMutation.mutateAsync();
        toast.success('Removed from bookmarks.');
      } else {
        await addBookmarkMutation.mutateAsync();
        toast.success('Business bookmarked.');
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Unable to update bookmark. Please try again.'));
    }
  };

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-ink-50/10 px-4 py-2.5 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-ink-50/20 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isBookmarked ? <BookmarkCheck className="h-4 w-4 fill-white" /> : <Bookmark className="h-4 w-4" />}
      {isBookmarked ? 'Bookmarked' : 'Bookmark'}
    </button>
  );
}
