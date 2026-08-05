import { z } from 'zod';

export const locationSchema = z.object({
  addressLine: z.string().min(1, 'Address is required.'),
  ward: z.string().min(1, 'Ward is required.').max(100, 'Ward must be 100 characters or fewer.'),
  province: z.string().min(1, 'Province is required.').max(100, 'Province must be 100 characters or fewer.'),
});

export type LocationInput = z.infer<typeof locationSchema>;
