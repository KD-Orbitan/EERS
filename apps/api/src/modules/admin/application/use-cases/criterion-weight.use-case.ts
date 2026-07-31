import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../infrastructure/database/prisma.service'

@Injectable()
export class CriterionWeightUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async getWeights(categoryId: number) {
    const weights = await this.prisma.criterionWeight.findMany({
      where: { categoryId },
    })
    return weights.map((item) => ({
      categoryId: item.categoryId,
      criterionId: item.criterionId,
      weight: Number(item.weight),
    }))
  }

  async updateWeight(categoryId: number, criterionId: number, weight: number) {
    await this.prisma.criterionWeight.upsert({
      where: { categoryId_criterionId: { categoryId, criterionId } },
      create: { categoryId, criterionId, weight },
      update: { weight },
    })
  }
}
