'use client';

import { useSentimentSummaryQuery } from '@/features/review/queries/use-sentiment-summary.query';

interface SentimentSummaryCardProps {
  businessId: number;
}

const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Hand-rolled SVG ring (no chart library in this repo) mirroring the Figma
// "Customer Sentiment — AI-powered perception analysis" widget: a single
// dominant percentage (positive share) in a ring, with the neutral/negative
// breakdown as a small legend underneath rather than a second ring segment.
export function SentimentSummaryCard({ businessId }: SentimentSummaryCardProps) {
  const { data, isLoading } = useSentimentSummaryQuery(businessId);

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-3xl bg-ink-50 shadow-xs ring-1 ring-ink-200" />;
  }

  if (!data || data.totalReviews === 0) {
    return (
      <div className="rounded-3xl bg-ink-50 p-6 shadow-xs ring-1 ring-ink-200">
        <h2 className="font-sans text-lg font-bold text-ink-900">Customer Sentiment</h2>
        <p className="mt-1 text-xs text-ink-500">AI-powered perception analysis</p>
        <p className="mt-8 text-center text-sm text-ink-500">Not enough analyzed reviews yet.</p>
      </div>
    );
  }

  const offset = CIRCUMFERENCE * (1 - data.positive / 100);

  return (
    <div className="rounded-3xl bg-ink-50 p-6 shadow-xs ring-1 ring-ink-200">
      <h2 className="font-sans text-lg font-bold text-ink-900">Customer Sentiment</h2>
      <p className="mt-1 text-xs text-ink-500">AI-powered perception analysis</p>

      <div className="relative mt-4 flex items-center justify-center">
        <svg width={104} height={104} viewBox="0 0 104 104" className="-rotate-90">
          <circle cx={52} cy={52} r={RADIUS} fill="none" stroke="#e2e8f0" strokeWidth={10} />
          <circle
            cx={52}
            cy={52}
            r={RADIUS}
            fill="none"
            stroke="#0f766e"
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="font-sans text-2xl font-bold text-ink-900">{data.positive}%</span>
          <span className="text-[10px] uppercase tracking-wide text-ink-500">Positive</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
        <div>
          <p className="font-bold text-emerald-600">{data.positive}%</p>
          <p className="text-ink-500">Positive</p>
        </div>
        <div>
          <p className="font-bold text-ink-500">{data.neutral}%</p>
          <p className="text-ink-500">Neutral</p>
        </div>
        <div>
          <p className="font-bold text-red-600">{data.negative}%</p>
          <p className="text-ink-500">Negative</p>
        </div>
      </div>
    </div>
  );
}
