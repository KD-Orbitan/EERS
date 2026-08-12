import { BookmarkEntity } from '../entities/bookmark.entity'

export interface BookmarkListItem {
  bookmarkId: number
  business: {
    businessId: number
    name: string
    avgRating: number
    status: string
  }
  createdAt: string
}

export abstract class BookmarkRepository {
  abstract findByUserAndBusiness(userId: number, businessId: number): Promise<BookmarkEntity | null>
  abstract create(userId: number, businessId: number): Promise<BookmarkEntity>
  abstract delete(bookmarkId: number): Promise<void>
  abstract listByUser(userId: number, page: number, limit: number): Promise<{ items: BookmarkListItem[]; total: number }>
}
