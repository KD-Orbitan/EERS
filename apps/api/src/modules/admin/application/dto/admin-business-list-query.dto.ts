import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator'
import { Type } from 'class-transformer'

export class AdminBusinessListQueryDto {
  @IsOptional()
  @IsIn(['pending', 'approved', 'rejected', 'hidden'])
  status?: 'pending' | 'approved' | 'rejected' | 'hidden'

  @IsOptional()
  @IsString()
  search?: string

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
