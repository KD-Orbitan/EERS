import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator'
import { Type } from 'class-transformer'

export class AdminReviewListQueryDto {
  @IsOptional()
  @IsIn(['pending', 'approved', 'rejected', 'hidden'])
  status?: 'pending' | 'approved' | 'rejected' | 'hidden'

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
