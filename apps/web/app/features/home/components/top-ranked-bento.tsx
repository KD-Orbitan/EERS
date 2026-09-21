'use client';

import Link from 'next/link';
import { descriptionExcerpt } from '@/lib/business-description';
import { ArrowRight, Building2, MapPin, Star, Trophy } from 'lucide-react';
import { BusinessLogoBadge } from '@/features/business/components/business-logo-badge';
import { useTopBusinessesQuery } from '@/features/ranking/queries/use-top-businesses.query';
import { useBusinessDetailQuery } from '@/features/business/queries/use-business-detail.query';
import { TopRankingItem } from '@/features/ranking/types/ranking.type';
import { BusinessDetail } from '@/features/business/types/business.type';

// Mirrors Figma "Section - Ranking Highlights (Bento Grid)" (node 1:511): one
// large featured card for #1, two stacked secondary cards for #2/#3. The
// mockup's per-card marketing blurb ("Consistently ranked #1 for
// transparency...") has no backing field on TopRankingItem — omitted rather
// than invented, same as elsewhere in this app. No business photo field
// either, so a building icon stands in for the mockup's photo, matching the
// existing RankingSpotlight component's placeholder pattern.
//
// GET /rankings/top only returns rank/businessId/businessName/avgRating/
// rankingScore (see API.md) — reviewCount/categories/description aren't part
// of that contract, so instead of adding undocumented fields to the ranking
// use-case, each card additionally fetches GET /businesses/:businessId (also
// documented) to fill in the same info the directory's BusinessCard shows.
// That detail call resolves slightly after the ranking list, so those fields
// render once loaded rather than blocking the card.
function FeaturedCard({ item, detail }: { item: TopRankingItem; detail?: BusinessDetail }) {
  return (
    <Link
      href={`/businesses/${item.businessId}`}
      className="ease-md group relative flex h-full flex-col justify-end overflow-hidden rounded-3xl bg-primary-600 bg-cover bg-center p-8 text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
      style={detail?.coverUrl ? { backgroundImage: `url(${detail.coverUrl})` } : undefined}
    >
      {detail?.coverUrl ? <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/10" /> : null}
      <Building2 className="absolute right-6 top-6 h-16 w-16 text-white/10" />

      <div className="relative">
        <div className="flex items-center gap-3">
          <BusinessLogoBadge logoUrl={detail?.logoUrl} name={item.businessName} />
          <span className="inline-flex items-center gap-1 rounded-full bg-primary-500 px-3 py-1 text-xs font-medium uppercase tracking-wide">
            <Trophy className="h-3.5 w-3.5" />
            Rank #{item.rank}
          </span>
        </div>
        <h3 className="mt-4 text-3xl font-medium tracking-tight">{item.businessName}</h3>
        {detail?.description ? (
          <p className="mt-2 line-clamp-2 text-sm text-white/80" dangerouslySetInnerHTML={{ __html: descriptionExcerpt(detail.description) }} />
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-white/90">
          <span className="flex items-center gap-1 font-medium text-white">
            <Star className="h-4 w-4 fill-amber-300 text-amber-300" />
            {item.avgRating.toFixed(1)}
          </span>
          {typeof detail?.reviewCount === 'number' ? <span>({detail.reviewCount} reviews)</span> : null}
          {item.province ? (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {item.province}
            </span>
          ) : null}
        </div>

        {detail?.categories && detail.categories.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {detail.categories.map((category) => (
              <span key={category.categoryId} className="inline-flex items-center rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-medium">
                {category.categoryName}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-6 flex items-center justify-between border-t border-white/20 pt-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-white/70">Ranking Score</p>
            <p className="text-3xl font-medium">
              {Math.round(item.rankingScore)}
              <span className="text-sm font-normal text-white/60">/100</span>
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-white transition group-hover:gap-2">
            View detail
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function SecondaryCard({ item, detail }: { item: TopRankingItem; detail?: BusinessDetail }) {
  return (
    <Link
      href={`/businesses/${item.businessId}`}
      className="ease-md relative flex flex-1 items-center justify-between gap-3 overflow-hidden rounded-2xl bg-primary-50 bg-cover bg-center p-5 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md"
      style={detail?.coverUrl ? { backgroundImage: `url(${detail.coverUrl})` } : undefined}
    >
      {detail?.coverUrl ? <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/85 to-white/60" /> : null}
      <div className="relative flex items-center gap-3 truncate">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-600">
          #{item.rank}
        </span>
        <div className="truncate">
          <p className="truncate text-sm font-medium tracking-tight text-ink-900">{item.businessName}</p>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-600">
            <span className="flex items-center gap-1 font-medium text-ink-900">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {item.avgRating.toFixed(1)}
            </span>
            {typeof detail?.reviewCount === 'number' ? <span>({detail.reviewCount})</span> : null}
            {item.province ? <span className="truncate">· {item.province}</span> : null}
          </div>
          {detail?.categories && detail.categories.length > 0 ? (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {detail.categories.slice(0, 2).map((category) => (
                <span key={category.categoryId} className="inline-flex items-center rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-600">
                  {category.categoryName}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      <span className="relative flex shrink-0 items-center gap-1 text-lg font-medium text-primary-600">
        <Trophy className="h-4 w-4" />
        {Math.round(item.rankingScore)}
      </span>
    </Link>
  );
}

export function TopRankedBento() {
  const { data, isLoading } = useTopBusinessesQuery({ limit: 3 });

  // Fixed 3-slot fetch (limit is always 3) so hook call order stays constant
  // across renders regardless of how many ranked businesses come back.
  const detailQueries = [
    useBusinessDetailQuery(data?.[0]?.businessId),
    useBusinessDetailQuery(data?.[1]?.businessId),
    useBusinessDetailQuery(data?.[2]?.businessId),
  ];

  if (!isLoading && (!data || data.length === 0)) {
    return null;
  }

  return (
    <div className="px-4 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-medium tracking-tight text-ink-900 sm:text-4xl">Top-Ranked Businesses</h2>
            <p className="mt-2 text-base text-ink-600">The highest-scoring entities across all sectors right now.</p>
          </div>
          <Link href="/rankings" className="group inline-flex items-center gap-1 text-sm font-medium text-primary-600">
            View full leaderboard
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="h-96 animate-pulse rounded-3xl bg-primary-50 shadow-sm" />
            <div className="h-96 animate-pulse rounded-3xl bg-primary-50 shadow-sm" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="min-h-96">
              <FeaturedCard item={data![0]} detail={detailQueries[0].data} />
            </div>
            {data!.length > 1 ? (
              <div className="flex flex-col gap-4">
                {data!.slice(1, 3).map((item, index) => (
                  <SecondaryCard key={item.businessId} item={item} detail={detailQueries[index + 1].data} />
                ))}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
