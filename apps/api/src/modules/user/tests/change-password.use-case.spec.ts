import * as bcrypt from 'bcrypt'
import { ChangePasswordUseCase } from '../application/use-cases/change-password.use-case'
import { UserRepository } from '../domain/repositories/user.repository'
import { RefreshTokenRepository } from '../domain/repositories/refresh-token.repository'

describe('ChangePasswordUseCase', () => {
  let useCase: ChangePasswordUseCase
  let userRepository: jest.Mocked<Pick<UserRepository, 'findById' | 'updatePassword'>>
  let refreshTokenRepository: jest.Mocked<Pick<RefreshTokenRepository, 'revokeAllByUserId'>>

  beforeEach(() => {
    userRepository = {
      findById: jest.fn(),
      updatePassword: jest.fn(),
    }
    refreshTokenRepository = {
      revokeAllByUserId: jest.fn(),
    }

    useCase = new ChangePasswordUseCase(
      userRepository as unknown as UserRepository,
      refreshTokenRepository as unknown as RefreshTokenRepository,
      bcrypt,
    )
  })

  it('updates password hash', async () => {
    userRepository.findById.mockResolvedValue({ userId: 1, password: await bcrypt.hash('old-password', 10) } as any)
    userRepository.updatePassword.mockResolvedValue({ userId: 1 } as any)
    refreshTokenRepository.revokeAllByUserId.mockResolvedValue(undefined)

    await useCase.execute({ userId: 1, dto: { currentPassword: 'old-password', newPassword: 'new-password' } })

    expect(userRepository.updatePassword).toHaveBeenCalledWith(1, expect.any(String))
  })

  it('revokes all refresh tokens for user', async () => {
    userRepository.findById.mockResolvedValue({ userId: 5, password: await bcrypt.hash('old-password', 10) } as any)
    userRepository.updatePassword.mockResolvedValue({ userId: 5 } as any)
    refreshTokenRepository.revokeAllByUserId.mockResolvedValue(undefined)

    await useCase.execute({ userId: 5, dto: { currentPassword: 'old-password', newPassword: 'new-password' } })

    expect(refreshTokenRepository.revokeAllByUserId).toHaveBeenCalledWith(5)
  })

  it('throws INVALID_PASSWORD on wrong current password', async () => {
    userRepository.findById.mockResolvedValue({ userId: 2, password: await bcrypt.hash('correct-password', 10) } as any)

    await expect(
      useCase.execute({ userId: 2, dto: { currentPassword: 'wrong-password', newPassword: 'new-password' } }),
    ).rejects.toMatchObject({ code: 'INVALID_PASSWORD' })
  })
})
