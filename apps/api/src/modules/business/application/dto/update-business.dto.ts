import { IsOptional, IsString, Length, MinLength, IsEmail } from 'class-validator'

export class UpdateBusinessDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @Length(1, 150)
  name?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsString()
  @MinLength(1)
  @Length(1, 20)
  phone?: string

  @IsOptional()
  @IsEmail()
  email?: string
}
