'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessageSquareText, Building2, CalendarClock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { StarRating } from '@/features/review/components/star-rating';
import { useAuth } from '@/hooks/use-auth';
import { useUserProfileQuery } from '@/features/user/queries/use-user-profile.query';
import { useMyReviewsQuery } from '@/features/review/queries/use-my-reviews.query';
import { useMyBusinessesQuery } from '@/features/business/queries/use-my-businesses.query';
import { ProfileHeader } from '@/features/user/components/profile-header';
import { ReviewStatus } from '@/features/review/types/review.type';

const statusVariant: Record<ReviewStatus, 'neutral' | 'success' | 'warning' | 'danger'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  hidden: 'neutral',
};

// Layout adapted from Figma "User Profile": header card + stats row + recent
// activity. The mockup's badges, level, helpful-vote counts, and "ranking
// performance" percentages have no backing data in the API, so they're
// dropped in favor of the real stats this app actually tracks.
export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading, logout } = useAuth();
  const { data: profile, isLoading: isProfileLoading } = useUserProfileQuery();
  const { data: reviewsData, isLoading: isReviewsLoading } = useMyReviewsQuery({ page: 1, limit: 3 });
  const { data: businessesData } = useMyBusinessesQuery({ page: 1, limit: 1 });

  const onSignOut = async () => {
    await logout();
    router.push('/login');
  };

  if (isAuthLoading || isProfileLoading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="h-40 animate-pulse rounded-3xl bg-white shadow-xs ring-1 ring-slate-200" />
          <div className="h-24 animate-pulse rounded-3xl bg-white shadow-xs ring-1 ring-slate-200" />
        </div>
      </main>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="sr-only">My Profile</h1>

        <ProfileHeader profile={profile} role={user.role} onSignOut={onSignOut} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-2xl bg-white p-5 shadow-xs ring-1 ring-slate-200">
            <MessageSquareText className="h-6 w-6 text-primary-600" />
            <div>
              <p className="text-xs uppercase tracking-wide text-ink-500">Reviews Written</p>
              <p className="font-serif text-xl font-bold text-ink-900">{reviewsData?.meta?.total ?? 0}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-white p-5 shadow-xs ring-1 ring-slate-200">
            <Building2 className="h-6 w-6 text-primary-600" />
            <div>
              <p className="text-xs uppercase tracking-wide text-ink-500">Businesses Owned</p>
              <p className="font-serif text-xl font-bold text-ink-900">{businessesData?.meta?.total ?? 0}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-white p-5 shadow-xs ring-1 ring-slate-200">
            <CalendarClock className="h-6 w-6 text-primary-600" />
            <div>
              <p className="text-xs uppercase tracking-wide text-ink-500">Member Since</p>
              <p className="font-serif text-xl font-bold text-ink-900">{new Date(profile.createdAt).getFullYear()}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-xs ring-1 ring-slate-200 sm:p-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-lg font-bold text-ink-900">Recent Reviews</h2>
            <Link href="/reviews/my" className="text-sm font-medium text-primary-600 hover:text-primary-700">
              View all
            </Link>
          </div>

          {isReviewsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="h-16 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : !reviewsData || reviewsData.items.length === 0 ? (
            <p className="text-sm text-ink-700">You haven&apos;t written any reviews yet.</p>
          ) : (
            <div className="space-y-3">
              {reviewsData.items.map((review) => (
                <Link
                  key={review.reviewId}
                  href={`/businesses/${review.business.businessId}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 px-4 py-3 hover:bg-primary-50"
                >
                  <div>
                    <p className="font-medium text-ink-900">{review.business.name}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <StarRating value={review.overallRating} readOnly size="sm" />
                      <span className="text-xs text-ink-500">{new Date(review.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Badge variant={statusVariant[review.status]}>{review.status}</Badge>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
