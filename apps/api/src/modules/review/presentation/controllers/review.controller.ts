import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../../../common/decorators/current-user.decorator'
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../../../common/guards/roles.guard'
import { Roles } from '../../../../common/decorators/roles.decorator'
import { CreateReviewDto } from '../../application/dto/create-review.dto'
import { UpdateReviewDto } from '../../application/dto/update-review.dto'
import { CreateReplyDto } from '../../application/dto/create-reply.dto'
import { CreateReviewUseCase } from '../../application/use-cases/create-review.use-case'
import { UpdateReviewUseCase } from '../../application/use-cases/update-review.use-case'
import { DeleteReviewUseCase } from '../../application/use-cases/delete-review.use-case'
import { GetReviewByIdUseCase } from '../../application/use-cases/get-review-by-id.use-case'
import { GetMyReviewsUseCase } from '../../application/use-cases/get-my-reviews.use-case'
import { CreateReplyUseCase } from '../../application/use-cases/create-reply.use-case'

@ApiTags('reviews')
@Controller('reviews')
export class ReviewController {
  constructor(
    private readonly createReviewUseCase: CreateReviewUseCase,
    private readonly updateReviewUseCase: UpdateReviewUseCase,
    private readonly deleteReviewUseCase: DeleteReviewUseCase,
    private readonly getReviewByIdUseCase: GetReviewByIdUseCase,
    private readonly getMyReviewsUseCase: GetMyReviewsUseCase,
    private readonly createReplyUseCase: CreateReplyUseCase,
  ) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('USER', 'BUSINESS_OWNER', 'ADMIN')
  async createReview(@CurrentUser() user: { userId: number }, @Body() dto: CreateReviewDto) {
    return this.createReviewUseCase.execute({ currentUserId: user.userId, dto })
  }

  @Get('my')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('USER', 'BUSINESS_OWNER', 'ADMIN')
  async getMyReviews(@CurrentUser() user: { userId: number }, @Query() query: { page?: number; limit?: number }) {
    return this.getMyReviewsUseCase.execute({ userId: user.userId, page: query.page, limit: query.limit })
  }

  @Get(':reviewId')
  async getReviewById(@Param('reviewId', ParseIntPipe) reviewId: number, @CurrentUser() user?: { userId: number; role: string }) {
    return this.getReviewByIdUseCase.execute({ reviewId, currentUser: user })
  }

  @Patch(':reviewId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('USER', 'BUSINESS_OWNER', 'ADMIN')
  async updateReview(@CurrentUser() user: { userId: number; role: string }, @Param('reviewId', ParseIntPipe) reviewId: number, @Body() dto: UpdateReviewDto) {
    return this.updateReviewUseCase.execute({ reviewId, currentUserId: user.userId, currentUserRole: user.role, dto })
  }

  @Delete(':reviewId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('USER', 'BUSINESS_OWNER', 'ADMIN')
  async deleteReview(@CurrentUser() user: { userId: number; role: string }, @Param('reviewId', ParseIntPipe) reviewId: number) {
    await this.deleteReviewUseCase.execute({ reviewId, currentUserId: user.userId, currentUserRole: user.role })
  }

  @Post(':reviewId/reply')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUSINESS_OWNER', 'ADMIN')
  async createReply(@CurrentUser() user: { userId: number; role: string }, @Param('reviewId', ParseIntPipe) reviewId: number, @Body() dto: CreateReplyDto) {
    return this.createReplyUseCase.execute({ reviewId, currentUserId: user.userId, currentUserRole: user.role, dto })
  }

  @Get(':reviewId/reply')
  async getReply(@Param('reviewId', ParseIntPipe) reviewId: number) {
    return { reviewId }
  }
}
