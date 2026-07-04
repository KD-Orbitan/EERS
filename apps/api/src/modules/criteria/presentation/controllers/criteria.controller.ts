import { Controller, Get } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetCriteriaUseCase } from '../../application/use-cases/get-criteria.use-case'

@ApiTags('criteria')
@Controller('criteria')
export class CriteriaController {
  constructor(private readonly getCriteriaUseCase: GetCriteriaUseCase) {}

  @Get()
  async getCriteria() {
    return this.getCriteriaUseCase.execute()
  }
}
