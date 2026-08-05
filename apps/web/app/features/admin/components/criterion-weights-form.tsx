'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/get-error-message';
import { useBusinessCriteriaQuery } from '@/features/review/queries/use-business-criteria.query';
import { useCriterionWeightsQuery } from '@/features/admin/queries/use-criterion-weights.query';
import { useUpdateCriterionWeightMutation } from '@/features/admin/mutations/use-update-criterion-weight.mutation';

interface CriterionWeightsFormProps {
  categoryId: number;
}

// GET /admin/criterion-weights/:categoryId returns {categoryId, criterionId,
// weight}[] with no criterion name, so names are joined client-side from
// GET /categories/:categoryId/criteria (already used elsewhere for the
// review-writing form). There's no per-category sum constraint enforced by
// the backend for these weights (unlike the scoring config triplets), so the
// sum shown below is informational only.
export function CriterionWeightsForm({ categoryId }: CriterionWeightsFormProps) {
  const { data: criteria, isLoading: isCriteriaLoading } = useBusinessCriteriaQuery([categoryId]);
  const { data: weights, isLoading: isWeightsLoading } = useCriterionWeightsQuery(categoryId);
  const updateMutation = useUpdateCriterionWeightMutation(categoryId);

  const [draft, setDraft] = useState<Record<number, number>>({});

  const isLoading = isCriteriaLoading || isWeightsLoading;

  const weightFor = (criterionId: number) => {
    if (draft[criterionId] !== undefined) return draft[criterionId];
    return weights?.find((w) => w.criterionId === criterionId)?.weight ?? 0;
  };

  const onSave = async (criterionId: number) => {
    const weight = weightFor(criterionId);
    try {
      await updateMutation.mutateAsync({ criterionId, weight });
      toast.success('Weight saved.');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Unable to save weight.'));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-16 animate-pulse rounded-2xl bg-white shadow-xs ring-1 ring-slate-200" />
        ))}
      </div>
    );
  }

  if (!criteria || criteria.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-10 text-center shadow-xs ring-1 ring-slate-200">
        <p className="text-sm text-ink-700">This category has no criteria defined.</p>
      </div>
    );
  }

  const sum = criteria.reduce((total, criterion) => total + weightFor(criterion.criterionId), 0);

  return (
    <div className="space-y-3">
      <div className="rounded-3xl bg-white shadow-xs ring-1 ring-slate-200">
        {criteria.map((criterion) => (
          <div
            key={criterion.criterionId}
            className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4 last:border-0"
          >
            <div>
              <p className="text-sm font-medium text-ink-900">{criterion.name}</p>
              {criterion.description ? <p className="text-xs text-ink-500">{criterion.description}</p> : null}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={1}
                step={0.01}
                value={weightFor(criterion.criterionId)}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, [criterion.criterionId]: Number(event.target.value) }))
                }
                className="w-24 rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
              />
              <Button
                onClick={() => onSave(criterion.criterionId)}
                disabled={updateMutation.isPending}
                className="gap-1.5 py-1.5 text-xs"
              >
                <Save className="h-3.5 w-3.5" />
                Save
              </Button>
            </div>
          </div>
        ))}
      </div>
      <p className={`text-xs font-medium ${Math.abs(sum - 1) <= 0.01 ? 'text-emerald-600' : 'text-ink-500'}`}>
        Sum of weights: {sum.toFixed(2)}
      </p>
    </div>
  );
}
