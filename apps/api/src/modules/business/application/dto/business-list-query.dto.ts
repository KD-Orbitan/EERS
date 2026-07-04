import { IsOptional, IsString, IsIn, IsInt, Min, Max } from 'class-validator'
import { Type } from 'class-transformer'

export class BusinessListQueryDto {
  @IsOptional()
  @IsString()
  search?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoryId?: number

  @IsOptional()
  @IsString()
  province?: string

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

  @IsOptional()
  @IsString()
  @IsIn(['avgRating', 'createdAt', 'reviewCount'])
  sortBy?: string = 'avgRating'

  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc'
}
