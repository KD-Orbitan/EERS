'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useUserProfileQuery } from '@/features/user/queries/use-user-profile.query';
import { useMyReviewsQuery } from '@/features/review/queries/use-my-reviews.query';
import { useMyBusinessesQuery } from '@/features/business/queries/use-my-businesses.query';
import { useMyBookmarksQuery } from '@/features/business/queries/use-my-bookmarks.query';
import { ProfileHeader } from '@/features/user/components/profile-header';
import { ProfileTab } from '@/features/user/components/profile-tab-nav';
import { ProfileEditPanel } from '@/features/user/components/profile-edit-panel';
import { ProfileChangePasswordPanel } from '@/features/user/components/profile-change-password-panel';
import { MyReviewsPanel } from '@/features/review/components/my-reviews-panel';
import { MyBusinessesPanel } from '@/features/business/components/my-businesses-panel';
import { MyBookmarksPanel } from '@/features/business/components/my-bookmarks-panel';
import { MyReportsPanel } from '@/features/report/components/my-reports-panel';
import { MyClaimsPanel } from '@/features/business-claim/components/my-claims-panel';

const VALID_TABS: ProfileTab[] = ['reviews', 'edit', 'change-password', 'businesses', 'bookmarks', 'reports', 'claims'];

function ActiveTabPanel({ tab }: { tab: ProfileTab }) {
  switch (tab) {
    case 'edit':
      return <ProfileEditPanel />;
    case 'change-password':
      return <ProfileChangePasswordPanel />;
    case 'businesses':
      return <MyBusinessesPanel />;
    case 'bookmarks':
      return <MyBookmarksPanel />;
    case 'reports':
      return <MyReportsPanel />;
    case 'claims':
      return <MyClaimsPanel />;
    case 'reviews':
    default:
      return <MyReviewsPanel />;
  }
}

// Yelp-style two-column profile: sticky sidebar card (avatar, stats, tab
// nav) on the left, a content panel on the right that swaps per the `tab`
// query param instead of navigating to separate pages — see ProfileTabNav
// for the nav itself (desktop vertical list / mobile horizontal with
// overflow-into-"More"). useSearchParams() requires a Suspense boundary
// (see default export below).
function ProfilePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const activeTab: ProfileTab = VALID_TABS.includes(requestedTab as ProfileTab) ? (requestedTab as ProfileTab) : 'reviews';

  const { user, isLoading: isAuthLoading, logout } = useAuth();
  const { data: profile, isLoading: isProfileLoading } = useUserProfileQuery();
  // Same query/params MyReviewsPanel uses for its own preview — react-query
  // dedupes the two calls, this one is just for the header's stat count.
  const { data: reviewsData } = useMyReviewsQuery({ page: 1, limit: 5 });
  const { data: businessesData } = useMyBusinessesQuery({ page: 1, limit: 1 });
  const { data: bookmarksData } = useMyBookmarksQuery({ page: 1, limit: 1 });

  const onSignOut = async () => {
    await logout();
    router.push('/login');
  };

  if (isAuthLoading || isProfileLoading) {
    return (
      <main className="min-h-screen bg-ink-50 px-4 py-8">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
          <div className="h-96 animate-pulse rounded-3xl bg-ink-50 shadow-xs ring-1 ring-ink-200" />
          <div className="h-96 animate-pulse rounded-3xl bg-ink-50 shadow-xs ring-1 ring-ink-200" />
        </div>
      </main>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const reviewCount = reviewsData?.meta?.total ?? 0;

  return (
    <main className="min-h-screen bg-ink-50 px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="sr-only">My Profile</h1>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
          <ProfileHeader
            profile={profile}
            role={user.role}
            reviewCount={reviewCount}
            businessCount={businessesData?.meta?.total ?? 0}
            savedCount={bookmarksData?.meta?.total ?? 0}
            activeTab={activeTab}
            onSignOut={onSignOut}
          />

          <div className="min-w-0 rounded-3xl bg-ink-50 p-6 shadow-xs ring-1 ring-ink-200 sm:p-8">
            <ActiveTabPanel tab={activeTab} />
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-ink-50 px-4 py-8">
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
            <div className="h-96 animate-pulse rounded-3xl bg-ink-50 shadow-xs ring-1 ring-ink-200" />
            <div className="h-96 animate-pulse rounded-3xl bg-ink-50 shadow-xs ring-1 ring-ink-200" />
          </div>
        </main>
      }
    >
      <ProfilePageContent />
    </Suspense>
  );
}
