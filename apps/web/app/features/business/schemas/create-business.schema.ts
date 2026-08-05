import { z } from 'zod';

export const createLocationSchema = z.object({
  addressLine: z.string().min(1, 'Address is required.'),
  ward: z.string().min(1, 'Ward is required.').max(100, 'Ward must be 100 characters or fewer.'),
  province: z.string().min(1, 'Province is required.').max(100, 'Province must be 100 characters or fewer.'),
});

export const createBusinessSchema = z.object({
  name: z.string().min(1, 'Name is required.').max(150, 'Name must be 150 characters or fewer.'),
  description: z.string().optional(),
  phone: z.string().min(1, 'Phone is required.').max(20, 'Phone must be 20 characters or fewer.'),
  email: z.string().email('Please enter a valid email address.').optional().or(z.literal('')),
  categoryIds: z.array(z.number()).min(1, 'Select at least one category.'),
  locations: z.array(createLocationSchema).min(1, 'Add at least one location.'),
});

export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type CreateBusinessInput = z.infer<typeof createBusinessSchema>;
