import { Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../../../common/decorators/current-user.decorator'
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard'
import { AddBookmarkUseCase } from '../../application/use-cases/add-bookmark.use-case'
import { RemoveBookmarkUseCase } from '../../application/use-cases/remove-bookmark.use-case'
import { GetBookmarkStatusUseCase } from '../../application/use-cases/get-bookmark-status.use-case'

@ApiTags('bookmarks')
@Controller('businesses')
export class BookmarkController {
  constructor(
    private readonly addBookmarkUseCase: AddBookmarkUseCase,
    private readonly removeBookmarkUseCase: RemoveBookmarkUseCase,
    private readonly getBookmarkStatusUseCase: GetBookmarkStatusUseCase,
  ) {}

  @Post(':businessId/bookmark')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async addBookmark(@CurrentUser() user: { userId: number }, @Param('businessId', ParseIntPipe) businessId: number) {
    return this.addBookmarkUseCase.execute({ userId: user.userId, businessId })
  }

  @Delete(':businessId/bookmark')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeBookmark(@CurrentUser() user: { userId: number }, @Param('businessId', ParseIntPipe) businessId: number) {
    await this.removeBookmarkUseCase.execute({ userId: user.userId, businessId })
  }

  @Get(':businessId/bookmark')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getBookmarkStatus(@CurrentUser() user: { userId: number }, @Param('businessId', ParseIntPipe) businessId: number) {
    return this.getBookmarkStatusUseCase.execute({ userId: user.userId, businessId })
  }
}
