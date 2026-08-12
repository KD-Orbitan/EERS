'use client';

import { useCriteriaScoresQuery } from '@/features/review/queries/use-criteria-scores.query';

interface CriteriaScoresCardProps {
  businessId: number;
}

// Mirrors the Figma "Performance Benchmarks" widget, but scored on the
// existing 1-5 rating scale (see docs/API.md criteria-scores notes) rather
// than the mockup's fabricated 0-10 numbers, since that's what the data
// actually supports.
export function CriteriaScoresCard({ businessId }: CriteriaScoresCardProps) {
  const { data, isLoading } = useCriteriaScoresQuery(businessId);

  if (isLoading) {
    return <div className="h-48 animate-pulse rounded-3xl bg-white shadow-xs ring-1 ring-slate-200" />;
  }

  if (!data || data.criteria.length === 0) {
    return null;
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow-xs ring-1 ring-slate-200">
      <h2 className="font-serif text-lg font-bold text-ink-900">Performance Benchmarks</h2>
      <p className="mt-1 text-xs text-ink-500">Average rating per criterion, out of 5</p>

      <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
        {data.criteria.map((criterion) => (
          <div key={criterion.criterionId}>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-ink-900">{criterion.criterionName}</span>
              <span className="font-bold text-primary-600">
                {criterion.reviewCount > 0 ? criterion.avgRating.toFixed(1) : '—'}
              </span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-primary-100">
              <div
                className="h-full rounded-full bg-primary-500"
                style={{ width: `${(criterion.avgRating / 5) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
