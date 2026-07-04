import { Test, TestingModule } from '@nestjs/testing'
import { CriteriaController } from '../presentation/controllers/criteria.controller'
import { GetCriteriaUseCase } from '../application/use-cases/get-criteria.use-case'

describe('CriteriaController', () => {
  let controller: CriteriaController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CriteriaController],
      providers: [{ provide: GetCriteriaUseCase, useValue: { execute: jest.fn() } }],
    }).compile()

    controller = module.get<CriteriaController>(CriteriaController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
