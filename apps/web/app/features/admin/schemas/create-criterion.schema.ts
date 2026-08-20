import { z } from 'zod';

export const createCriterionSchema = z.object({
  name: z.string().min(1, 'Criterion name is required').max(100, 'Criterion name must be at most 100 characters'),
  description: z.string().max(500, 'Description must be at most 500 characters').optional().or(z.literal('')),
});

export type CreateCriterionInput = z.infer<typeof createCriterionSchema>;
