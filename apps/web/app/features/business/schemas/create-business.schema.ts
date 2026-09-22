import { z } from 'zod';
import { parseHours, parsePrice } from '@/lib/business-profile-fields';

export const createLocationSchema = z.object({
  addressLine: z.string().min(1, 'Address is required.'),
  ward: z.string().min(1, 'Ward is required.').max(100, 'Ward must be 100 characters or fewer.'),
  province: z.string().min(1, 'Province is required.').max(100, 'Province must be 100 characters or fewer.'),
});

export const createBusinessSchema = z.object({
  name: z.string().min(1, 'Name is required.').max(150, 'Name must be 150 characters or fewer.'),
  website: z.string().trim().max(500).refine((value) => !value || /^https?:\/\/[^\s/]+[^\s]*$/i.test(value), 'Enter an HTTP or HTTPS URL.').optional(),
  openingHours: z.string().trim().max(1000).refine(value => !value.startsWith('Monday: ') || parseHours(value) !== null, 'Choose valid opening and closing times for every open day.').optional(),
  services: z.string().trim().max(2000).optional(),
  priceRange: z.string().trim().max(200).refine(value => { if (!value.includes(' VND / ')) return true; const price = parsePrice(value); return price !== null && Number(price.min) <= Number(price.max) && Number(price.max) <= 1000000000000; }, 'Enter both prices, with the maximum at least as large as the minimum.').optional(),
  amenities: z.string().trim().max(1000).optional(),
  description: z.string().max(50000, 'Description is too long. Please shorten your article.').optional(),
  phone: z.string().min(1, 'Phone is required.').max(20, 'Phone must be 20 characters or fewer.'),
  email: z.string().email('Please enter a valid email address.').optional().or(z.literal('')),
  categoryIds: z.array(z.number()).min(1, 'Select at least one category.'),
  locations: z.array(createLocationSchema).min(1, 'Add at least one location.'),
});

export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type CreateBusinessInput = z.infer<typeof createBusinessSchema>;
