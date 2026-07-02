import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PrismaService } from './database/prisma.service'
import { RedisService } from './cache/redis.service'
import { CloudinaryService } from './storage/cloudinary.service'

@Module({
  imports: [ConfigModule],
  providers: [PrismaService, RedisService, CloudinaryService],
  exports: [PrismaService, RedisService, CloudinaryService],
})
export class InfrastructureModule {}
