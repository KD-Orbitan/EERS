import { ArrayMinSize, IsArray, IsInt, IsNotEmpty, IsString, Length, Min, Max } from 'class-validator'

class CriterionRatingDto {
  @IsInt()
  @Min(1)
  @Max(5)
  ratingValue: number

  @IsInt()
  criterionId: number
}

export class CreateReviewDto {
  @IsInt()
  businessId: number

  @IsInt()
  @Min(1)
  @Max(5)
  overallRating: number

  @IsString()
  @Length(10, 4000)
  content: string

  @IsArray()
  @ArrayMinSize(1)
  criteriaRatings: CriterionRatingDto[]
}
