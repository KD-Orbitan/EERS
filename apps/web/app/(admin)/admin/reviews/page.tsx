import { ReviewModerationQueue } from '@/features/admin/components/review-moderation-queue';

export default function AdminReviewsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-sans text-3xl font-bold text-ink-900">Review Moderation</h1>
        <p className="mt-1 text-sm text-ink-700">Active moderation queue across every business.</p>
      </div>
      <ReviewModerationQueue />
    </div>
  );
}
