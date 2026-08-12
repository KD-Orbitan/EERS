import { Injectable } from '@nestjs/common'
import { BookmarkRepository } from '../../domain/repositories/bookmark.repository'

@Injectable()
export class GetBookmarkStatusUseCase {
  constructor(private readonly bookmarkRepository: BookmarkRepository) {}

  async execute({ userId, businessId }: { userId: number; businessId: number }) {
    const bookmark = await this.bookmarkRepository.findByUserAndBusiness(userId, businessId)
    return { isBookmarked: bookmark !== null }
  }
}
