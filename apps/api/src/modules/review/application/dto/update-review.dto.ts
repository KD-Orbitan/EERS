import { IsArray, IsInt, IsOptional, IsString, Length, Min, Max, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

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
  @ValidateNested({ each: true })
  @Type(() => CriterionRatingDto)
  criteriaRatings?: CriterionRatingDto[]
}
