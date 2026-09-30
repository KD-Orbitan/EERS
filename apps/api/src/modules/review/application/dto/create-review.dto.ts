import { IsArray, IsInt, IsString, Length, Min, Max, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

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
  @ValidateNested({ each: true })
  @Type(() => CriterionRatingDto)
  criteriaRatings: CriterionRatingDto[]
}
