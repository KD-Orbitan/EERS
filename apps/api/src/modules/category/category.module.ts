import { Module } from '@nestjs/common'
import { InfrastructureModule } from '../../infrastructure/infrastructure.module'
import { CategoryController } from './presentation/controllers/category.controller'
import { GetCategoriesUseCase } from './application/use-cases/get-categories.use-case'
import { GetCategoryByIdUseCase } from './application/use-cases/get-category-by-id.use-case'
import { GetCriteriaByCategoryUseCase } from './application/use-cases/get-criteria-by-category.use-case'
import { CategoryRepository } from './domain/repositories/category.repository'
import { PrismaCategoryRepository } from './infrastructure/repositories/prisma-category.repository'

@Module({
  imports: [InfrastructureModule],
  controllers: [CategoryController],
  providers: [
    {
      provide: CategoryRepository,
      useClass: PrismaCategoryRepository,
    },
    GetCategoriesUseCase,
    GetCategoryByIdUseCase,
    GetCriteriaByCategoryUseCase,
  ],
  exports: [GetCriteriaByCategoryUseCase],
})
export class CategoryModule {}
