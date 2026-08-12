import { Injectable } from '@nestjs/common'
import { BookmarkRepository } from '../../domain/repositories/bookmark.repository'
import { BookmarkAlreadyExistsException } from '../../domain/exceptions/bookmark.exceptions'
import { BusinessRepository } from '../../../business/domain/repositories/business.repository'
import { BusinessNotFoundException } from '../../../business/domain/exceptions/business.exceptions'

@Injectable()
export class AddBookmarkUseCase {
  constructor(
    private readonly bookmarkRepository: BookmarkRepository,
    private readonly businessRepository: BusinessRepository,
  ) {}

  async execute({ userId, businessId }: { userId: number; businessId: number }) {
    const business = await this.businessRepository.findById(businessId)
    if (!business) {
      throw new BusinessNotFoundException()
    }

    const existing = await this.bookmarkRepository.findByUserAndBusiness(userId, businessId)
    if (existing) {
      throw new BookmarkAlreadyExistsException()
    }

    const bookmark = await this.bookmarkRepository.create(userId, businessId)
    return { bookmarkId: bookmark.bookmarkId, businessId: bookmark.businessId }
  }
}
