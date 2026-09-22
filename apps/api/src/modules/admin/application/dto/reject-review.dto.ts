import { Transform } from 'class-transformer'
import { IsString, MinLength, MaxLength } from 'class-validator'

export class RejectReviewDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  reason!: string
}
