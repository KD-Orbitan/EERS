import { IsArray, IsEmail, IsOptional, IsString, Length, MinLength, ValidateNested, ArrayMinSize } from 'class-validator'
import { Type } from 'class-transformer'

class CreateLocationDto {
  @IsString()
  @MinLength(1)
  addressLine: string

  @IsString()
  @MinLength(1)
  @Length(1, 100)
  ward: string

  @IsString()
  @MinLength(1)
  @Length(1, 100)
  province: string
}

export class CreateBusinessDto {
  @IsString()
  @MinLength(1)
  @Length(1, 150)
  name: string

  @IsOptional()
  @IsString()
  description?: string

  @IsString()
  @MinLength(1)
  @Length(1, 20)
  phone: string

  @IsOptional()
  @IsEmail()
  email?: string

  @IsArray()
  @ArrayMinSize(1)
  categoryIds: number[]

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateLocationDto)
  locations: CreateLocationDto[]
}
