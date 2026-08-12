'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import { RefreshCw, Building2, MessageSquareText, Flag, Users, Sliders, Scale, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/get-error-message';
import { useRankingMetadataQuery } from '@/features/ranking/queries/use-ranking-metadata.query';
import { useTriggerRecalculationMutation } from '@/features/admin/mutations/use-trigger-recalculation.mutation';
import { useAdminBusinessesQuery } from '@/features/admin/queries/use-admin-businesses.query';
import { useAdminReviewsQuery } from '@/features/admin/queries/use-admin-reviews.query';
import { useAdminUsersQuery } from '@/features/admin/queries/use-admin-users.query';
import { useAdminReportsQuery } from '@/features/report/queries/use-admin-reports.query';

const QUICK_LINKS = [
  { href: '/admin/businesses', label: 'Business Verification', icon: Building2, description: 'Approve or reject pending businesses' },
  { href: '/admin/reviews', label: 'Review Moderation', icon: MessageSquareText, description: 'Approve or reject pending reviews' },
  { href: '/admin/reports', label: 'Report Management', icon: Flag, description: 'Resolve or reject user-submitted reports' },
  { href: '/admin/users', label: 'User Management', icon: Users, description: 'Search users and ban/unban accounts' },
  { href: '/admin/settings/scoring', label: 'Scoring Config', icon: Sliders, description: 'Tune the fraud detection & ranking pipeline' },
  { href: '/admin/settings/weights', label: 'Criterion Weights', icon: Scale, description: 'Adjust per-category criterion weights' },
];

// Dashboard adapted from Figma "Platform Command Center" — the fake
// Total Users/%-change trend and the "REAL-TIME DATA VISUALIZATION ENGINE"
// growth chart (literally placeholder text in the mockup itself) are
// dropped for real, actionable numbers instead: every stat tile below and
// every "Needs Attention" row is backed by GET /admin/businesses,
// GET /admin/reviews, GET /admin/users, and GET /admin/reports.
export default function AdminDashboardPage() {
  const { data: metadata } = useRankingMetadataQuery();
  const recalcMutation = useTriggerRecalculationMutation();

  const { data: users } = useAdminUsersQuery({ limit: 1 });
  const { data: pendingBusinesses } = useAdminBusinessesQuery({ status: 'pending', limit: 3 });
  const { data: pendingReviews } = useAdminReviewsQuery({ status: 'pending', limit: 3 });
  const { data: pendingReports } = useAdminReportsQuery({ status: 'pending', limit: 3 });

  const onRecalculate = async () => {
    try {
      await recalcMutation.mutateAsync();
      toast.success('Ranking recalculation triggered.');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Unable to trigger recalculation.'));
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-ink-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-ink-700">Moderation and ranking configuration for EERS.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow-xs ring-1 ring-slate-200">
          <p className="text-xs uppercase tracking-wide text-ink-500">Total Users</p>
          <p className="mt-1 font-serif text-2xl font-bold text-ink-900">{users?.meta.total ?? '—'}</p>
        </div>
        <Link href="/admin/businesses" className="rounded-2xl bg-white p-5 shadow-xs ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-xs uppercase tracking-wide text-ink-500">Pending Businesses</p>
          <p className="mt-1 font-serif text-2xl font-bold text-ink-900">{pendingBusinesses?.meta.total ?? '—'}</p>
        </Link>
        <Link href="/admin/reviews" className="rounded-2xl bg-white p-5 shadow-xs ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-xs uppercase tracking-wide text-ink-500">Pending Reviews</p>
          <p className="mt-1 font-serif text-2xl font-bold text-ink-900">{pendingReviews?.meta.total ?? '—'}</p>
        </Link>
        <div className="flex items-center gap-3 rounded-2xl bg-white p-5 shadow-xs ring-1 ring-slate-200">
          <Trophy className="h-6 w-6 shrink-0 text-primary-600" />
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-500">Businesses Ranked</p>
            <p className="font-serif text-xl font-bold text-ink-900">{metadata?.totalRankedBusinesses ?? '—'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl bg-white p-6 shadow-xs ring-1 ring-slate-200">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-lg font-bold text-ink-900">Needs Attention</h2>
          </div>

          <div className="space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Pending Businesses</p>
                <Link href="/admin/businesses" className="text-xs font-medium text-primary-600 hover:text-primary-700">
                  View all
                </Link>
              </div>
              {pendingBusinesses && pendingBusinesses.items.length > 0 ? (
                <ul className="space-y-1.5">
                  {pendingBusinesses.items.map((item) => (
                    <li key={item.businessId} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                      <span className="truncate font-medium text-ink-900">{item.name}</span>
                      <span className="shrink-0 text-xs text-ink-500">{item.ownerName}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-500">Nothing pending.</p>
              )}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Pending Reviews</p>
                <Link href="/admin/reviews" className="text-xs font-medium text-primary-600 hover:text-primary-700">
                  View all
                </Link>
              </div>
              {pendingReviews && pendingReviews.items.length > 0 ? (
                <ul className="space-y-1.5">
                  {pendingReviews.items.map((item) => (
                    <li key={item.reviewId} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                      <span className="truncate font-medium text-ink-900">{item.businessName}</span>
                      <span className="shrink-0 text-xs text-ink-500">{item.authorName}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-500">Nothing pending.</p>
              )}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Pending Reports</p>
                <Link href="/admin/reports" className="text-xs font-medium text-primary-600 hover:text-primary-700">
                  View all
                </Link>
              </div>
              {pendingReports && pendingReports.items.length > 0 ? (
                <ul className="space-y-1.5">
                  {pendingReports.items.map((item) => (
                    <li key={item.reportId} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                      <span className="truncate font-medium text-ink-900">{item.reason.name}</span>
                      <span className="shrink-0 text-xs text-ink-500">{item.reporter.name}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-500">Nothing pending.</p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-primary-600 p-6 text-white">
          <h2 className="font-serif text-lg font-bold">Ranking Recalculation</h2>
          <p className="mt-1 text-sm text-primary-100">
            Rankings recalculate automatically every hour (D-011). Trigger an immediate recalculation if scoring
            config or criterion weights just changed.
          </p>
          <Button
            onClick={onRecalculate}
            disabled={recalcMutation.isPending}
            variant="outline"
            className="mt-4 gap-1.5 border-white bg-white text-primary-600 hover:bg-primary-50"
          >
            <RefreshCw className={`h-4 w-4 ${recalcMutation.isPending ? 'animate-spin' : ''}`} />
            {recalcMutation.isPending ? 'Triggering...' : 'Trigger Recalculation'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {QUICK_LINKS.map(({ href, label, icon: Icon, description }) => (
          <Link
            key={href}
            href={href}
            className="flex items-start gap-3 rounded-2xl bg-white p-5 shadow-xs ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100">
              <Icon className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="font-medium text-ink-900">{label}</p>
              <p className="text-xs text-ink-500">{description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
