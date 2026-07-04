import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetCategoriesUseCase } from '../../application/use-cases/get-categories.use-case'
import { GetCategoryByIdUseCase } from '../../application/use-cases/get-category-by-id.use-case'
import { GetCriteriaByCategoryUseCase } from '../../application/use-cases/get-criteria-by-category.use-case'

export interface CriterionItem {
  criterionId: number
  name: string
  description: string | null
}

@ApiTags('categories')
@Controller('categories')
export class CategoryController {
  constructor(
    private readonly getCategoriesUseCase: GetCategoriesUseCase,
    private readonly getCategoryByIdUseCase: GetCategoryByIdUseCase,
    private readonly getCriteriaByCategoryUseCase: GetCriteriaByCategoryUseCase,
  ) {}

  @Get()
  async getCategories() {
    return this.getCategoriesUseCase.execute()
  }

  @Get(':categoryId')
  async getCategoryById(@Param('categoryId', ParseIntPipe) categoryId: number) {
    return this.getCategoryByIdUseCase.execute(categoryId)
  }

  @Get(':categoryId/criteria')
  async getCriteriaByCategory(@Param('categoryId', ParseIntPipe) categoryId: number) {
    return this.getCriteriaByCategoryUseCase.execute(categoryId)
  }
}
