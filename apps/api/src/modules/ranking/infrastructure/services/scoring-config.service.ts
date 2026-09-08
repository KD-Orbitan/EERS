import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../infrastructure/database/prisma.service'

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

@Injectable()
export class ScoringConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async getConfig(): Promise<ScoringConfig> {
    const config = await this.prisma.scoringConfig.findFirst()
    if (!config) {
      throw new Error('Scoring configuration not found')
    }

    return {
      configId: Number(config.configId),
      bayesianC: Number(config.bayesianC),
      bayesianM: config.bayesianM,
      fraudLambda1: Number(config.fraudLambda1),
      fraudLambda2: Number(config.fraudLambda2),
      fraudLambda3: Number(config.fraudLambda3),
      thetaDup: Number(config.thetaDup),
      lDup: config.lDup,
      thetaSpam: config.thetaSpam,
      spamWindowHours: config.spamWindowHours,
      thetaSus: Number(config.thetaSus),
      thetaReject: Number(config.thetaReject),
      trustAlpha: Number(config.trustAlpha),
      trustBeta: Number(config.trustBeta),
      trustGamma: Number(config.trustGamma),
      suspiciousDelta: Number(config.suspiciousDelta),
      timeDecayLambda: Number(config.timeDecayLambda),
      sentimentLambda: Number(config.sentimentLambda),
      weightAlpha: Number(config.weightAlpha),
      weightBeta: Number(config.weightBeta),
      weightGamma: Number(config.weightGamma),
      lMin: config.lMin,
    }
  }
}
