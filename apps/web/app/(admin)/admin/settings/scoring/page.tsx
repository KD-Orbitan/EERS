'use client';

import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/get-error-message';
import { useScoringConfigQuery } from '@/features/admin/queries/use-scoring-config.query';
import { useUpdateScoringConfigMutation } from '@/features/admin/mutations/use-update-scoring-config.mutation';
import { ScoringConfigForm } from '@/features/admin/components/scoring-config-form';
import { ScoringConfigInput } from '@/features/admin/schemas/scoring-config.schema';

export default function ScoringConfigPage() {
  const { data: config, isLoading } = useScoringConfigQuery();
  const updateMutation = useUpdateScoringConfigMutation();

  const onSubmit = async (data: ScoringConfigInput) => {
    try {
      await updateMutation.mutateAsync(data);
      toast.success('Scoring configuration updated.');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Unable to update scoring configuration.'));
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-sans text-3xl font-bold text-ink-900">Scoring Configuration</h1>
        <p className="mt-1 text-sm text-ink-700">
          Fraud detection and ranking pipeline parameters (D-012). Changes take effect on the next ranking
          recalculation.
        </p>
      </div>

      {isLoading ? (
        <div className="h-64 animate-pulse rounded-3xl bg-ink-50 shadow-xs ring-1 ring-ink-200" />
      ) : !config ? (
        <div className="rounded-3xl bg-ink-50 p-10 text-center shadow-xs ring-1 ring-ink-200">
          <p className="text-sm text-ink-700">No scoring configuration found.</p>
        </div>
      ) : (
        <ScoringConfigForm config={config} onSubmit={onSubmit} isLoading={updateMutation.isPending} />
      )}
    </div>
  );
}
