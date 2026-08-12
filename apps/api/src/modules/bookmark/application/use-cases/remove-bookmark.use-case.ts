import { Injectable } from '@nestjs/common'
import { BookmarkRepository } from '../../domain/repositories/bookmark.repository'
import { BookmarkNotFoundException } from '../../domain/exceptions/bookmark.exceptions'

@Injectable()
export class RemoveBookmarkUseCase {
  constructor(private readonly bookmarkRepository: BookmarkRepository) {}

  async execute({ userId, businessId }: { userId: number; businessId: number }) {
    const bookmark = await this.bookmarkRepository.findByUserAndBusiness(userId, businessId)
    if (!bookmark) {
      throw new BookmarkNotFoundException()
    }

    await this.bookmarkRepository.delete(bookmark.bookmarkId)
  }
}
