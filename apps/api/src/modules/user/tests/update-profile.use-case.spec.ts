import { UpdateProfileUseCase } from '../application/use-cases/update-profile.use-case'
import { UserRepository } from '../domain/repositories/user.repository'

describe('UpdateProfileUseCase', () => {
  let useCase: UpdateProfileUseCase
  let userRepository: jest.Mocked<Pick<UserRepository, 'findById' | 'updateProfile'>>

  beforeEach(() => {
    userRepository = {
      findById: jest.fn(),
      updateProfile: jest.fn(),
    }

    useCase = new UpdateProfileUseCase(userRepository as unknown as UserRepository)
  })

  it('updates name successfully', async () => {
    userRepository.findById.mockResolvedValue({ userId: 1, name: 'Old Name', email: 'a@example.com' } as any)
    userRepository.updateProfile.mockResolvedValue({ userId: 1, name: 'New Name' } as any)

    const result = await useCase.execute({ userId: 1, dto: { name: 'New Name' } })

    expect(userRepository.updateProfile).toHaveBeenCalledWith(1, 'New Name')
    expect(result).toEqual({ userId: 1, name: 'New Name' })
  })

  it('returns updated userId and name', async () => {
    userRepository.findById.mockResolvedValue({ userId: 7, name: 'Before', email: 'b@example.com' } as any)
    userRepository.updateProfile.mockResolvedValue({ userId: 7, name: 'After' } as any)

    const result = await useCase.execute({ userId: 7, dto: { name: 'After' } })

    expect(result.userId).toBe(7)
    expect(result.name).toBe('After')
  })
})
