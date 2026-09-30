import { z } from 'zod';
import { criterionRatingSchema } from '@/features/review/schemas/create-review.schema';

export const updateReviewSchema = z.object({
  overallRating: z.number().int('Rating must be a whole number.').min(1, 'Please select an overall rating.').max(5, 'Rating must be at most 5.'),
  content: z.string().min(10, 'Please write at least 10 characters.'),
  criteriaRatings: z.array(criterionRatingSchema),
});

export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
