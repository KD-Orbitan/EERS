import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../infrastructure/database/prisma.service'

@Injectable()
export class ScoringConfigUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async getConfig() {
    const config = await this.prisma.scoringConfig.findFirst()
    return config ? { ...config, bayesianC: Number(config.bayesianC), fraudLambda1: Number(config.fraudLambda1), fraudLambda2: Number(config.fraudLambda2), fraudLambda3: Number(config.fraudLambda3), thetaDup: Number(config.thetaDup), thetaSus: Number(config.thetaSus), thetaReject: Number(config.thetaReject), trustAlpha: Number(config.trustAlpha), trustBeta: Number(config.trustBeta), trustGamma: Number(config.trustGamma), suspiciousDelta: Number(config.suspiciousDelta), timeDecayLambda: Number(config.timeDecayLambda), sentimentLambda: Number(config.sentimentLambda), weightAlpha: Number(config.weightAlpha), weightBeta: Number(config.weightBeta), weightGamma: Number(config.weightGamma), bayesianM: config.bayesianM, lDup: config.lDup, thetaSpam: config.thetaSpam, spamWindowHours: config.spamWindowHours, lMin: config.lMin } : null
  }

  async updateConfig(data: any) {
    return this.prisma.scoringConfig.updateMany({ where: {}, data })
  }
}
