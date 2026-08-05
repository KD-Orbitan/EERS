'use client';

import Link from 'next/link';
import { Star } from 'lucide-react';
import { useTopBusinessesQuery } from '@/features/ranking/queries/use-top-businesses.query';

const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

export function TopBusinessesWidget() {
  const { data, isLoading } = useTopBusinessesQuery({ limit: 10 });

  if (!isLoading && (!data || data.length === 0)) {
    return null;
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-xs ring-1 ring-slate-200">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-serif text-lg font-bold text-ink-900">Top Businesses</h2>
        <Link href="/rankings" className="text-sm font-medium text-primary-600 hover:text-primary-700">
          View all rankings
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-16 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {data!.map((item) => (
            <Link
              key={item.businessId}
              href={`/businesses/${item.businessId}`}
              className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 transition hover:bg-primary-50"
            >
              <span className="font-serif text-lg font-bold text-ink-900">{MEDALS[item.rank] ?? `#${item.rank}`}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink-900">{item.businessName}</p>
                <div className="flex items-center gap-1 text-xs text-ink-700">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {item.avgRating.toFixed(1)}
                </div>
              </div>
              <span className="shrink-0 font-semibold text-primary-600">{item.rankingScore.toFixed(1)}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
