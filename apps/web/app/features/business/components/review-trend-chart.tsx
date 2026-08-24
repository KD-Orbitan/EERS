'use client';

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useReviewTrendQuery } from '@/features/business/queries/use-review-trend.query';

interface ReviewTrendChartProps {
  businessId: number;
}

function formatMonthLabel(month: string) {
  const [year, monthIndex] = month.split('-').map(Number);
  return new Date(Date.UTC(year, monthIndex - 1, 1)).toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
}

// Owner-dashboard-only widget backed by the real GET
// /businesses/:businessId/review-trend endpoint (approved reviews, monthly
// buckets, trailing 12 months, zero-filled — no fabricated data points).
export function ReviewTrendChart({ businessId }: ReviewTrendChartProps) {
  const { data, isLoading } = useReviewTrendQuery(businessId);

  if (isLoading) {
    return <div className="h-72 animate-pulse rounded-3xl bg-white shadow-xs ring-1 ring-slate-200" />;
  }

  const hasData = Boolean(data && data.some((point) => point.reviewCount > 0));
  const chartData = (data ?? []).map((point) => ({ ...point, label: formatMonthLabel(point.month) }));

  return (
    <div className="rounded-3xl bg-white p-6 shadow-xs ring-1 ring-slate-200">
      <h2 className="font-sans text-lg font-bold text-ink-900">Reviews Over Time</h2>
      <p className="mt-1 text-xs text-ink-500">Approved reviews per month, last 12 months</p>

      {!hasData ? (
        <p className="mt-8 text-center text-sm text-ink-500">No approved reviews in the last 12 months.</p>
      ) : (
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="reviewTrendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3525cd" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#3525cd" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#475569' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#475569' }} axisLine={false} tickLine={false} width={32} />
              <Tooltip
                formatter={(value) => [value, 'Reviews']}
                labelStyle={{ color: '#0f172a', fontWeight: 600 }}
                contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }}
              />
              <Area type="monotone" dataKey="reviewCount" stroke="#3525cd" strokeWidth={2} fill="url(#reviewTrendFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
