import { IsInt, IsString, MaxLength, MinLength } from 'class-validator'
import { Type } from 'class-transformer'

export class SubmitClaimDto {
  @Type(() => Number)
  @IsInt()
  businessId!: number

  @IsString()
  @MinLength(20)
  @MaxLength(1000)
  message!: string
}
