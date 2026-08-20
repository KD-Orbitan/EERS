import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../infrastructure/database/prisma.service'
import { CategoryNotFoundException, AssignmentNotFoundException } from '../../../category/domain/exceptions/category.exceptions'
import { CriterionNotFoundException } from '../../../criteria/domain/exceptions/criterion.exceptions'

@Injectable()
export class RemoveCriterionUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(categoryId: number, criterionId: number) {
    const category = await this.prisma.category.findUnique({ where: { categoryId } })
    if (!category) {
      throw new CategoryNotFoundException()
    }

    const criterion = await this.prisma.criterion.findUnique({ where: { criterionId } })
    if (!criterion) {
      throw new CriterionNotFoundException()
    }

    const existing = await this.prisma.categoryCriterion.findUnique({
      where: { categoryId_criterionId: { categoryId, criterionId } },
    })
    if (!existing) {
      throw new AssignmentNotFoundException()
    }

    await this.prisma.categoryCriterion.delete({
      where: { categoryId_criterionId: { categoryId, criterionId } },
    })
  }
}
