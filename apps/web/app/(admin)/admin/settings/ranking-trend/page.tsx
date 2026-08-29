'use client';

import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/get-error-message';
import { useRankingTrendConfigQuery } from '@/features/admin/queries/use-ranking-trend-config.query';
import { useUpdateRankingTrendConfigMutation } from '@/features/admin/mutations/use-update-ranking-trend-config.mutation';
import { RankingTrendConfigForm } from '@/features/admin/components/ranking-trend-config-form';
import { RankingTrendConfigInput } from '@/features/admin/schemas/ranking-trend-config.schema';

export default function RankingTrendConfigPage() {
  const { data: config, isLoading } = useRankingTrendConfigQuery();
  const updateMutation = useUpdateRankingTrendConfigMutation();

  const onSubmit = async (data: RankingTrendConfigInput) => {
    try {
      await updateMutation.mutateAsync(data);
      toast.success('Ranking trend configuration updated.');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Unable to update ranking trend configuration.'));
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-sans text-3xl font-bold text-ink-900">Ranking Trend Configuration</h1>
        <p className="mt-1 text-sm text-ink-700">
          Controls the lookback period used to compute rank/score trend on business profiles (D-031).
        </p>
      </div>

      {isLoading ? (
        <div className="h-40 animate-pulse rounded-3xl bg-ink-50 shadow-xs ring-1 ring-ink-200" />
      ) : !config ? (
        <div className="rounded-3xl bg-ink-50 p-10 text-center shadow-xs ring-1 ring-ink-200">
          <p className="text-sm text-ink-700">No ranking trend configuration found.</p>
        </div>
      ) : (
        <RankingTrendConfigForm config={config} onSubmit={onSubmit} isLoading={updateMutation.isPending} />
      )}
    </div>
  );
}
