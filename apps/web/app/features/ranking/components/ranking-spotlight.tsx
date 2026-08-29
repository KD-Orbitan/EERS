'use client';

import Link from 'next/link';
import { Building2 } from 'lucide-react';
import { useBusinessDetailQuery } from '@/features/business/queries/use-business-detail.query';
import { TopRankingItem } from '@/features/ranking/types/ranking.type';

// Podium layout from Figma "Global Rankings" (node 1:641, "Spotlight Section
// (Top 3)"): rank 1 centered and elevated with a gold ring, ranks 2/3 flank
// it in silver/bronze. GET /rankings/top doesn't return a logo field (see
// API.md), so each card additionally fetches GET /businesses/:businessId
// (also documented) for logoUrl — same pattern already used by
// TopRankedBento — falling back to the Building2 icon while it loads or
// when the business genuinely has no logo.
const TIER = {
  1: { ring: 'border-amber-400', badge: 'bg-amber-400 text-white', label: 'GOLD', card: 'bg-primary-500/10 border-2 border-primary-600/20 shadow-lg -mt-2 sm:-mt-4' },
  2: { ring: 'border-ink-300', badge: 'bg-ink-300 text-ink-900', label: 'SILVER', card: 'bg-primary-200/60 border border-ink-200' },
  3: { ring: 'border-orange-300', badge: 'bg-orange-300 text-ink-900', label: 'BRONZE', card: 'bg-primary-200/60 border border-ink-200 mt-1 sm:mt-2' },
} as const;

function SpotlightCard({ item, tier }: { item: TopRankingItem; tier: 1 | 2 | 3 }) {
  const { data: detail } = useBusinessDetailQuery(item.businessId);
  const style = TIER[tier];
  const avatarSize = tier === 1 ? 'h-14 w-14 sm:h-32 sm:w-32' : 'h-11 w-11 sm:h-24 sm:w-24';
  const iconSize = tier === 1 ? 'h-5 w-5 sm:h-10 sm:w-10' : 'h-4 w-4 sm:h-8 sm:w-8';

  return (
    <Link href={`/businesses/${item.businessId}`} className={`flex flex-col items-center rounded-xl px-2 py-3 text-center transition hover:-translate-y-0.5 sm:rounded-3xl sm:px-6 sm:py-8 ${style.card}`}>
      <div className="relative mb-2 sm:mb-4">
        <div className={`flex items-center justify-center overflow-hidden rounded-full border-2 bg-ink-50 sm:border-4 ${style.ring} ${avatarSize}`}>
          {detail?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- external Cloudinary URL, next/image remote patterns not configured
            <img src={detail.logoUrl} alt={item.businessName} className="h-full w-full object-cover" />
          ) : (
            <Building2 className={`text-primary-600 ${iconSize}`} />
          )}
        </div>
        <span className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-1.5 py-0.5 text-[9px] font-bold tracking-wide shadow-sm sm:-bottom-2 sm:px-4 sm:py-1 sm:text-xs ${style.badge}`}>
          {style.label}
        </span>
      </div>
      <h3 className={`w-full truncate font-sans font-bold text-ink-900 ${tier === 1 ? 'text-sm sm:text-2xl' : 'text-xs sm:text-xl'}`}>{item.businessName}</h3>
      {item.province ? <p className="mt-0.5 w-full truncate text-[10px] text-ink-700 sm:mt-1 sm:text-sm">{item.province}</p> : null}
      <p className={`mt-1 font-sans font-black text-primary-600 sm:mt-3 ${tier === 1 ? 'text-xl sm:text-5xl' : 'text-base sm:text-2xl'}`}>{item.rankingScore.toFixed(1)}</p>
    </Link>
  );
}

interface RankingSpotlightProps {
  items: TopRankingItem[];
  isLoading: boolean;
}

export function RankingSpotlight({ items, isLoading }: RankingSpotlightProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-40 animate-pulse rounded-xl bg-ink-50 shadow-xs ring-1 ring-ink-200 sm:h-72 sm:rounded-3xl" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return null;
  }

  // Classic podium order (2nd, 1st, 3rd) only when all three spots are filled.
  const ordered = items.length >= 3 ? [items[1], items[0], items[2]] : items;
  const tiers = items.length >= 3 ? ([2, 1, 3] as const) : items.map((_, i) => (i + 1) as 1 | 2 | 3);

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4">
      {ordered.map((item, index) => (
        <SpotlightCard key={item.businessId} item={item} tier={tiers[index]} />
      ))}
    </div>
  );
}
