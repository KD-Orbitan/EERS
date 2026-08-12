'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { rankingTrendConfigSchema, RankingTrendConfigInput } from '@/features/admin/schemas/ranking-trend-config.schema';
import { RankingTrendConfig } from '@/features/admin/types/admin.type';

interface RankingTrendConfigFormProps {
  config: RankingTrendConfig;
  onSubmit: (data: RankingTrendConfigInput) => void | Promise<void>;
  isLoading?: boolean;
}

const PERIOD_OPTIONS: { value: RankingTrendConfigInput['period']; label: string; description: string }[] = [
  { value: 'DAY', label: 'Day', description: 'Compare against the ranking snapshot from ~24 hours ago.' },
  { value: 'WEEK', label: 'Week', description: 'Compare against the ranking snapshot from ~7 days ago.' },
  { value: 'MONTH', label: 'Month', description: 'Compare against the ranking snapshot from ~30 days ago.' },
];

export function RankingTrendConfigForm({ config, onSubmit, isLoading }: RankingTrendConfigFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = useForm<RankingTrendConfigInput>({
    resolver: zodResolver(rankingTrendConfigSchema),
    defaultValues: { period: config.period },
  });

  const selected = watch('period');
  const pending = isLoading || isSubmitting;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="rounded-3xl bg-white p-6 shadow-xs ring-1 ring-slate-200">
        <h2 className="font-serif text-base font-bold text-ink-900">Trend Lookback Period</h2>
        <p className="mt-1 text-xs text-ink-500">
          Used by GET /rankings/businesses/:businessId to compute the rank/score trend shown on business profiles
          (D-031). Takes effect immediately — no cache to invalidate.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {PERIOD_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`cursor-pointer rounded-2xl border p-4 transition ${
                selected === option.value ? 'border-primary-500 bg-primary-50' : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input type="radio" value={option.value} className="sr-only" {...register('period')} />
              <p className="font-serif text-sm font-bold text-ink-900">{option.label}</p>
              <p className="mt-1 text-xs text-ink-500">{option.description}</p>
            </label>
          ))}
        </div>

        <p className="mt-4 text-xs text-ink-500">
          Last updated {new Date(config.updatedAt).toLocaleString()}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving...' : 'Save Config'}
        </Button>
      </div>
    </form>
  );
}
