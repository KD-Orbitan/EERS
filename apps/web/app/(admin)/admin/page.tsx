'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import { RefreshCw, Building2, MessageSquareText, Sliders, Scale, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/get-error-message';
import { useRankingMetadataQuery } from '@/features/ranking/queries/use-ranking-metadata.query';
import { useTriggerRecalculationMutation } from '@/features/admin/mutations/use-trigger-recalculation.mutation';

const QUICK_LINKS = [
  { href: '/admin/businesses', label: 'Business Verification', icon: Building2, description: 'Approve or reject a pending business by ID' },
  { href: '/admin/reviews', label: 'Review Moderation', icon: MessageSquareText, description: 'Approve or reject pending reviews for a business' },
  { href: '/admin/settings/scoring', label: 'Scoring Config', icon: Sliders, description: 'Tune the fraud detection & ranking pipeline' },
  { href: '/admin/settings/weights', label: 'Criterion Weights', icon: Scale, description: 'Adjust per-category criterion weights' },
];

// Dashboard adapted from Figma "Platform Command Center" — dropped the fake
// Total Users / growth chart / user management table since no backend
// endpoint provides platform-wide user or activity metrics. Only ranking
// metadata (a real, existing endpoint) and the moderation quick links are
// backed by real data.
export default function AdminDashboardPage() {
  const { data: metadata } = useRankingMetadataQuery();
  const recalcMutation = useTriggerRecalculationMutation();

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-2xl bg-white p-5 shadow-xs ring-1 ring-slate-200">
          <Users className="h-6 w-6 text-primary-600" />
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-500">Businesses Ranked</p>
            <p className="font-serif text-xl font-bold text-ink-900">{metadata?.totalRankedBusinesses ?? '—'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-white p-5 shadow-xs ring-1 ring-slate-200">
          <RefreshCw className="h-6 w-6 text-primary-600" />
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-500">Last Ranking Update</p>
            <p className="font-serif text-lg font-bold text-ink-900">
              {metadata ? new Date(metadata.lastCalculatedAt).toLocaleString() : '—'}
            </p>
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
          {recalcMutation.isPending ? 'Triggering...' : 'Trigger Ranking Recalculation'}
        </Button>
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
