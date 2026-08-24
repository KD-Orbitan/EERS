import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FilesInterceptor } from '@nestjs/platform-express'
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger'
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
import { GetRecentReviewsUseCase } from '../../application/use-cases/get-recent-reviews.use-case'
import { CreateReplyUseCase } from '../../application/use-cases/create-reply.use-case'
import { UploadReviewPhotosUseCase } from '../../application/use-cases/upload-review-photos.use-case'
import { DeleteReviewPhotoUseCase } from '../../application/use-cases/delete-review-photo.use-case'
import { AnalyzeReviewSentimentUseCase } from '../../application/use-cases/analyze-review-sentiment.use-case'
import { ReplyRepository } from '../../domain/repositories/reply.repository'
import { ReplyNotFoundException } from '../../domain/exceptions/review.exceptions'

@ApiTags('reviews')
@Controller('reviews')
export class ReviewController {
  constructor(
    private readonly createReviewUseCase: CreateReviewUseCase,
    private readonly updateReviewUseCase: UpdateReviewUseCase,
    private readonly deleteReviewUseCase: DeleteReviewUseCase,
    private readonly getReviewByIdUseCase: GetReviewByIdUseCase,
    private readonly getMyReviewsUseCase: GetMyReviewsUseCase,
    private readonly getRecentReviewsUseCase: GetRecentReviewsUseCase,
    private readonly createReplyUseCase: CreateReplyUseCase,
    private readonly uploadReviewPhotosUseCase: UploadReviewPhotosUseCase,
    private readonly deleteReviewPhotoUseCase: DeleteReviewPhotoUseCase,
    private readonly analyzeReviewSentimentUseCase: AnalyzeReviewSentimentUseCase,
    private readonly replyRepository: ReplyRepository,
  ) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async createReview(@CurrentUser() user: { userId: number }, @Body() dto: CreateReviewDto) {
    return this.createReviewUseCase.execute({ currentUserId: user.userId, dto })
  }

  @Get('my')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getMyReviews(@CurrentUser() user: { userId: number }, @Query() query: { page?: number; limit?: number }) {
    const { items, total } = await this.getMyReviewsUseCase.execute({ userId: user.userId, page: query.page, limit: query.limit })
    const page = Number(query.page) || 1
    const limit = Number(query.limit) || 20
    return { success: true, data: items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } }
  }

  @Get('recent')
  async getRecentReviews(@Query('limit') limit = '6') {
    const clampedLimit = Math.min(Number(limit) || 6, 20)
    return this.getRecentReviewsUseCase.execute({ limit: clampedLimit })
  }

  @Get(':reviewId')
  async getReviewById(@Param('reviewId', ParseIntPipe) reviewId: number, @CurrentUser() user?: { userId: number; role: string }) {
    return this.getReviewByIdUseCase.execute({ reviewId, currentUser: user })
  }

  @Patch(':reviewId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async updateReview(@CurrentUser() user: { userId: number; role: string }, @Param('reviewId', ParseIntPipe) reviewId: number, @Body() dto: UpdateReviewDto) {
    return this.updateReviewUseCase.execute({ reviewId, currentUserId: user.userId, currentUserRole: user.role, dto })
  }

  @Delete(':reviewId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async deleteReview(@CurrentUser() user: { userId: number; role: string }, @Param('reviewId', ParseIntPipe) reviewId: number) {
    await this.deleteReviewUseCase.execute({ reviewId, currentUserId: user.userId, currentUserRole: user.role })
  }

  @Post(':reviewId/photos')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('photos', 5))
  async uploadPhotos(
    @CurrentUser() user: { userId: number; role: string },
    @Param('reviewId', ParseIntPipe) reviewId: number,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.uploadReviewPhotosUseCase.execute({ reviewId, user, files })
  }

  @Delete(':reviewId/photos/:imageId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePhoto(
    @CurrentUser() user: { userId: number; role: string },
    @Param('reviewId', ParseIntPipe) reviewId: number,
    @Param('imageId', ParseIntPipe) imageId: number,
  ) {
    await this.deleteReviewPhotoUseCase.execute({ reviewId, imageId, user })
  }

  @Post(':reviewId/analyze-sentiment')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async analyzeSentiment(@Param('reviewId', ParseIntPipe) reviewId: number) {
    return this.analyzeReviewSentimentUseCase.execute({ reviewId })
  }

  @Post(':reviewId/reply')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async createReply(@CurrentUser() user: { userId: number; role: string }, @Param('reviewId', ParseIntPipe) reviewId: number, @Body() dto: CreateReplyDto) {
    return this.createReplyUseCase.execute({ reviewId, currentUserId: user.userId, currentUserRole: user.role, dto })
  }

  @Get(':reviewId/reply')
  async getReply(@Param('reviewId', ParseIntPipe) reviewId: number, @CurrentUser() user?: { userId: number; role: string }) {
    await this.getReviewByIdUseCase.execute({ reviewId, currentUser: user })
    const reply = await this.replyRepository.findByReviewId(reviewId)
    if (!reply) {
      throw new ReplyNotFoundException()
    }
    return {
      replyId: reply.replyId,
      content: reply.content,
      author: {
        userId: reply.userId,
        name: reply.userName,
      },
      createdAt: reply.createdAt.toISOString(),
      updatedAt: reply.updatedAt.toISOString(),
    }
  }
}
