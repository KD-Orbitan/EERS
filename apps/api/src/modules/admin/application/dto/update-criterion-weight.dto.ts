import { IsNumber } from 'class-validator'

export class UpdateCriterionWeightDto {
  @IsNumber()
  weight!: number
}
