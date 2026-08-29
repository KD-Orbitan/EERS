import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ScheduleModule } from '@nestjs/schedule'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { InfrastructureModule } from './infrastructure/infrastructure.module'
import { HealthModule } from './modules/health/health.module'
import { AuthModule } from './modules/auth/auth.module'
import { UserModule } from './modules/user/user.module'
import { CategoryModule } from './modules/category/category.module'
import { CriteriaModule } from './modules/criteria/criteria.module'
import { BusinessModule } from './modules/business/business.module'
import { ReviewModule } from './modules/review/review.module'
import { ReportModule } from './modules/report/report.module'
import { AdminModule } from './modules/admin/admin.module'
import { RankingModule } from './modules/ranking/ranking.module'
import { NotificationModule } from './modules/notification/notification.module'
import { BookmarkModule } from './modules/bookmark/bookmark.module'
// import { RankingRecalculationJob } from './jobs/ranking-recalculation.job'
// import { TrustScoreJob } from './jobs/trust-score.job'
import appConfig from './config/app.config'
import databaseConfig from './config/database.config'
import jwtConfig from './config/jwt.config'
import redisConfig from './config/redis.config'
import cloudinaryConfig from './config/cloudinary.config'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, redisConfig, cloudinaryConfig],
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        // D-027 baseline: apply to every endpoint, tightened further on
        // auth routes specifically via @Throttle (see AuthController).
        ttl: 60000,
        limit: 100,
      },
    ]),
    ScheduleModule.forRoot(),
    InfrastructureModule,
    HealthModule,
    AuthModule,
    UserModule,
    CategoryModule,
    CriteriaModule,
    BusinessModule,
    ReviewModule,
    ReportModule,
    AdminModule,
    RankingModule,
    NotificationModule,
    BookmarkModule,
  ],
  controllers: [AppController],
  // providers: [AppService, RankingRecalculationJob, TrustScoreJob],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
