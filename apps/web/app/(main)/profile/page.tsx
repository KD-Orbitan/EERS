'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useUserProfileQuery } from '@/features/user/queries/use-user-profile.query';
import { useMyReviewsQuery } from '@/features/review/queries/use-my-reviews.query';
import { useMyBusinessesQuery } from '@/features/business/queries/use-my-businesses.query';
import { useMyBookmarksQuery } from '@/features/business/queries/use-my-bookmarks.query';
import { ProfileHeader } from '@/features/user/components/profile-header';
import { MyReviewRow } from '@/features/review/components/my-review-row';

// Yelp-style two-column profile: sticky sidebar card (avatar, stats,
// actions) on the left, a reviews feed on the right. See ProfileHeader for
// the note on which Figma fields were dropped for lacking backing data.
export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading, logout } = useAuth();
  const { data: profile, isLoading: isProfileLoading } = useUserProfileQuery();
  const { data: reviewsData, isLoading: isReviewsLoading } = useMyReviewsQuery({ page: 1, limit: 5 });
  const { data: businessesData } = useMyBusinessesQuery({ page: 1, limit: 1 });
  const { data: bookmarksData } = useMyBookmarksQuery({ page: 1, limit: 1 });

  const onSignOut = async () => {
    await logout();
    router.push('/login');
  };

  if (isAuthLoading || isProfileLoading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
          <div className="h-96 animate-pulse rounded-3xl bg-white shadow-xs ring-1 ring-slate-200" />
          <div className="h-96 animate-pulse rounded-3xl bg-white shadow-xs ring-1 ring-slate-200" />
        </div>
      </main>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const reviewCount = reviewsData?.meta?.total ?? 0;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="sr-only">My Profile</h1>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
          <ProfileHeader
            profile={profile}
            role={user.role}
            reviewCount={reviewCount}
            businessCount={businessesData?.meta?.total ?? 0}
            savedCount={bookmarksData?.meta?.total ?? 0}
            onSignOut={onSignOut}
          />

          <div className="rounded-3xl bg-white p-6 shadow-xs ring-1 ring-slate-200 sm:p-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-lg font-bold text-ink-900">
                {reviewCount} {reviewCount === 1 ? 'Review' : 'Reviews'}
              </h2>
              {reviewCount > 0 ? (
                <Link href="/reviews/my" className="text-sm font-medium text-primary-600 hover:text-primary-700">
                  View all
                </Link>
              ) : null}
            </div>

            {isReviewsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
                ))}
              </div>
            ) : !reviewsData || reviewsData.items.length === 0 ? (
              <p className="text-sm text-ink-700">You haven&apos;t written any reviews yet.</p>
            ) : (
              <div className="space-y-3">
                {reviewsData.items.map((review) => (
                  <MyReviewRow key={review.reviewId} review={review} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
