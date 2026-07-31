import { IsNumber, Min } from 'class-validator'

export class UpdateScoringConfigDto {
  @IsNumber()
  bayesianC!: number

  @IsNumber()
  bayesianM!: number

  @IsNumber()
  fraudLambda1!: number

  @IsNumber()
  fraudLambda2!: number

  @IsNumber()
  fraudLambda3!: number

  @IsNumber()
  thetaDup!: number

  @IsNumber()
  lDup!: number

  @IsNumber()
  thetaSpam!: number

  @IsNumber()
  spamWindowHours!: number

  @IsNumber()
  thetaSus!: number

  @IsNumber()
  thetaReject!: number

  @IsNumber()
  trustAlpha!: number

  @IsNumber()
  trustBeta!: number

  @IsNumber()
  trustGamma!: number

  @IsNumber()
  suspiciousDelta!: number

  @IsNumber()
  timeDecayLambda!: number

  @IsNumber()
  sentimentLambda!: number

  @IsNumber()
  weightAlpha!: number

  @IsNumber()
  weightBeta!: number

  @IsNumber()
  weightGamma!: number

  @IsNumber()
  lMin!: number
}
