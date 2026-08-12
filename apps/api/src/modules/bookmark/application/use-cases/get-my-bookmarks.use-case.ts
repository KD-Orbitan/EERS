import { Injectable } from '@nestjs/common'
import { BookmarkRepository } from '../../domain/repositories/bookmark.repository'

@Injectable()
export class GetMyBookmarksUseCase {
  constructor(private readonly bookmarkRepository: BookmarkRepository) {}

  async execute({ userId, page = 1, limit = 20 }: { userId: number; page?: number; limit?: number }) {
    return this.bookmarkRepository.listByUser(userId, page, limit)
  }
}
