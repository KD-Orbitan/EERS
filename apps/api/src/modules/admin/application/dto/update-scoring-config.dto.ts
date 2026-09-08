import { IsInt, IsNumber, Min, Max } from 'class-validator'

export class UpdateScoringConfigDto {
  @IsNumber()
  @Min(0)
  @Max(1)
  bayesianC!: number

  @IsInt()
  @Min(1)
  bayesianM!: number

  @IsNumber()
  @Min(0)
  @Max(1)
  fraudLambda1!: number

  @IsNumber()
  @Min(0)
  @Max(1)
  fraudLambda2!: number

  @IsNumber()
  @Min(0)
  @Max(1)
  fraudLambda3!: number

  @IsNumber()
  @Min(0)
  @Max(1)
  thetaDup!: number

  @IsInt()
  @Min(0)
  lDup!: number

  @IsInt()
  @Min(1)
  thetaSpam!: number

  @IsInt()
  @Min(1)
  spamWindowHours!: number

  @IsNumber()
  @Min(0)
  @Max(1)
  thetaSus!: number

  @IsNumber()
  @Min(0)
  @Max(1)
  thetaReject!: number

  @IsNumber()
  @Min(0)
  @Max(1)
  trustAlpha!: number

  @IsNumber()
  @Min(0)
  @Max(1)
  trustBeta!: number

  @IsNumber()
  @Min(0)
  @Max(1)
  trustGamma!: number

  @IsNumber()
  @Min(0)
  @Max(1)
  suspiciousDelta!: number

  @IsNumber()
  @Min(0)
  timeDecayLambda!: number

  @IsNumber()
  @Min(0)
  sentimentLambda!: number

  @IsNumber()
  @Min(0)
  @Max(1)
  weightAlpha!: number

  @IsNumber()
  @Min(0)
  @Max(1)
  weightBeta!: number

  @IsNumber()
  @Min(0)
  @Max(1)
  weightGamma!: number

  @IsInt()
  @Min(0)
  lMin!: number
}
