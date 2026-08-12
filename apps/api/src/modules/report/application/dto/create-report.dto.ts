import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator'
import { Type } from 'class-transformer'

export class CreateReportDto {
  @Type(() => Number)
  @IsInt()
  reviewId!: number

  @Type(() => Number)
  @IsInt()
  reasonId!: number

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string
}
