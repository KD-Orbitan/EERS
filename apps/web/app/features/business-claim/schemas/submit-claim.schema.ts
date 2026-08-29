import { z } from 'zod';

export const submitClaimSchema = z.object({
  businessId: z.number().int().positive(),
  message: z.string().min(20, 'Message must be at least 20 characters').max(1000, 'Message must be at most 1000 characters'),
});

export type SubmitClaimInput = z.infer<typeof submitClaimSchema>;
