export type ScoringConfig = {
  configId: number
  bayesianC: number
  bayesianM: number
  fraudLambda1: number
  fraudLambda2: number
  fraudLambda3: number
  thetaDup: number
  lDup: number
  thetaSpam: number
  spamWindowHours: number
  thetaSus: number
  thetaReject: number
  trustAlpha: number
  trustBeta: number
  trustGamma: number
  suspiciousDelta: number
  timeDecayLambda: number
  sentimentLambda: number
  weightAlpha: number
  weightBeta: number
  weightGamma: number
  lMin: number
}

export abstract class ScoringConfigPort {
  abstract getConfig(): Promise<ScoringConfig>
}
