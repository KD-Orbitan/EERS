import { RegisterUseCase } from '../application/use-cases/register.use-case'
import { UserRepository } from '../../user/domain/repositories/user.repository'
import { EmailAlreadyExistsException } from '../domain/exceptions/auth.exceptions'

describe('RegisterUseCase', () => {
  let userRepository: jest.Mocked<Pick<UserRepository, 'findByEmail' | 'findRoleByName' | 'create'>>
  let useCase: RegisterUseCase

  beforeEach(() => {
    userRepository = {
      findByEmail: jest.fn(),
      findRoleByName: jest.fn(),
      create: jest.fn(),
    }
    useCase = new RegisterUseCase(userRepository as unknown as UserRepository)
  })

  it('creates user with hashed password', async () => {
    userRepository.findByEmail.mockResolvedValue(null)
    userRepository.findRoleByName.mockResolvedValue({ roleId: 1, roleName: 'USER' })
    userRepository.create.mockResolvedValue({
      userId: 10,
      name: 'Jane',
      email: 'jane@test.com',
      roleName: 'USER',
      password: 'hashed-password',
    } as any)

    const result = await useCase.execute({
      name: 'Jane',
      email: 'jane@test.com',
      password: 'secret1234',
    })

    expect(result.userId).toBe(10)
    expect(result.email).toBe('jane@test.com')
    expect(result.role).toBe('USER')
    expect(userRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'jane@test.com',
        password: expect.any(String),
      }),
    )
    expect(userRepository.create.mock.calls[0][0].password).not.toBe('secret1234')
  })

  it('throws EMAIL_ALREADY_EXISTS if email already exists', async () => {
    userRepository.findByEmail.mockResolvedValue({ userId: 1 } as any)

    await expect(
      useCase.execute({ name: 'Jane', email: 'jane@test.com', password: 'secret1234' }),
    ).rejects.toBeInstanceOf(EmailAlreadyExistsException)
  })
})
