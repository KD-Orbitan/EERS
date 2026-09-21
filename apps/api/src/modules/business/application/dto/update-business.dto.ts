import { Matches, MaxLength, IsOptional, IsString, Length, MinLength, IsEmail } from 'class-validator'

export class UpdateBusinessDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @Length(1, 150)
  name?: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Matches(/^$|^https?:\/\/[^\s/]+(?:[^\s]*)$/i, { message: 'website must be an HTTP or HTTPS URL' })
  website?: string

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  openingHours?: string

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  services?: string

  @IsOptional()
  @IsString()
  @MaxLength(200)
  priceRange?: string

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  amenities?: string

  @IsOptional()
  @IsString()
  @MaxLength(50000)
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
