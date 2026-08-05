import { z } from 'zod';

const TOLERANCE = 0.001;

// Mirrors the exact fields + sum constraints enforced by
// AdminController.updateScoringConfig on the backend: fraudLambda1-3,
// weightAlpha/Beta/Gamma, and trustAlpha/Beta/Gamma must each sum to ~1.
export const scoringConfigSchema = z
  .object({
    bayesianC: z.number().min(0),
    bayesianM: z.number().int().min(0),
    fraudLambda1: z.number().min(0).max(1),
    fraudLambda2: z.number().min(0).max(1),
    fraudLambda3: z.number().min(0).max(1),
    thetaDup: z.number().min(0).max(1),
    lDup: z.number().int().min(0),
    thetaSpam: z.number().int().min(0),
    spamWindowHours: z.number().int().min(0),
    thetaSus: z.number().min(0).max(1),
    thetaReject: z.number().min(0).max(1),
    trustAlpha: z.number().min(0).max(1),
    trustBeta: z.number().min(0).max(1),
    trustGamma: z.number().min(0).max(1),
    suspiciousDelta: z.number().min(0).max(1),
    timeDecayLambda: z.number().min(0),
    sentimentLambda: z.number().min(0),
    weightAlpha: z.number().min(0).max(1),
    weightBeta: z.number().min(0).max(1),
    weightGamma: z.number().min(0).max(1),
    lMin: z.number().int().min(0),
  })
  .refine((data) => Math.abs(data.fraudLambda1 + data.fraudLambda2 + data.fraudLambda3 - 1) <= TOLERANCE, {
    message: 'Fraud weights (λ1 + λ2 + λ3) must sum to 1',
    path: ['fraudLambda3'],
  })
  .refine((data) => Math.abs(data.trustAlpha + data.trustBeta + data.trustGamma - 1) <= TOLERANCE, {
    message: 'Trust weights (α + β + γ) must sum to 1',
    path: ['trustGamma'],
  })
  .refine((data) => Math.abs(data.weightAlpha + data.weightBeta + data.weightGamma - 1) <= TOLERANCE, {
    message: 'Review weights (α + β + γ) must sum to 1',
    path: ['weightGamma'],
  });

export type ScoringConfigInput = z.infer<typeof scoringConfigSchema>;
