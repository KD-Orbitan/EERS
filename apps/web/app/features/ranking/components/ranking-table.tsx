'use client';

import Link from 'next/link';
import { ArrowRight, Building2, Minus, Star } from 'lucide-react';
import { RankingListItem } from '@/features/ranking/types/ranking.type';
import { RankingTrendBadge } from '@/features/ranking/components/ranking-trend-badge';
import { PaginationMeta } from '@/features/business/types/business.type';
import { useBusinessDetailQuery } from '@/features/business/queries/use-business-detail.query';

interface RankingTableProps {
  rankings: RankingListItem[];
  isLoading: boolean;
  pagination?: PaginationMeta;
  onPageChange?: (page: number) => void;
}

// One row per business. Extracted from the map below so each row can call
// useBusinessDetailQuery for its own logoUrl (GET /rankings doesn't return
// one, see API.md) without breaking the rules of hooks — a table with a
// variable number of rows can't call a per-item hook inside .map() in the
// parent component itself.
function RankingTableRow({ item }: { item: RankingListItem }) {
  const { data: detail } = useBusinessDetailQuery(item.businessId);

  return (
    <tr className="border-b border-ink-100 last:border-0 hover:bg-primary-50">
      <td className="px-6 py-4 font-sans text-base font-bold text-ink-900">#{item.rank}</td>
      <td className="px-6 py-4">
        <Link href={`/businesses/${item.businessId}`} className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-100">
            {detail?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- external Cloudinary URL, next/image remote patterns not configured
              <img src={detail.logoUrl} alt={item.businessName} className="h-full w-full object-cover" />
            ) : (
              <Building2 className="h-5 w-5 text-primary-600" />
            )}
          </div>
          <div>
            <p className="font-medium text-ink-900 hover:text-primary-600">{item.businessName}</p>
            {item.province ? <p className="text-xs text-ink-500">{item.province}</p> : null}
          </div>
        </Link>
      </td>
      <td className="px-6 py-4">
        <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-3 py-1 text-xs font-bold text-primary-600">
          <Star className="h-3 w-3 fill-primary-600 text-primary-600" />
          {item.rankingScore.toFixed(1)}
        </span>
      </td>
      <td className="px-6 py-4 text-ink-700">{item.reviewCount}</td>
      <td className="px-6 py-4">
        {item.trend ? (
          <RankingTrendBadge trend={item.trend} variant="light" />
        ) : (
          <span className="inline-flex items-center gap-1 text-ink-400" title="No trend available for this view">
            <Minus className="h-3.5 w-3.5" />
            <span className="text-xs">N/A</span>
          </span>
        )}
      </td>
      <td className="px-6 py-4 text-right">
        <Link
          href={`/businesses/${item.businessId}`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-ink-200 text-primary-600 transition hover:bg-primary-50"
          aria-label={`View ${item.businessName}`}
        >
          <ArrowRight className="h-4 w-4" />
        </Link>
      </td>
    </tr>
  );
}

// Column layout from Figma's "Main Ranking Table" (node 1:710): Rank,
// Business (icon + name + subtitle), Score (pill), Reviews, Trend, Action.
// Trend is GLOBAL-scope only (DECISIONS.md D-031) — the API returns
// trend: null for category/province-filtered lists or when there's no
// history baseline yet, and RankingTrendBadge already renders nothing for null.
export function RankingTable({ rankings, isLoading, pagination, onPageChange }: RankingTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="h-16 animate-pulse rounded-xl bg-ink-50 shadow-xs ring-1 ring-ink-200" />
        ))}
      </div>
    );
  }

  if (rankings.length === 0) {
    return (
      <div className="rounded-3xl bg-ink-50 p-10 text-center shadow-xs ring-1 ring-ink-200">
        <p className="text-sm text-ink-700">No rankings found. Try adjusting your filters.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-3xl bg-ink-50 shadow-xs ring-1 ring-ink-200">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-ink-200 text-xs uppercase tracking-wide text-ink-500">
              <th className="px-6 py-4 font-medium">Rank</th>
              <th className="px-6 py-4 font-medium">Business</th>
              <th className="px-6 py-4 font-medium">Score</th>
              <th className="px-6 py-4 font-medium">Reviews</th>
              <th className="px-6 py-4 font-medium">Trend</th>
              <th className="px-6 py-4" />
            </tr>
          </thead>
          <tbody>
            {rankings.map((item) => (
              <RankingTableRow key={item.businessId} item={item} />
            ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && onPageChange ? (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="rounded-lg border border-ink-300 bg-ink-50 px-4 py-2 text-sm font-medium text-ink-700 transition hover:bg-ink-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-ink-600">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="rounded-lg border border-ink-300 bg-ink-50 px-4 py-2 text-sm font-medium text-ink-700 transition hover:bg-ink-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}
