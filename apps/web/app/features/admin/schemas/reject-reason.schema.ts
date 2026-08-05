import { z } from 'zod';

export const rejectReasonSchema = z.object({
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(500, 'Reason must be at most 500 characters'),
});

export type RejectReasonInput = z.infer<typeof rejectReasonSchema>;
