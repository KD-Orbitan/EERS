import { IsString, MinLength } from 'class-validator'

export class RejectReviewDto {
  @IsString()
  @MinLength(10)
  reason!: string
}
