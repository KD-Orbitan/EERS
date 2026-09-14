'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { useState } from 'react';
import { SCORING_PROFILES, matchingScoringProfile } from '../constants/scoring-profiles';
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
      { name: 'bayesianM', label: 'Prior strength (m)', step: 1, int: true },
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
    description: 'Trust uses log(1 + approved reviews), log(1 + account age), and moderator-rejected reviews. Automatic fraud labels do not penalize trust. Weights must sum to 1.',
    fields: [
      { name: 'trustAlpha', label: 'Review count weight (α)', step: 0.001 },
      { name: 'trustBeta', label: 'Account age weight (β)', step: 0.001 },
      { name: 'trustGamma', label: 'Moderation rejection penalty (γ)', step: 0.001 },
    ],
  },
  {
    title: 'Review Weighting',
    description: 'W = Status factor * (alpha * Trust + beta + gamma * TimeDecay). Rejected reviews have zero influence. Weights must sum to 1.',
    fields: [
      { name: 'weightAlpha', label: 'Trust weight (α)', step: 0.001 },
      { name: 'weightBeta', label: 'Base weight (β)', step: 0.001 },
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
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ScoringConfigInput>({
    resolver: zodResolver(scoringConfigSchema),
    defaultValues: config,
  });

  const values = useWatch({ control });
  const pending = isLoading || isSubmitting;
  const profile = matchingScoringProfile(values);

  const fraudSum = (values.fraudLambda1 ?? 0) + (values.fraudLambda2 ?? 0) + (values.fraudLambda3 ?? 0);
  const trustSum = (values.trustAlpha ?? 0) + (values.trustBeta ?? 0) + (values.trustGamma ?? 0);
  const weightSum = (values.weightAlpha ?? 0) + (values.weightBeta ?? 0) + (values.weightGamma ?? 0);

  return (
    <form onInvalidCapture={() => setAdvancedOpen(true)} onSubmit={handleSubmit(onSubmit, () => setAdvancedOpen(true))} className="space-y-4">
      <section className="rounded-3xl bg-ink-50 p-6 shadow-xs ring-1 ring-ink-200" aria-labelledby="scoring-profile-heading">
        <h2 id="scoring-profile-heading" className="text-base font-bold text-ink-900">Scoring profile</h2>
        <p className="mt-1 text-sm text-ink-600">Choose a level of moderation strictness. Selecting a profile fills all parameters below; you can fine-tune them before saving.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3" role="group" aria-label="Moderation strictness profiles">
          {SCORING_PROFILES.map((item) => (
            <button key={item.id} type="button" disabled={pending} aria-pressed={profile?.id === item.id}
              onClick={() => reset({ ...item.values }, { keepDefaultValues: true })}
              className={`rounded-2xl border-2 p-4 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-50 ${profile?.id === item.id ? 'border-primary-600 bg-primary-50' : 'border-ink-200 hover:border-primary-400'}`}>
              <span className="block font-bold text-ink-900">{item.label} {item.id === 'medium' ? <span className="text-xs font-medium text-primary-600">(Default)</span> : null}</span>
              <span className="mt-1 block text-sm font-semibold text-ink-800">{item.title}</span>
              <span className="mt-2 block text-xs leading-relaxed text-ink-600">{item.description}</span>
            </button>
          ))}
        </div>
        <p className="mt-4 text-sm font-medium text-ink-800" role="status">Current form: {profile ? `${profile.label} — ${profile.title}` : 'Custom — manually adjusted parameters'}</p>
        <p className="mt-1 text-xs text-ink-500">Save Config applies these settings for the next ranking recalculation.</p>
        <button type="button" disabled={pending} onClick={() => reset(config)} className="mt-3 text-sm font-medium text-primary-600 underline disabled:opacity-50">Restore saved configuration</button>
      </section>
      <details open={advancedOpen} onToggle={(event) => setAdvancedOpen(event.currentTarget.open)} className="rounded-3xl border border-ink-200 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-ink-800">Advanced settings — fine-tune parameters</summary>
        <fieldset disabled={pending} className="mt-4 space-y-4">
      {GROUPS.map((group) => (
        <div key={group.title} className="rounded-3xl bg-ink-50 p-6 shadow-xs ring-1 ring-ink-200">
          <h2 className="font-sans text-base font-bold text-ink-900">{group.title}</h2>
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
                  className="w-full rounded-lg border border-ink-300 px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
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
        </fieldset>
      </details>

      {errors.root?.message ? <p className="text-sm text-red-600">{errors.root.message}</p> : null}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving...' : 'Save Config'}
        </Button>
      </div>
    </form>
  );
}
