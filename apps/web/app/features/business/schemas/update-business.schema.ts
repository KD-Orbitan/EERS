import { z } from 'zod';

export const updateBusinessSchema = z.object({
  name: z.string().min(1, 'Name is required.').max(150, 'Name must be 150 characters or fewer.'),
  description: z.string().optional(),
  phone: z.string().min(1, 'Phone is required.').max(20, 'Phone must be 20 characters or fewer.'),
  email: z.string().email('Please enter a valid email address.').optional().or(z.literal('')),
});

export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>;
