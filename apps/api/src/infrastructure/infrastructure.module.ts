import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PrismaService } from './database/prisma.service'
import { RedisService } from './cache/redis.service'
import { CloudinaryService } from './storage/cloudinary.service'
import { SentimentService } from './ml/sentiment.service'

@Module({
  imports: [ConfigModule],
  providers: [PrismaService, RedisService, CloudinaryService, SentimentService],
  exports: [PrismaService, RedisService, CloudinaryService, SentimentService],
})
export class InfrastructureModule {}
