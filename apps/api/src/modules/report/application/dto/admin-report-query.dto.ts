import { IsIn, IsInt, IsOptional, IsString, MaxLength, Max, Min } from 'class-validator'
import { Type } from 'class-transformer'

export class AdminReportQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string

  @IsOptional()
  @IsIn(['pending', 'reviewing', 'resolved', 'rejected'])
  status?: 'pending' | 'reviewing' | 'resolved' | 'rejected'

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
