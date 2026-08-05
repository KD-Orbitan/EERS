'use client';

import Link from 'next/link';
import { Building2 } from 'lucide-react';
import { TopRankingItem } from '@/features/ranking/types/ranking.type';

// Podium layout from Figma "Global Rankings" (node 1:641, "Spotlight Section
// (Top 3)"): rank 1 centered and elevated with a gold ring, ranks 2/3 flank
// it in silver/bronze. There's no business photo field, so avatars are an
// icon placeholder instead of the Figma mockup's image.
const TIER = {
  1: { ring: 'border-amber-400', badge: 'bg-amber-400 text-white', label: 'GOLD', card: 'bg-primary-500/10 border-2 border-primary-600/20 shadow-lg sm:-mt-4' },
  2: { ring: 'border-slate-300', badge: 'bg-slate-300 text-ink-900', label: 'SILVER', card: 'bg-primary-200/60 border border-slate-200' },
  3: { ring: 'border-orange-300', badge: 'bg-orange-300 text-ink-900', label: 'BRONZE', card: 'bg-primary-200/60 border border-slate-200 sm:mt-2' },
} as const;

function SpotlightCard({ item, tier }: { item: TopRankingItem; tier: 1 | 2 | 3 }) {
  const style = TIER[tier];
  const avatarSize = tier === 1 ? 'h-32 w-32' : 'h-24 w-24';

  return (
    <Link href={`/businesses/${item.businessId}`} className={`flex flex-col items-center rounded-3xl px-6 py-8 text-center transition hover:-translate-y-0.5 ${style.card}`}>
      <div className="relative mb-4">
        <div className={`flex items-center justify-center rounded-full border-4 bg-white ${style.ring} ${avatarSize}`}>
          <Building2 className={tier === 1 ? 'h-10 w-10 text-primary-600' : 'h-8 w-8 text-primary-600'} />
        </div>
        <span className={`absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-4 py-1 text-xs font-bold tracking-wide shadow-sm ${style.badge}`}>
          {style.label}
        </span>
      </div>
      <h3 className={`font-serif font-bold text-ink-900 ${tier === 1 ? 'text-2xl' : 'text-xl'}`}>{item.businessName}</h3>
      {item.province ? <p className="mt-1 text-sm text-ink-700">{item.province}</p> : null}
      <p className={`mt-3 font-serif font-black text-primary-600 ${tier === 1 ? 'text-5xl' : 'text-2xl'}`}>{item.rankingScore.toFixed(1)}</p>
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-72 animate-pulse rounded-3xl bg-white shadow-xs ring-1 ring-slate-200" />
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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {ordered.map((item, index) => (
        <SpotlightCard key={item.businessId} item={item} tier={tiers[index]} />
      ))}
    </div>
  );
}
