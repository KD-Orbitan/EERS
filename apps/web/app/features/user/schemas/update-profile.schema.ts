import { z } from 'zod';

// PATCH /users/profile only accepts `name` (see UpdateProfileDto in apps/api) —
// there is no email-change endpoint, so this schema deliberately omits email.
export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be at most 100 characters'),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
