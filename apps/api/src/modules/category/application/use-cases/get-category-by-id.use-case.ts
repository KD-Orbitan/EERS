import { Injectable } from '@nestjs/common'
import { CategoryRepository } from '../../domain/repositories/category.repository'
import { CategoryNotFoundException } from '../../domain/exceptions/category.exceptions'

@Injectable()
export class GetCategoryByIdUseCase {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async execute(categoryId: number) {
    const category = await this.categoryRepository.findById(categoryId)
    if (!category) {
      throw new CategoryNotFoundException()
    }
    return category
  }
}
