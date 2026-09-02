'use client';

import Link from 'next/link';
import { ArrowRight, Building2, MapPin, Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useBusinessDetailQuery } from '@/features/business/queries/use-business-detail.query';

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
// avgRating). rankingScore is a 0-100 composite index (DECISIONS.md D-012
// Step 6b), not a 1-5 rating, so it gets a Trophy icon rather than Star —
// same convention as MarketCompetitorsCard — to avoid reading as a second,
// conflicting star rating wherever avgRating is also shown nearby. The whole
// card is one <Link>, so "View Profile" is a styled span rather than a
// second nested anchor.
//
// Neither GET /rankings/top nor the trending/category leaderboard use-cases
// return a logo field (see API.md), so this additionally fetches
// GET /businesses/:businessId (also documented) for logoUrl — same pattern
// as TopRankedBento — falling back to the Building2 icon while it loads or
// when the business has no logo.
export function BusinessLeaderboardCard({
  businessId,
  businessName,
  province,
  rankingScore,
  reviewCount,
  growthPercent,
}: BusinessLeaderboardCardProps) {
  const { data: detail } = useBusinessDetailQuery(businessId);

  return (
    <Link
      href={`/businesses/${businessId}`}
      className="group flex h-full flex-col justify-between rounded-2xl bg-ink-50 p-6 shadow-xs ring-1 ring-ink-200 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div>
        <div className="mb-3 flex items-start justify-between">
          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-primary-100">
            {detail?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- external Cloudinary URL, next/image remote patterns not configured
              <img src={detail.logoUrl} alt={businessName} className="h-full w-full object-cover" />
            ) : (
              <Building2 className="h-6 w-6 text-primary-600" />
            )}
          </div>
          {growthPercent !== undefined ? <Badge variant="success">+{growthPercent.toFixed(1)}%</Badge> : null}
        </div>

        <h3 className="truncate font-sans text-lg font-bold text-ink-900 group-hover:text-primary-600">{businessName}</h3>

        <div className="mt-1 flex items-center gap-1.5 text-sm font-bold text-ink-900">
          <Trophy className="h-4 w-4 text-primary-600" />
          <span>{Math.round(rankingScore)}</span>
          {typeof reviewCount === 'number' ? <span className="font-normal text-ink-700">({reviewCount} reviews)</span> : null}
        </div>

        {province ? (
          <div className="mt-1.5 flex items-center gap-1.5 text-sm text-ink-700">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">{province}</span>
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex items-center border-t border-ink-200 pt-4">
        <span className="inline-flex items-center gap-1 font-sans text-sm font-bold text-primary-600 group-hover:text-primary-700">
          View Profile
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}
