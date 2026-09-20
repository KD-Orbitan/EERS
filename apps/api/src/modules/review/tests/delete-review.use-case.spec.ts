import { DeleteReviewUseCase } from '../application/use-cases/delete-review.use-case'
import { ReviewRepository } from '../domain/repositories/review.repository'
import { ReviewNotFoundException } from '../domain/exceptions/review.exceptions'

describe('DeleteReviewUseCase', () => {
  const repository = {
    findById: jest.fn(),
    softDeleteReviewWithAudit: jest.fn(),
  }
  const useCase = new DeleteReviewUseCase(repository as unknown as ReviewRepository)
  const input = { reviewId: 10, currentUserId: 2, currentUserRole: 'USER' }

  beforeEach(() => {
    jest.resetAllMocks()
    repository.findById.mockResolvedValue({ reviewId: 10, writerUserId: 2, deletedAt: null })
  })

  it('deletes with the actor audit record after checking ownership', async () => {
    await useCase.execute(input)
    expect(repository.softDeleteReviewWithAudit).toHaveBeenCalledWith(10, 2)
  })

  it('does not delete another user’s review', async () => {
    await expect(useCase.execute({ ...input, currentUserId: 3 })).rejects.toThrow('Forbidden')
    expect(repository.softDeleteReviewWithAudit).not.toHaveBeenCalled()
  })

  it('allows an administrator to delete another user’s review', async () => {
    await useCase.execute({ ...input, currentUserId: 3, currentUserRole: 'ADMIN' })
    expect(repository.softDeleteReviewWithAudit).toHaveBeenCalledWith(10, 3)
  })

  it('rejects an already deleted review', async () => {
    repository.findById.mockResolvedValue({ deletedAt: new Date() })
    await expect(useCase.execute(input)).rejects.toBeInstanceOf(ReviewNotFoundException)
    expect(repository.softDeleteReviewWithAudit).not.toHaveBeenCalled()
  })
})
