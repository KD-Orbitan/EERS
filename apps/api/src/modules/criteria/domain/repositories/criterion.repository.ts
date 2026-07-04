import { CriterionEntity } from '../entities/criterion.entity'

export abstract class CriterionRepository {
  abstract findAll(): Promise<CriterionEntity[]>
}
