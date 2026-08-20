import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../infrastructure/database/prisma.service'
import { CategoryAlreadyExistsException } from '../../../category/domain/exceptions/category.exceptions'

@Injectable()
export class CreateCategoryUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(categoryName: string) {
    const existing = await this.prisma.category.findUnique({ where: { categoryName } })
    if (existing) {
      throw new CategoryAlreadyExistsException()
    }

    const category = await this.prisma.category.create({ data: { categoryName } })
    return { categoryId: category.categoryId, categoryName: category.categoryName }
  }
}
