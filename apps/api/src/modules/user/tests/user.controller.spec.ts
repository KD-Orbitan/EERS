import { Test, TestingModule } from '@nestjs/testing'
import { UserController } from '../presentation/controllers/user.controller'
import { UpdateProfileUseCase } from '../application/use-cases/update-profile.use-case'
import { ChangePasswordUseCase } from '../application/use-cases/change-password.use-case'
import { GetUserProfileUseCase } from '../application/use-cases/get-user-profile.use-case'
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard'

describe('UserController', () => {
  let controller: UserController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        { provide: GetUserProfileUseCase, useValue: { execute: jest.fn() } },
        { provide: UpdateProfileUseCase, useValue: { execute: jest.fn() } },
        { provide: ChangePasswordUseCase, useValue: { execute: jest.fn() } },
        { provide: JwtAuthGuard, useValue: { canActivate: jest.fn(() => true) } },
      ],
    }).compile()

    controller = module.get<UserController>(UserController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
