import { Injectable } from '@nestjs/common'
import { ValidationPipe as NestValidationPipe } from '@nestjs/common'

@Injectable()
export class ValidationPipe extends NestValidationPipe {
  constructor() {
    super({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  }
}
