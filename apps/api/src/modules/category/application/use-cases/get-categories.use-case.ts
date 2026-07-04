import { Injectable } from '@nestjs/common'
import { CategoryRepository } from '../../domain/repositories/category.repository'

@Injectable()
export class GetCategoriesUseCase {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async execute() {
    const categories = await this.categoryRepository.findAll()
    return categories
  }
}
