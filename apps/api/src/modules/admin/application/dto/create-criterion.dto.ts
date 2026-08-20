import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'

export class CreateCriterionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string

  @IsOptional()
  @IsString()
  description?: string
}
