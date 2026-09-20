import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PrismaService } from './database/prisma.service'
import { RedisService } from './cache/redis.service'
import { CloudinaryService } from './storage/cloudinary.service'
import { SentimentService } from './ml/sentiment.service'

import { ImageStorage } from '../common/ports/image-storage.port'
import { SentimentAnalyzer } from '../common/ports/sentiment-analyzer.port'

@Module({
  imports: [ConfigModule],
  providers: [PrismaService, RedisService, CloudinaryService, SentimentService,
    { provide: ImageStorage, useExisting: CloudinaryService },
    { provide: SentimentAnalyzer, useExisting: SentimentService },
  ],
  exports: [PrismaService, RedisService, CloudinaryService, SentimentService, ImageStorage, SentimentAnalyzer],
})
export class InfrastructureModule {}
