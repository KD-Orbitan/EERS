import { ValidationPipe } from '@nestjs/common'
import { CreateReviewDto } from '../application/dto/create-review.dto'
import { UpdateReviewDto } from '../application/dto/update-review.dto'

describe('Review rating request validation', () => {
  const pipe = new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })
  const base = { businessId: 1, overallRating: 4, content: 'A good experience.' }

  it.each([CreateReviewDto, UpdateReviewDto])('accepts an empty criteria array for %p', async (metatype) => {
    const payload = metatype === CreateReviewDto ? { ...base, criteriaRatings: [] } : { criteriaRatings: [] }
    await expect(pipe.transform(payload, { type: 'body', metatype })).resolves.toMatchObject({ criteriaRatings: [] })
  })

  it.each([0, 6, 2.5, '4', null])('rejects invalid nested score %p', async (ratingValue) => {
    for (const metatype of [CreateReviewDto, UpdateReviewDto]) {
      const payload = { ...(metatype === CreateReviewDto ? base : {}), criteriaRatings: [{ criterionId: 1, ratingValue }] }
      await expect(pipe.transform(payload, { type: 'body', metatype })).rejects.toThrow()
    }
  })
})
