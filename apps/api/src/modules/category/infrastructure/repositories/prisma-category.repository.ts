import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../infrastructure/database/prisma.service'
import { CategoryRepository } from '../../domain/repositories/category.repository'
import { CategoryEntity } from '../../domain/entities/category.entity'
import { CriterionItem } from '../../domain/dtos/criterion-item.dto'

@Injectable()
export class PrismaCategoryRepository extends CategoryRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findAll(): Promise<CategoryEntity[]> {
    const categories = await this.prisma.category.findMany({
      orderBy: { categoryId: 'asc' },
    })
    return categories.map((category) => ({
      categoryId: category.categoryId,
      categoryName: category.categoryName,
    }))
  }

  async findById(categoryId: number): Promise<CategoryEntity | null> {
    const category = await this.prisma.category.findUnique({
      where: { categoryId },
    })
    if (!category) {
      return null
    }
    return {
      categoryId: category.categoryId,
      categoryName: category.categoryName,
    }
  }

  async findCriteriaByCategory(categoryId: number): Promise<CriterionItem[]> {
    const criteria = await this.prisma.criterion.findMany({
      where: {
        categoryCriteria: {
          some: {
            categoryId,
          },
        },
      },
      orderBy: { criterionId: 'asc' },
    })
    return criteria.map((criterion) => ({
      criterionId: criterion.criterionId,
      name: criterion.name,
      description: criterion.description ?? null,
    }))
  }
}
