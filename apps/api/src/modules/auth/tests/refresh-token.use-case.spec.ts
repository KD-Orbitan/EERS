import { RefreshTokenUseCase } from '../application/use-cases/refresh-token.use-case'
import { UserRepository } from '../domain/repositories/user.repository'
import { RefreshTokenRepository } from '../domain/repositories/refresh-token.repository'
import {
  InvalidRefreshTokenException,
  TokenExpiredException,
  UserBannedException,
} from '../domain/exceptions/auth.exceptions'

describe('RefreshTokenUseCase', () => {
  let refreshTokenRepository: jest.Mocked<Pick<RefreshTokenRepository, 'findActiveByToken'>>
  let userRepository: jest.Mocked<Pick<UserRepository, 'findById'>>
  let useCase: RefreshTokenUseCase

  beforeEach(() => {
    refreshTokenRepository = {
      findActiveByToken: jest.fn(),
    }
    userRepository = {
      findById: jest.fn(),
    }
    useCase = new RefreshTokenUseCase(
      refreshTokenRepository as unknown as RefreshTokenRepository,
      userRepository as unknown as UserRepository,
      { verify: jest.fn().mockReturnValue({ sub: 11 }), sign: jest.fn().mockReturnValue('fresh-token') } as any,
    )
  })

  it('returns new accessToken on valid cookie', async () => {
    refreshTokenRepository.findActiveByToken.mockResolvedValue({ tokenId: 3 } as any)
    userRepository.findById.mockResolvedValue({ userId: 11, status: 'active', role: { roleName: 'USER' } } as any)

    const result = await useCase.execute('valid-refresh-token')

    expect(result.accessToken).toBe('fresh-token')
  })

  it('throws INVALID_REFRESH_TOKEN on missing or invalid token', async () => {
    await expect(useCase.execute('')).rejects.toBeInstanceOf(InvalidRefreshTokenException)
  })

  it('throws TOKEN_EXPIRED on expired token', async () => {
    const verify = jest.fn().mockImplementation(() => {
      const error = new Error('jwt expired')
      ;(error as any).name = 'TokenExpiredError'
      throw error
    })
    useCase = new RefreshTokenUseCase(
      refreshTokenRepository as unknown as RefreshTokenRepository,
      userRepository as unknown as UserRepository,
      { verify, sign: jest.fn() } as any,
    )

    await expect(useCase.execute('expired-token')).rejects.toBeInstanceOf(TokenExpiredException)
  })
})
