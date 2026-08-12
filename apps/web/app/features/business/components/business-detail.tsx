'use client';

import Link from 'next/link';
import { LayoutDashboard, Mail, Phone, Pencil, PenLine, Tag, Trash2, Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { LocationList } from '@/features/business/components/location-list';
import { CoverUpload } from '@/features/business/components/cover-upload';
import { LogoUpload } from '@/features/business/components/logo-upload';
import { GalleryManager } from '@/features/business/components/gallery-manager';
import { BusinessStatTiles } from '@/features/business/components/business-stat-tiles';
import { BusinessDetail as BusinessDetailData } from '@/features/business/types/business.type';
import { BusinessRanking } from '@/features/ranking/types/ranking.type';
import { BookmarkButton } from '@/features/business/components/bookmark-button';
import { RankingTrendBadge } from '@/features/ranking/components/ranking-trend-badge';
import { SentimentSummaryCard } from '@/features/review/components/sentiment-summary-card';
import { ReviewDistributionCard } from '@/features/review/components/review-distribution-card';
import { MarketCompetitorsCard } from '@/features/ranking/components/market-competitors-card';
import { CriteriaScoresCard } from '@/features/review/components/criteria-scores-card';
import { ReviewSummary } from '@/features/review/components/review-summary';

interface BusinessDetailProps {
  business: BusinessDetailData;
  ranking?: BusinessRanking;
  isOwner: boolean;
  onDelete: () => void;
  isDeleting?: boolean;
}

// Wide 2-column layout mirroring the Figma "Business Profile" mockup
// (apps/web/figma/Business Profile - Velocity Systems.png): hero, a stat
// tile row, then a main column (Performance Benchmarks / Gallery / Review
// Distribution + Sentiment / Verified Reviews) alongside a sidebar
// (Locations / Market Competitors). Two mockup pieces are deliberately not
// reproduced: the "Overall Score A+"/"Top Performer percentile" tiles (no
// grading/percentile system in the API — see D-027 note in business-detail
// history) and the "Global Headquarters" photo card (locations have no image
// field), same "don't fabricate missing data" principle applied throughout.
export function BusinessDetail({ business, ranking, isOwner, onDelete, isDeleting }: BusinessDetailProps) {
  const { isAuthenticated } = useAuth();

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl p-8">
        <CoverUpload businessId={business.businessId} coverUrl={business.coverUrl} isOwner={isOwner} />

        <div className="relative z-[1] flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <LogoUpload businessId={business.businessId} logoUrl={business.logoUrl} isOwner={isOwner} />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-serif text-3xl font-bold text-white sm:text-4xl">{business.name}</h1>
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium uppercase tracking-wide text-primary-100 backdrop-blur-sm">
                  {business.status}
                </span>
                {ranking?.rank ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
                    <span className="inline-flex items-center gap-1">
                      <Trophy className="h-3.5 w-3.5" />
                      Global Rank #{ranking.rank}
                    </span>
                    <RankingTrendBadge trend={ranking.trend} />
                  </span>
                ) : null}
              </div>
              {business.description ? (
                <p className="mt-2 max-w-xl text-sm text-white/80">{business.description}</p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <BookmarkButton businessId={business.businessId} />
            {isAuthenticated && !isOwner ? (
              <Link
                href={`/businesses/${business.businessId}/reviews/write`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-primary-700"
              >
                <PenLine className="h-4 w-4" />
                Write Review
              </Link>
            ) : null}
            {isOwner ? (
              <>
                <Link
                  href={`/businesses/${business.businessId}/dashboard`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/20"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                <Link
                  href={`/businesses/${business.businessId}/edit`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/20"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={onDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" />
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-xs ring-1 ring-slate-200">
        <div className="flex flex-wrap gap-1.5">
          {business.categories.map((category) => (
            <Badge key={category.categoryId} variant="brand">
              {category.categoryName}
            </Badge>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-sm text-ink-700">
          <div className="flex items-center gap-1.5">
            <Phone className="h-4 w-4" />
            <span>{business.phone}</span>
          </div>
          {business.email ? (
            <div className="flex items-center gap-1.5">
              <Mail className="h-4 w-4" />
              <span>{business.email}</span>
            </div>
          ) : null}
        </div>

        <p className="mt-4 text-xs text-ink-500">Owned by {business.owner.name}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <BusinessStatTiles
          avgRating={business.avgRating}
          reviewCount={business.reviewCount}
          rank={ranking?.rank}
          trend={ranking?.trend}
        />

        <div className="rounded-3xl bg-primary-500 p-6 text-white">
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary-100" />
            <p className="font-serif text-lg font-bold">Categories</p>
          </div>
          <p className="mt-1 text-sm text-primary-100">
            {business.categories.length > 0
              ? business.categories.map((category) => category.categoryName).join(', ')
              : 'No categories listed'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr] lg:items-start">
        <div className="space-y-6">
          <CriteriaScoresCard businessId={business.businessId} />

          <GalleryManager businessId={business.businessId} gallery={business.gallery} isOwner={isOwner} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ReviewDistributionCard businessId={business.businessId} />
            <SentimentSummaryCard businessId={business.businessId} />
          </div>

          <ReviewSummary businessId={business.businessId} isOwner={isOwner} />
        </div>

        <div className="space-y-6">
          <LocationList businessId={business.businessId} locations={business.locations} isOwner={isOwner} />
          <MarketCompetitorsCard businessId={business.businessId} />
        </div>
      </div>
    </div>
  );
}
