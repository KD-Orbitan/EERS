import { z } from 'zod';

export const criterionRatingSchema = z.object({
  criterionId: z.number(),
  ratingValue: z.number().int('Rating must be a whole number.').min(1, 'Rating must be at least 1.').max(5, 'Rating must be at most 5.'),
});

export const createReviewSchema = z.object({
  businessId: z.number(),
  overallRating: z.number().int('Rating must be a whole number.').min(1, 'Please select an overall rating.').max(5, 'Rating must be at most 5.'),
  content: z.string().min(10, 'Please write at least 10 characters.'),
  criteriaRatings: z.array(criterionRatingSchema).min(1, 'Please rate at least one criterion.'),
});

export type CriterionRatingInput = z.infer<typeof criterionRatingSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
