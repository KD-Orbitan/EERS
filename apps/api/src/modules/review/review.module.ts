import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { InfrastructureModule } from '../../infrastructure/infrastructure.module'
import { ReviewController } from './presentation/controllers/review.controller'
import { ReplyController } from './presentation/controllers/reply.controller'
import { BusinessReviewController } from './presentation/controllers/business-review.controller'
import { ReviewRepository } from './domain/repositories/review.repository'
import { ReplyRepository } from './domain/repositories/reply.repository'
import { ReviewImageRepository } from './domain/repositories/review-image.repository'
import { PrismaReviewRepository } from './infrastructure/repositories/prisma-review.repository'
import { PrismaReplyRepository } from './infrastructure/repositories/prisma-reply.repository'
import { PrismaReviewImageRepository } from './infrastructure/repositories/prisma-review-image.repository'
import { CreateReviewUseCase } from './application/use-cases/create-review.use-case'
import { UpdateReviewUseCase } from './application/use-cases/update-review.use-case'
import { DeleteReviewUseCase } from './application/use-cases/delete-review.use-case'
import { GetReviewByIdUseCase } from './application/use-cases/get-review-by-id.use-case'
import { GetBusinessReviewsUseCase } from './application/use-cases/get-business-reviews.use-case'
import { GetMyReviewsUseCase } from './application/use-cases/get-my-reviews.use-case'
import { GetReviewStatisticsUseCase } from './application/use-cases/get-review-statistics.use-case'
import { GetSentimentSummaryUseCase } from './application/use-cases/get-sentiment-summary.use-case'
import { GetCriteriaScoresUseCase } from './application/use-cases/get-criteria-scores.use-case'
import { CreateReplyUseCase } from './application/use-cases/create-reply.use-case'
import { UpdateReplyUseCase } from './application/use-cases/update-reply.use-case'
import { DeleteReplyUseCase } from './application/use-cases/delete-reply.use-case'
import { GetApprovedReviewsUseCase } from './application/use-cases/get-approved-reviews.use-case'
import { GetRecentReviewsUseCase } from './application/use-cases/get-recent-reviews.use-case'
import { UploadReviewPhotosUseCase } from './application/use-cases/upload-review-photos.use-case'
import { DeleteReviewPhotoUseCase } from './application/use-cases/delete-review-photo.use-case'
import { AnalyzeReviewSentimentUseCase } from './application/use-cases/analyze-review-sentiment.use-case'
import { SentimentAnalysisJob } from '../../jobs/sentiment-analysis.job'
import { BusinessModule } from '../business/business.module'
import { NotificationModule } from '../notification/notification.module'

@Module({
  imports: [
    ConfigModule,
    InfrastructureModule,
    BusinessModule,
    NotificationModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.accessSecret') || 'change-me-access-secret',
      }),
    }),
  ],
  controllers: [ReviewController, ReplyController, BusinessReviewController],
  providers: [
    {
      provide: ReviewRepository,
      useClass: PrismaReviewRepository,
    },
    {
      provide: ReplyRepository,
      useClass: PrismaReplyRepository,
    },
    {
      provide: ReviewImageRepository,
      useClass: PrismaReviewImageRepository,
    },
    CreateReviewUseCase,
    UpdateReviewUseCase,
    DeleteReviewUseCase,
    GetReviewByIdUseCase,
    GetBusinessReviewsUseCase,
    GetMyReviewsUseCase,
    GetReviewStatisticsUseCase,
    GetSentimentSummaryUseCase,
    GetCriteriaScoresUseCase,
    GetApprovedReviewsUseCase,
    GetRecentReviewsUseCase,
    CreateReplyUseCase,
    UpdateReplyUseCase,
    DeleteReplyUseCase,
    UploadReviewPhotosUseCase,
    DeleteReviewPhotoUseCase,
    AnalyzeReviewSentimentUseCase,
    SentimentAnalysisJob,
  ],
  exports: [GetReviewStatisticsUseCase, ReviewRepository],
})
export class ReviewModule {}
