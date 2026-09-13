import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../../../infrastructure/database/prisma.service'
import { AppException } from '../../../../common/exceptions/app.exception'

@Injectable()
export class ManageTaxonomyUseCase {
  constructor(private readonly prisma: PrismaService) {}

  private rethrow(error: unknown, entity: 'CATEGORY' | 'CRITERION'): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') throw new AppException(`${entity}_NOT_FOUND`, 404, 'This item no longer exists.')
      if (error.code === 'P2002') throw new AppException(`${entity}_ALREADY_EXISTS`, 409, 'This name is already in use.')
      if (error.code === 'P2003') throw new AppException(`${entity}_IN_USE`, 409, 'This item is in use and cannot be deleted.')
    }
    throw error
  }

  async updateCategory(categoryId: number, categoryName: string) {
    try {
      return await this.prisma.category.update({ where: { categoryId }, data: { categoryName: categoryName.trim() } })
    } catch (error) { this.rethrow(error, 'CATEGORY') }
  }

  async updateCriterion(criterionId: number, name: string, description?: string) {
    try {
      return await this.prisma.criterion.update({ where: { criterionId }, data: {
        name: name.trim(), ...(description !== undefined ? { description: description?.trim() || null } : {}),
      } })
    } catch (error) { this.rethrow(error, 'CRITERION') }
  }

  async deleteCategory(categoryId: number) {
    try {
      await this.prisma.$transaction(async (tx) => {
        if (!await tx.category.findUnique({ where: { categoryId } })) throw new AppException('CATEGORY_NOT_FOUND', 404, 'Category not found.')
        if (await tx.businessCategory.count({ where: { categoryId } })) {
          throw new AppException('CATEGORY_IN_USE', 409, 'This category is assigned to businesses. Remove those assignments before deleting it.')
        }
        await tx.criterionWeight.deleteMany({ where: { categoryId } })
        await tx.categoryCriterion.deleteMany({ where: { categoryId } })
        await tx.category.delete({ where: { categoryId } })
      })
      return { categoryId, deleted: true }
    } catch (error) { this.rethrow(error, 'CATEGORY') }
  }

  async deleteCriterion(criterionId: number) {
    try {
      await this.prisma.$transaction(async (tx) => {
        if (!await tx.criterion.findUnique({ where: { criterionId } })) throw new AppException('CRITERION_NOT_FOUND', 404, 'Criterion not found.')
        if (await tx.reviewCriterion.count({ where: { criterionId } })) {
          throw new AppException('CRITERION_IN_USE', 409, 'This criterion has review ratings and cannot be deleted. You can edit its name or description.')
        }
        if (await tx.categoryCriterion.count({ where: { criterionId } })) {
          throw new AppException('CRITERION_IN_USE', 409, 'This criterion is assigned to categories. Remove those assignments before deleting it.')
        }
        await tx.criterionWeight.deleteMany({ where: { criterionId } })
        await tx.criterion.delete({ where: { criterionId } })
      })
      return { criterionId, deleted: true }
    } catch (error) { this.rethrow(error, 'CRITERION') }
  }
}
