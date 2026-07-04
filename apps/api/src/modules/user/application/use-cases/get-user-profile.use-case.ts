import { Injectable } from '@nestjs/common'
import { UserRepository } from '../../domain/repositories/user.repository'
import { UserNotFoundException } from '../../domain/exceptions/user.exceptions'

@Injectable()
export class GetUserProfileUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(userId: number) {
    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw new UserNotFoundException()
    }

    return {
      userId: user.userId,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl ?? null,
      status: user.status,
      createdAt: user.createdAt,
    }
  }
}
