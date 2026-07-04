import { Injectable, Optional } from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import { UserRepository } from '../../domain/repositories/user.repository'
import { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository'
import { InvalidPasswordException, UserNotFoundException } from '../../domain/exceptions/user.exceptions'

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    @Optional() private readonly bcryptService: typeof bcrypt = bcrypt,
  ) {}

  async execute({ userId, dto }: { userId: number; dto: { currentPassword: string; newPassword: string } }) {
    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw new UserNotFoundException()
    }

    const isCurrentPasswordValid = await this.bcryptService.compare(dto.currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      throw new InvalidPasswordException()
    }

    const passwordHash = await this.bcryptService.hash(dto.newPassword, 12)
    await this.userRepository.updatePassword(userId, passwordHash)
    await this.refreshTokenRepository.revokeAllByUserId(userId)

    return { message: 'Password changed successfully' }
  }
}
