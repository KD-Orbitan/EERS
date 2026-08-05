import { ReviewModerationTable } from '@/features/admin/components/review-moderation-table';

export default function AdminReviewsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-ink-900">Review Moderation</h1>
        <p className="mt-1 text-sm text-ink-700">Select a business to review its pending reviews.</p>
      </div>
      <ReviewModerationTable />
    </div>
  );
}
