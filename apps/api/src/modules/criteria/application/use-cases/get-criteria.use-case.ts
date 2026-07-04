import { Injectable } from '@nestjs/common'
import { CriterionRepository } from '../../domain/repositories/criterion.repository'

@Injectable()
export class GetCriteriaUseCase {
  constructor(private readonly criterionRepository: CriterionRepository) {}

  async execute() {
    return this.criterionRepository.findAll()
  }
}
