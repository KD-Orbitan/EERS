import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'

@Injectable()
export class RedisService {
  private redis: Redis
  private readonly logger = new Logger(RedisService.name)

  constructor(private configService: ConfigService) {
    const redisUrl = this.configService.get('redis.url')
    this.redis = new Redis(redisUrl)

    this.redis.on('error', (err) => {
      this.logger.error(`Redis error: ${err}`)
    })

    this.redis.on('connect', () => {
      this.logger.log('Redis connected')
    })
  }

  async get(key: string): Promise<string | null> {
    return this.redis.get(key)
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.redis.setex(key, ttl, value)
    } else {
      await this.redis.set(key, value)
    }
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key)
  }

  async getRedis(): Promise<Redis> {
    return this.redis
  }
}
