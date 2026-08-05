'use client';

import Link from 'next/link';
import { Building2, Mail, Phone, Pencil, Star, Tag, Trash2, Trophy, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { LocationList } from '@/features/business/components/location-list';
import { BusinessDetail as BusinessDetailData, BusinessStatistics } from '@/features/business/types/business.type';
import { BusinessRanking } from '@/features/ranking/types/ranking.type';

interface BusinessDetailProps {
  business: BusinessDetailData;
  stats?: BusinessStatistics;
  ranking?: BusinessRanking;
  isOwner: boolean;
  onDelete: () => void;
  isDeleting?: boolean;
}

// Layout mirrors the real "Business Profile" page (Figma node 1:902): a hero
// banner, a public stats row, a benchmark/breakdown card, then locations.
// There is no photo field on Business, so the hero uses a gradient instead
// of the Figma mockup's background image; the "Overall Score"/"A+" grade and
// "Top Performer" achievement tiles have no backing data (no 0-100 score or
// achievement system in the API), so the public stats row shows real fields
// (rating, review count, categories) in the same visual slots instead.
export function BusinessDetail({ business, stats, ranking, isOwner, onDelete, isDeleting }: BusinessDetailProps) {
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-primary-600 to-primary-500 p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/90 shadow-lg">
              <Building2 className="h-8 w-8 text-primary-600" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-serif text-3xl font-bold text-white sm:text-4xl">{business.name}</h1>
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium uppercase tracking-wide text-primary-100 backdrop-blur-sm">
                  {business.status}
                </span>
                {ranking?.rank ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
                    <Trophy className="h-3.5 w-3.5" />
                    Global Rank #{ranking.rank}
                  </span>
                ) : null}
              </div>
              {business.description ? (
                <p className="mt-2 max-w-xl text-sm text-white/80">{business.description}</p>
              ) : null}
            </div>
          </div>

          {isOwner ? (
            <div className="flex gap-2">
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
            </div>
          ) : null}
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-primary-50 p-6">
          <p className="text-xs uppercase tracking-wide text-ink-700">Average Rating</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="font-serif text-4xl font-bold text-primary-600">{business.avgRating.toFixed(1)}</span>
            <Star className="h-6 w-6 fill-amber-400 text-amber-400" />
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-primary-50 p-6">
          <p className="text-xs uppercase tracking-wide text-ink-700">Total Reviews</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="font-serif text-4xl font-bold text-ink-900">{business.reviewCount}</span>
            <Users className="h-6 w-6 text-ink-500" />
          </div>
        </div>

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

      {isOwner && stats ? (
        <div className="rounded-3xl bg-white p-6 shadow-xs ring-1 ring-slate-200">
          <h2 className="mb-4 font-serif text-lg font-bold text-ink-900">Rating breakdown</h2>
          <div className="mb-4 grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-ink-500">Reviews</p>
              <p className="text-xl font-semibold text-ink-900">{stats.reviewCount}</p>
            </div>
            <div>
              <p className="text-xs text-ink-500">Avg rating</p>
              <p className="text-xl font-semibold text-ink-900">{stats.avgRating.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-xs text-ink-500">Ranking</p>
              <p className="text-xl font-semibold text-ink-900">{stats.rankingPosition ?? '—'}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            {([5, 4, 3, 2, 1] as const).map((star) => {
              const count = stats.ratingDistribution[star];
              const total = stats.reviewCount || 1;
              const percentage = Math.round((count / total) * 100);
              return (
                <div key={star} className="flex items-center gap-2 text-xs text-ink-700">
                  <span className="w-8 shrink-0">{star}★</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-primary-100">
                    <div className="h-full rounded-full bg-amber-400" style={{ width: `${percentage}%` }} />
                  </div>
                  <span className="w-8 shrink-0 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <LocationList businessId={business.businessId} locations={business.locations} isOwner={isOwner} />
    </div>
  );
}
