import { Test, TestingModule } from '@nestjs/testing'
import { CategoryController } from '../presentation/controllers/category.controller'
import { GetCategoriesUseCase } from '../application/use-cases/get-categories.use-case'
import { GetCategoryByIdUseCase } from '../application/use-cases/get-category-by-id.use-case'
import { GetCriteriaByCategoryUseCase } from '../application/use-cases/get-criteria-by-category.use-case'

describe('CategoryController', () => {
  let controller: CategoryController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoryController],
      providers: [
        { provide: GetCategoriesUseCase, useValue: { execute: jest.fn() } },
        { provide: GetCategoryByIdUseCase, useValue: { execute: jest.fn() } },
        { provide: GetCriteriaByCategoryUseCase, useValue: { execute: jest.fn() } },
      ],
    }).compile()

    controller = module.get<CategoryController>(CategoryController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
