import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Max, Min } from 'class-validator'
import { Transform, Type } from 'class-transformer'

export class NotificationListQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string

  @IsOptional()
  // Read the original query value: implicit Boolean conversion turns "false" into true.
  @Transform(({ obj, key }) => {
    const value = obj[key]
    return value === 'true' ? true : value === 'false' ? false : value
  })
  @IsBoolean()
  isRead?: boolean

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
