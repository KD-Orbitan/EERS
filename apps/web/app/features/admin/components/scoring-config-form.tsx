'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { scoringConfigSchema, ScoringConfigInput } from '@/features/admin/schemas/scoring-config.schema';
import { ScoringConfig } from '@/features/admin/types/admin.type';

interface ScoringConfigFormProps {
  config: ScoringConfig;
  onSubmit: (data: ScoringConfigInput) => void | Promise<void>;
  isLoading?: boolean;
}

interface FieldSpec {
  name: keyof ScoringConfigInput;
  label: string;
  step: number;
  int?: boolean;
}

// Field grouping + labels come from the real ranking pipeline in
// docs/DECISIONS.md D-012 (fraud detection, trust score, review weighting,
// Bayesian adjustment) — not the fictional "5 weights" the Phase 7 prompt
// assumed. Precision requirements (Decimal(4,3) in the schema, i.e. 3
// decimal places) don't fit range sliders well, so this uses plain number
// inputs instead of the prompt's suggested sliders.
const GROUPS: { title: string; description: string; fields: FieldSpec[] }[] = [
  {
    title: 'Bayesian Adjustment',
    description: 'Smooths a business’s score toward a prior mean until it has enough reviews (D-012 Step 6).',
    fields: [
      { name: 'bayesianC', label: 'Prior mean (C)', step: 0.01 },
      { name: 'bayesianM', label: 'Minimum review threshold (m)', step: 1, int: true },
    ],
  },
  {
    title: 'Fraud Score Weights',
    description: 'FraudScore = λ1·Duplicate + λ2·Spam + λ3·(1 − Trust). Must sum to 1.',
    fields: [
      { name: 'fraudLambda1', label: 'Duplicate signal (λ1)', step: 0.001 },
      { name: 'fraudLambda2', label: 'Spam signal (λ2)', step: 0.001 },
      { name: 'fraudLambda3', label: 'Distrust signal (λ3)', step: 0.001 },
    ],
  },
  {
    title: 'Duplicate & Spam Detection',
    description: 'Thresholds used to compute the duplicate and spam fraud signals.',
    fields: [
      { name: 'thetaDup', label: 'Duplicate similarity threshold (θ_dup)', step: 0.001 },
      { name: 'lDup', label: 'Min. length for duplicate check (l_dup)', step: 1, int: true },
      { name: 'thetaSpam', label: 'Spam review count threshold (θ_spam)', step: 1, int: true },
      { name: 'spamWindowHours', label: 'Spam detection window (hours)', step: 1, int: true },
    ],
  },
  {
    title: 'Fraud Classification',
    description: 'FraudScore ≥ θ_reject → rejected. θ_sus ≤ FraudScore < θ_reject → suspicious.',
    fields: [
      { name: 'thetaSus', label: 'Suspicious threshold (θ_sus)', step: 0.001 },
      { name: 'thetaReject', label: 'Auto-reject threshold (θ_reject)', step: 0.001 },
      { name: 'suspiciousDelta', label: 'Suspicious review weight (δ)', step: 0.001 },
    ],
  },
  {
    title: 'Trust Score Weights',
    description: 'Trust(u) = sigmoid(α·log(1+reviews) + β·accountAge − γ·flags). Must sum to 1.',
    fields: [
      { name: 'trustAlpha', label: 'Review count weight (α)', step: 0.001 },
      { name: 'trustBeta', label: 'Account age weight (β)', step: 0.001 },
      { name: 'trustGamma', label: 'Flagged review penalty (γ)', step: 0.001 },
    ],
  },
  {
    title: 'Review Weighting',
    description: 'W = α·Trust + β·Status + γ·TimeDecay, used before Bayesian aggregation. Must sum to 1.',
    fields: [
      { name: 'weightAlpha', label: 'Trust weight (α)', step: 0.001 },
      { name: 'weightBeta', label: 'Status weight (β)', step: 0.001 },
      { name: 'weightGamma', label: 'Time-decay weight (γ)', step: 0.001 },
    ],
  },
  {
    title: 'Other',
    description: 'Time decay rate, sentiment adjustment (unused — sentiment is always 0 in MVP), and minimum review length.',
    fields: [
      { name: 'timeDecayLambda', label: 'Time decay rate (λ_decay)', step: 0.0001 },
      { name: 'sentimentLambda', label: 'Sentiment weight (λ_sentiment)', step: 0.001 },
      { name: 'lMin', label: 'Minimum review length (characters)', step: 1, int: true },
    ],
  },
];

function SumIndicator({ label, value }: { label: string; value: number }) {
  const isValid = Math.abs(value - 1) <= 0.001;
  return (
    <p className={`mt-2 text-xs font-medium ${isValid ? 'text-emerald-600' : 'text-red-600'}`}>
      {label}: {value.toFixed(3)} {isValid ? '✓' : '(must equal 1.000)'}
    </p>
  );
}

export function ScoringConfigForm({ config, onSubmit, isLoading }: ScoringConfigFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ScoringConfigInput>({
    resolver: zodResolver(scoringConfigSchema),
    defaultValues: config,
  });

  const values = watch();
  const pending = isLoading || isSubmitting;

  const fraudSum = (values.fraudLambda1 ?? 0) + (values.fraudLambda2 ?? 0) + (values.fraudLambda3 ?? 0);
  const trustSum = (values.trustAlpha ?? 0) + (values.trustBeta ?? 0) + (values.trustGamma ?? 0);
  const weightSum = (values.weightAlpha ?? 0) + (values.weightBeta ?? 0) + (values.weightGamma ?? 0);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {GROUPS.map((group) => (
        <div key={group.title} className="rounded-3xl bg-white p-6 shadow-xs ring-1 ring-slate-200">
          <h2 className="font-serif text-base font-bold text-ink-900">{group.title}</h2>
          <p className="mt-1 text-xs text-ink-500">{group.description}</p>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {group.fields.map((field) => (
              <div key={field.name}>
                <label className="mb-1 block text-sm font-medium text-ink-700" htmlFor={field.name}>
                  {field.label}
                </label>
                <input
                  id={field.name}
                  type="number"
                  step={field.step}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                  {...register(field.name, { valueAsNumber: true })}
                />
                {errors[field.name]?.message ? (
                  <p className="mt-1 text-xs text-red-600">{errors[field.name]?.message}</p>
                ) : null}
              </div>
            ))}
          </div>

          {group.title === 'Fraud Score Weights' ? <SumIndicator label="Sum" value={fraudSum} /> : null}
          {group.title === 'Trust Score Weights' ? <SumIndicator label="Sum" value={trustSum} /> : null}
          {group.title === 'Review Weighting' ? <SumIndicator label="Sum" value={weightSum} /> : null}
        </div>
      ))}

      {errors.root?.message ? <p className="text-sm text-red-600">{errors.root.message}</p> : null}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving...' : 'Save Config'}
        </Button>
      </div>
    </form>
  );
}
