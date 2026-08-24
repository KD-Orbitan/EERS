'use client';

import Link from 'next/link';
import { ArrowRight, Building2, MapPin, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface BusinessLeaderboardCardProps {
  businessId: number;
  businessName: string;
  province?: string;
  rankingScore: number;
  /** Omitted for category leaderboards — GET /rankings/top doesn't return a review count (only GET /rankings does). */
  reviewCount?: number;
  /** Only trending cards pass this — GLOBAL-scope only, DECISIONS.md D-031. */
  growthPercent?: number;
}

// Same box as the business directory's <BusinessCard> (avatar+badge row,
// name, rating line, province, divider, "View Profile" footer) so the
// leaderboard sections read as the same card language as the rest of the
// app, just with a growth-% badge standing in for BusinessCard's status
// badge and rankingScore standing in for avgRating (this is a ranking page —
// the other ranking components here already show rankingScore, not
// avgRating). The whole card is one <Link>, so "View Profile" is a styled
// span rather than a second nested anchor.
export function BusinessLeaderboardCard({
  businessId,
  businessName,
  province,
  rankingScore,
  reviewCount,
  growthPercent,
}: BusinessLeaderboardCardProps) {
  return (
    <Link
      href={`/businesses/${businessId}`}
      className="group flex h-full flex-col justify-between rounded-2xl bg-white p-6 shadow-xs ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div>
        <div className="mb-3 flex items-start justify-between">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-100">
            <Building2 className="h-6 w-6 text-primary-600" />
          </div>
          {growthPercent !== undefined ? <Badge variant="success">+{growthPercent.toFixed(1)}%</Badge> : null}
        </div>

        <h3 className="truncate font-sans text-lg font-bold text-ink-900 group-hover:text-primary-600">{businessName}</h3>

        <div className="mt-1 flex items-center gap-1.5 text-sm font-bold text-ink-900">
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          <span>{rankingScore.toFixed(1)}</span>
          {typeof reviewCount === 'number' ? <span className="font-normal text-ink-700">({reviewCount} reviews)</span> : null}
        </div>

        {province ? (
          <div className="mt-1.5 flex items-center gap-1.5 text-sm text-ink-700">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">{province}</span>
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex items-center border-t border-slate-200 pt-4">
        <span className="inline-flex items-center gap-1 font-sans text-sm font-bold text-primary-600 group-hover:text-primary-700">
          View Profile
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}
