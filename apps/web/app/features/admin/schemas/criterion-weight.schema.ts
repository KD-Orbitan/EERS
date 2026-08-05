import { z } from 'zod';

export const criterionWeightSchema = z.object({
  weight: z.number().min(0, 'Weight must be at least 0').max(1, 'Weight must be at most 1'),
});

export type CriterionWeightInput = z.infer<typeof criterionWeightSchema>;
