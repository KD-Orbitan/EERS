import { Test, TestingModule } from '@nestjs/testing'
import { AuthController } from '../presentation/controllers/auth.controller'
import { RegisterUseCase } from '../application/use-cases/register.use-case'
import { LoginUseCase } from '../application/use-cases/login.use-case'
import { GoogleAuthUseCase } from '../application/use-cases/google-auth.use-case'
import { RefreshTokenUseCase } from '../application/use-cases/refresh-token.use-case'
import { LogoutUseCase } from '../application/use-cases/logout.use-case'
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard'

describe('AuthController', () => {
  let controller: AuthController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: RegisterUseCase, useValue: { execute: jest.fn() } },
        { provide: LoginUseCase, useValue: { execute: jest.fn() } },
        { provide: JwtAuthGuard, useValue: { canActivate: jest.fn(() => true) } },
        { provide: GoogleAuthUseCase, useValue: { execute: jest.fn() } },
        { provide: RefreshTokenUseCase, useValue: { execute: jest.fn() } },
        { provide: LogoutUseCase, useValue: { execute: jest.fn() } },
      ],
    }).compile()

    controller = module.get<AuthController>(AuthController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
