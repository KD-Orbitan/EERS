import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../infrastructure/database/prisma.service'
import { CriterionRepository } from '../../domain/repositories/criterion.repository'
import { CriterionEntity } from '../../domain/entities/criterion.entity'

@Injectable()
export class PrismaCriterionRepository extends CriterionRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findAll(): Promise<CriterionEntity[]> {
    const criteria = await this.prisma.criterion.findMany({
      orderBy: { criterionId: 'asc' },
    })

    return criteria.map((criterion) => ({
      criterionId: criterion.criterionId,
      name: criterion.name,
      description: criterion.description ?? null,
    }))
  }
}
