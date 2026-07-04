import { CategoryEntity } from '../entities/category.entity'
import { CriterionItem } from '../dtos/criterion-item.dto'

export abstract class CategoryRepository {
  abstract findAll(): Promise<CategoryEntity[]>
  abstract findById(categoryId: number): Promise<CategoryEntity | null>
  abstract findCriteriaByCategory(categoryId: number): Promise<CriterionItem[]>
}
