import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../../../common/decorators/current-user.decorator'
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard'
import { PaginationQueryDto } from '../../application/dto/pagination-query.dto'
import { GetMyBookmarksUseCase } from '../../application/use-cases/get-my-bookmarks.use-case'

@ApiTags('bookmarks')
@Controller('bookmarks')
export class MyBookmarksController {
  constructor(private readonly getMyBookmarksUseCase: GetMyBookmarksUseCase) {}

  @Get('my')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getMyBookmarks(@CurrentUser() user: { userId: number }, @Query() query: PaginationQueryDto) {
    const page = query.page ?? 1
    const limit = query.limit ?? 20
    const { items, total } = await this.getMyBookmarksUseCase.execute({ userId: user.userId, page, limit })
    return { success: true, data: items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } }
  }
}
