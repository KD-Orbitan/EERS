import { IsString, MinLength } from 'class-validator'

export class RejectBusinessDto {
  @IsString()
  @MinLength(10)
  reason!: string
}
