import { Module } from '@nestjs/common'
import { InfrastructureModule } from '../../infrastructure/infrastructure.module'
import { CriteriaController } from './presentation/controllers/criteria.controller'
import { GetCriteriaUseCase } from './application/use-cases/get-criteria.use-case'
import { CriterionRepository } from './domain/repositories/criterion.repository'
import { PrismaCriterionRepository } from './infrastructure/repositories/prisma-criterion.repository'

@Module({
  imports: [InfrastructureModule],
  controllers: [CriteriaController],
  providers: [
    {
      provide: CriterionRepository,
      useClass: PrismaCriterionRepository,
    },
    GetCriteriaUseCase,
  ],
})
export class CriteriaModule {}
