import { Injectable, Optional } from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import { EmailAlreadyExistsException } from '../../domain/exceptions/auth.exceptions'
import { UserRepository } from '../../domain/repositories/user.repository'

@Injectable()
export class RegisterUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    @Optional() private readonly bcryptService: typeof bcrypt = bcrypt,
  ) {}

  async execute(dto: { name: string; email: string; password: string }) {
    const existingUser = await this.userRepository.findByEmail(dto.email)
    if (existingUser) {
      throw new EmailAlreadyExistsException()
    }

    const passwordHash = await this.bcryptService.hash(dto.password, 12)
    // const passwordHash = await bcrypt.hash(dto.password, 12)
    const role = await this.userRepository.findRoleByName('USER')

    const createdUser = await this.userRepository.create({
      name: dto.name,
      email: dto.email,
      password: passwordHash,
      roleId: role?.roleId,
      status: 'active',
    })

    return {
      userId: Number(createdUser.userId),
      name: createdUser.name,
      email: createdUser.email,
      role: 'USER' as const,
    }
  }
}
