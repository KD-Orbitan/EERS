import { z } from 'zod';

export const createReportSchema = z.object({
  reasonId: z.number({ error: 'Please select a reason' }).int().positive('Please select a reason'),
  description: z.string().max(1000, 'Description must be at most 1000 characters').optional(),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
