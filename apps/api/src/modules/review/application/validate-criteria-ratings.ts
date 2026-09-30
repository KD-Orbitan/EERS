import { InvalidCriterionException, InvalidRatingException } from '../domain/exceptions/review.exceptions'

// An empty array represents an overall-only review; otherwise every distinct
// criterion across the business's categories must be rated exactly once.
export function validateCriteriaRatings(
  ratings: Array<{ criterionId: number; ratingValue: number }>,
  criteria: Array<{ criterionId: number }>,
) {
  if (ratings.length === 0) return
  const expected = new Set(criteria.map((item) => item.criterionId))
  const seen = new Set<number>()
  for (const rating of ratings) {
    if (!expected.has(rating.criterionId) || seen.has(rating.criterionId)) {
      throw new InvalidCriterionException('Each business criterion must be rated exactly once.')
    }
    if (!Number.isInteger(rating.ratingValue) || rating.ratingValue < 1 || rating.ratingValue > 5) {
      throw new InvalidRatingException()
    }
    seen.add(rating.criterionId)
  }
  if (seen.size !== expected.size) {
    throw new InvalidCriterionException('Please rate all business criteria or submit an overall-only review.')
  }
}
