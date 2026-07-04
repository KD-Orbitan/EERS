import { IsString, Length, MinLength } from 'class-validator'

export class CreateLocationDto {
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
