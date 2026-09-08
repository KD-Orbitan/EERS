'use client';

import { ShieldCheck } from 'lucide-react';
import { useRankingMetadataQuery } from '@/features/ranking/queries/use-ranking-metadata.query';

// Mirrors Figma's "Aside - Methodology Sidebar" (node 1:682): a methodology
// blurb, a small stats panel, and a trust panel. The Figma copy claims "ISO
// 27001 certified" for a fictional analyst firm — that's a real-sounding
// certification claim, not the kind of thing to fabricate even as
// placeholder text, so this panel instead describes EERS's actual review
// moderation rule (D-007). The stats panel uses the real GET
// /rankings/metadata endpoint.
export function RankingMethodology() {
  const { data: metadata } = useRankingMetadataQuery();

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-ink-200 bg-ink-50/70 p-6 shadow-xs backdrop-blur-sm">
        <h2 className="font-sans text-lg font-bold text-ink-900">How rankings work</h2>
        <p className="mt-3 text-sm text-ink-700">
          Scores are recalculated hourly from approved reviews and weighted criteria ratings. Reviews rejected
          by fraud checks have no influence; suspicious reviews carry less weight. Bayesian adjustment moderates
          scores based on how many reviews contribute. Businesses need at least one contributing review to be ranked.
        </p>

        <div className="mt-4 divide-y divide-ink-100 rounded-xl border border-ink-100">
          <div className="flex items-center justify-between px-4 py-2.5 text-sm">
            <span className="text-ink-700">Last updated</span>
            <span className="font-medium text-ink-900">
              {metadata ? new Date(metadata.lastCalculatedAt).toLocaleString() : '—'}
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-2.5 text-sm">
            <span className="text-ink-700">Businesses ranked</span>
            <span className="font-medium text-ink-900">{metadata?.totalRankedBusinesses ?? '—'}</span>
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-primary-600 p-6 text-white">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          <h3 className="font-sans text-base font-bold">Moderated reviews</h3>
        </div>
        <p className="mt-2 text-sm text-primary-100">
          Every review is checked before it affects a ranking &mdash; only approved reviews count toward a
          business&apos;s score.
        </p>
      </div>
    </div>
  );
}
