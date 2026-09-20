import { Test } from '@nestjs/testing'
import { AuthModule } from '../modules/auth/auth.module'
import { BusinessModule } from '../modules/business/business.module'
import { ReviewModule } from '../modules/review/review.module'
import { NotificationModule } from '../modules/notification/notification.module'
import { PrismaService } from './database/prisma.service'
import { RedisService } from './cache/redis.service'
import { CloudinaryService } from './storage/cloudinary.service'
import { SentimentService } from './ml/sentiment.service'
import { ImageStorage } from '../common/ports/image-storage.port'
import { SentimentAnalyzer } from '../common/ports/sentiment-analyzer.port'
import { Geocoder } from '../modules/business/application/ports/geocoder.port'
import { GeocodingService } from '../modules/business/infrastructure/services/geocoding.service'
import { NotificationPublisher } from '../modules/notification/application/ports/notification-publisher.port'
import { SseConnectionManager } from '../modules/notification/infrastructure/sse/sse-connection.manager'
import { CreateReviewUseCase } from '../modules/review/application/use-cases/create-review.use-case'
import { LoginUseCase } from '../modules/auth/application/use-cases/login.use-case'

describe('Application dependency injection', () => {
  it('resolves use cases and shares each adapter instance with its application port', async () => {
    const storage = { uploadImage: jest.fn(), deleteImage: jest.fn() }
    const sentiment = { analyze: jest.fn() }
    const module = await Test.createTestingModule({
      imports: [AuthModule, BusinessModule, ReviewModule, NotificationModule],
    })
      .overrideProvider(PrismaService).useValue({})
      .overrideProvider(RedisService).useValue({})
      .overrideProvider(CloudinaryService).useValue(storage)
      .overrideProvider(SentimentService).useValue(sentiment)
      .compile()

    try {
      expect(module.get(ImageStorage)).toBe(storage)
      expect(module.get(SentimentAnalyzer)).toBe(sentiment)
      expect(module.get(Geocoder)).toBe(module.get(GeocodingService))
      expect(module.get(NotificationPublisher)).toBe(module.get(SseConnectionManager))
      expect(module.get(CreateReviewUseCase)).toBeInstanceOf(CreateReviewUseCase)
      expect(module.get(LoginUseCase)).toBeInstanceOf(LoginUseCase)
    } finally {
      await module.close()
    }
  })
})
