import { IsOptional, IsInt, Min, Max, IsIn, IsString } from 'class-validator'
import { Type } from 'class-transformer'

export class BusinessReviewsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number

  @IsOptional()
  @IsString()
  @IsIn(['approved', 'pending', 'rejected', 'hidden'])
  status?: 'approved' | 'pending' | 'rejected' | 'hidden'

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20
}
