import type { ScoringConfigInput } from '../schemas/scoring-config.schema';

// Medium mirrors prisma/seed.ts. Levels describe moderation strictness, not a
// promised ranking outcome. Shared parameters stay fixed to keep comparisons clear.
const medium: ScoringConfigInput = {
  bayesianC: 0.63, bayesianM: 10,
  fraudLambda1: 0.4, fraudLambda2: 0.4, fraudLambda3: 0.2,
  thetaDup: 0.85, lDup: 20, thetaSpam: 5, spamWindowHours: 24,
  thetaSus: 0.3, thetaReject: 0.7, suspiciousDelta: 0.3,
  trustAlpha: 0.5, trustBeta: 0.3, trustGamma: 0.2,
  weightAlpha: 0.4, weightBeta: 0.4, weightGamma: 0.2,
  timeDecayLambda: 0.01, sentimentLambda: 0, lMin: 10,
};

export const SCORING_PROFILES = [
  {
    id: 'low', label: 'Low', title: 'Lighter controls',
    description: 'Fewer reviews flagged; suspicious reviews retain more influence. Rankings respond faster with fewer reviews.',
    values: { ...medium, bayesianM: 5, thetaDup: 0.9, thetaSpam: 8, thetaSus: 0.4, thetaReject: 0.8, suspiciousDelta: 0.5, weightAlpha: 0.3, weightBeta: 0.5 },
  },
  {
    id: 'medium', label: 'Medium', title: 'Balanced controls',
    description: 'The standard starting point. Balances fraud checks, reviewer trust and ranking stability.',
    values: medium,
  },
  {
    id: 'high', label: 'High', title: 'Stricter controls',
    description: 'More reviews flagged for potential fraud; suspicious reviews have less influence. Rankings need more evidence to move.',
    values: { ...medium, bayesianM: 20, thetaDup: 0.8, thetaSpam: 3, thetaSus: 0.25, thetaReject: 0.6, suspiciousDelta: 0.15, weightAlpha: 0.5, weightBeta: 0.3 },
  },
] satisfies { id: string; label: string; title: string; description: string; values: ScoringConfigInput }[];

export function matchingScoringProfile(values: Partial<ScoringConfigInput>) {
  return SCORING_PROFILES.find((profile) =>
    (Object.keys(medium) as (keyof ScoringConfigInput)[]).every((key) =>
      typeof values[key] === 'number' && Math.abs(values[key]! - profile.values[key]) < 1e-8,
    ),
  );
}
