import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { InfrastructureModule } from '../../infrastructure/infrastructure.module'
import { BusinessModule } from '../business/business.module'
import { BookmarkController } from './presentation/controllers/bookmark.controller'
import { MyBookmarksController } from './presentation/controllers/my-bookmarks.controller'
import { BookmarkRepository } from './domain/repositories/bookmark.repository'
import { PrismaBookmarkRepository } from './infrastructure/repositories/prisma-bookmark.repository'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { AddBookmarkUseCase } from './application/use-cases/add-bookmark.use-case'
import { RemoveBookmarkUseCase } from './application/use-cases/remove-bookmark.use-case'
import { GetBookmarkStatusUseCase } from './application/use-cases/get-bookmark-status.use-case'
import { GetMyBookmarksUseCase } from './application/use-cases/get-my-bookmarks.use-case'

@Module({
  imports: [
    ConfigModule,
    InfrastructureModule,
    BusinessModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.accessSecret') || 'change-me-access-secret',
      }),
    }),
  ],
  controllers: [BookmarkController, MyBookmarksController],
  providers: [
    JwtAuthGuard,
    {
      provide: BookmarkRepository,
      useClass: PrismaBookmarkRepository,
    },
    AddBookmarkUseCase,
    RemoveBookmarkUseCase,
    GetBookmarkStatusUseCase,
    GetMyBookmarksUseCase,
  ],
})
export class BookmarkModule {}
