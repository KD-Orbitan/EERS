import { LoginUseCase } from '../application/use-cases/login.use-case'
import { UserRepository } from '../../user/domain/repositories/user.repository'
import { RefreshTokenRepository } from '../domain/repositories/refresh-token.repository'
import { InvalidCredentialsException, UserBannedException } from '../domain/exceptions/auth.exceptions'

describe('LoginUseCase', () => {
  let userRepository: jest.Mocked<Pick<UserRepository, 'findByEmail' | 'findById'>>
  let refreshTokenRepository: jest.Mocked<Pick<RefreshTokenRepository, 'create'>>
  let useCase: LoginUseCase

  beforeEach(() => {
    userRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
    }
    refreshTokenRepository = {
      create: jest.fn(),
    }
    useCase = new LoginUseCase(
      userRepository as unknown as UserRepository,
      refreshTokenRepository as unknown as RefreshTokenRepository,
      { sign: jest.fn().mockReturnValue('token') } as any,
      undefined,
      {
        compare: jest.fn().mockResolvedValue(true),
        hash: jest.fn().mockResolvedValue('hashed-refresh'),
      } as any,
      { create: jest.fn(), $transaction: undefined } as any,
    )
  })

  it('returns accessToken on valid credentials', async () => {
    userRepository.findByEmail.mockResolvedValue({
      userId: 1,
      name: 'Jane',
      email: 'jane@test.com',
      password: '$2b$12$abc',
      role: { roleName: 'USER' },
      status: 'active',
    } as any)
    refreshTokenRepository.create.mockResolvedValue({} as any)

    const result = await useCase.execute({ email: 'jane@test.com', password: 'secret1234' })

    expect(result.accessToken).toBe('token')
    expect(result.user.userId).toBe(1)
  })

  it('throws INVALID_CREDENTIALS on wrong password', async () => {
    userRepository.findByEmail.mockResolvedValue({
      userId: 1,
      password: '$2b$12$abc',
      status: 'active',
      role: { roleName: 'USER' },
    } as any)
    ;(useCase as any).bcryptService.compare = jest.fn().mockResolvedValue(false)

    await expect(
      useCase.execute({ email: 'jane@test.com', password: 'wrong' }),
    ).rejects.toBeInstanceOf(InvalidCredentialsException)
  })

  it('throws INVALID_CREDENTIALS on unknown email', async () => {
    userRepository.findByEmail.mockResolvedValue(null)

    await expect(
      useCase.execute({ email: 'missing@test.com', password: 'secret1234' }),
    ).rejects.toBeInstanceOf(InvalidCredentialsException)
  })

  it('throws USER_BANNED if user is banned', async () => {
    userRepository.findByEmail.mockResolvedValue({
      userId: 1,
      password: '$2b$12$abc',
      status: 'banned',
      role: { roleName: 'USER' },
    } as any)

    await expect(
      useCase.execute({ email: 'jane@test.com', password: 'secret1234' }),
    ).rejects.toBeInstanceOf(UserBannedException)
  })
})
