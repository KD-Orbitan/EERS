import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../infrastructure/database/prisma.service'
import { CriterionAlreadyExistsException } from '../../../criteria/domain/exceptions/criterion.exceptions'

@Injectable()
export class CreateCriterionUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(name: string, description?: string) {
    const existing = await this.prisma.criterion.findUnique({ where: { name } })
    if (existing) {
      throw new CriterionAlreadyExistsException()
    }

    const criterion = await this.prisma.criterion.create({ data: { name, description: description ?? null } })
    return { criterionId: criterion.criterionId, name: criterion.name, description: criterion.description ?? null }
  }
}
