import { IsOptional, IsString, Length, MinLength } from 'class-validator'

export class UpdateLocationDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  addressLine?: string

  @IsOptional()
  @IsString()
  @MinLength(1)
  @Length(1, 100)
  ward?: string

  @IsOptional()
  @IsString()
  @MinLength(1)
  @Length(1, 100)
  province?: string
}
