import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { PrismaService } from './infrastructure/database/prisma.service'
import { RedisService } from './infrastructure/cache/redis.service'
import { CloudinaryService } from './infrastructure/storage/cloudinary.service'
import { HealthModule } from './modules/health/health.module'
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
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService, RedisService, CloudinaryService],
  exports: [PrismaService, RedisService, CloudinaryService],
})
export class AppModule {}
