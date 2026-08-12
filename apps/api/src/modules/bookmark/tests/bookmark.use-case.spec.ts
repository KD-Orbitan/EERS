import { AddBookmarkUseCase } from '../application/use-cases/add-bookmark.use-case'
import { RemoveBookmarkUseCase } from '../application/use-cases/remove-bookmark.use-case'
import { GetBookmarkStatusUseCase } from '../application/use-cases/get-bookmark-status.use-case'
import { BookmarkRepository } from '../domain/repositories/bookmark.repository'
import { BookmarkAlreadyExistsException, BookmarkNotFoundException } from '../domain/exceptions/bookmark.exceptions'
import { BusinessRepository } from '../../business/domain/repositories/business.repository'
import { BusinessNotFoundException } from '../../business/domain/exceptions/business.exceptions'

describe('AddBookmarkUseCase', () => {
  let bookmarkRepository: jest.Mocked<Pick<BookmarkRepository, 'findByUserAndBusiness' | 'create'>>
  let businessRepository: jest.Mocked<Pick<BusinessRepository, 'findById'>>
  let useCase: AddBookmarkUseCase

  beforeEach(() => {
    bookmarkRepository = { findByUserAndBusiness: jest.fn(), create: jest.fn() }
    businessRepository = { findById: jest.fn() }
    useCase = new AddBookmarkUseCase(bookmarkRepository as unknown as BookmarkRepository, businessRepository as unknown as BusinessRepository)
  })

  it('creates a bookmark when business exists and is not already bookmarked', async () => {
    businessRepository.findById.mockResolvedValue({ businessId: 1 } as any)
    bookmarkRepository.findByUserAndBusiness.mockResolvedValue(null)
    bookmarkRepository.create.mockResolvedValue({ bookmarkId: 10, userId: 5, businessId: 1, createdAt: new Date() })

    const result = await useCase.execute({ userId: 5, businessId: 1 })

    expect(result).toEqual({ bookmarkId: 10, businessId: 1 })
    expect(bookmarkRepository.create).toHaveBeenCalledWith(5, 1)
  })

  it('throws BUSINESS_NOT_FOUND when business does not exist', async () => {
    businessRepository.findById.mockResolvedValue(null)

    await expect(useCase.execute({ userId: 5, businessId: 1 })).rejects.toBeInstanceOf(BusinessNotFoundException)
    expect(bookmarkRepository.create).not.toHaveBeenCalled()
  })

  it('throws BOOKMARK_ALREADY_EXISTS when already bookmarked', async () => {
    businessRepository.findById.mockResolvedValue({ businessId: 1 } as any)
    bookmarkRepository.findByUserAndBusiness.mockResolvedValue({ bookmarkId: 10, userId: 5, businessId: 1, createdAt: new Date() })

    await expect(useCase.execute({ userId: 5, businessId: 1 })).rejects.toBeInstanceOf(BookmarkAlreadyExistsException)
    expect(bookmarkRepository.create).not.toHaveBeenCalled()
  })
})

describe('RemoveBookmarkUseCase', () => {
  let bookmarkRepository: jest.Mocked<Pick<BookmarkRepository, 'findByUserAndBusiness' | 'delete'>>
  let useCase: RemoveBookmarkUseCase

  beforeEach(() => {
    bookmarkRepository = { findByUserAndBusiness: jest.fn(), delete: jest.fn() }
    useCase = new RemoveBookmarkUseCase(bookmarkRepository as unknown as BookmarkRepository)
  })

  it('deletes the bookmark when it exists', async () => {
    bookmarkRepository.findByUserAndBusiness.mockResolvedValue({ bookmarkId: 10, userId: 5, businessId: 1, createdAt: new Date() })

    await useCase.execute({ userId: 5, businessId: 1 })

    expect(bookmarkRepository.delete).toHaveBeenCalledWith(10)
  })

  it('throws BOOKMARK_NOT_FOUND when bookmark does not exist', async () => {
    bookmarkRepository.findByUserAndBusiness.mockResolvedValue(null)

    await expect(useCase.execute({ userId: 5, businessId: 1 })).rejects.toBeInstanceOf(BookmarkNotFoundException)
    expect(bookmarkRepository.delete).not.toHaveBeenCalled()
  })
})

describe('GetBookmarkStatusUseCase', () => {
  let bookmarkRepository: jest.Mocked<Pick<BookmarkRepository, 'findByUserAndBusiness'>>
  let useCase: GetBookmarkStatusUseCase

  beforeEach(() => {
    bookmarkRepository = { findByUserAndBusiness: jest.fn() }
    useCase = new GetBookmarkStatusUseCase(bookmarkRepository as unknown as BookmarkRepository)
  })

  it('returns isBookmarked=true when a bookmark exists', async () => {
    bookmarkRepository.findByUserAndBusiness.mockResolvedValue({ bookmarkId: 10, userId: 5, businessId: 1, createdAt: new Date() })

    await expect(useCase.execute({ userId: 5, businessId: 1 })).resolves.toEqual({ isBookmarked: true })
  })

  it('returns isBookmarked=false when no bookmark exists', async () => {
    bookmarkRepository.findByUserAndBusiness.mockResolvedValue(null)

    await expect(useCase.execute({ userId: 5, businessId: 1 })).resolves.toEqual({ isBookmarked: false })
  })
})
