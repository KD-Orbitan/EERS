import { ArrayMinSize, IsArray, IsInt, IsOptional, IsString, Length, Min, Max } from 'class-validator'

class CriterionRatingDto {
  @IsInt()
  @Min(1)
  @Max(5)
  ratingValue: number

  @IsInt()
  criterionId: number
}

export class UpdateReviewDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  overallRating?: number

  @IsOptional()
  @IsString()
  @Length(10, 4000)
  content?: string

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  criteriaRatings?: CriterionRatingDto[]
}
