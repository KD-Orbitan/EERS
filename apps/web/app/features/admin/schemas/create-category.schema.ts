import { z } from 'zod';

export const createCategorySchema = z.object({
  categoryName: z.string().min(1, 'Category name is required').max(100, 'Category name must be at most 100 characters'),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
