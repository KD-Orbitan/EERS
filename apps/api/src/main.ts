import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import { AppModule } from './app.module'
import { GlobalExceptionFilter } from './common/filters/global-exception.filter'
import { ResponseInterceptor } from './common/interceptors/response.interceptor'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Set global prefix
  const apiPrefix = process.env.API_PREFIX || 'api/v1'
  app.setGlobalPrefix(apiPrefix)

  // Security headers (D-027). CSP is disabled because it breaks Swagger UI's
  // inline scripts at /docs — the other headers (HSTS, X-Frame-Options,
  // X-Content-Type-Options, etc.) still apply.
  app.use(helmet({ contentSecurityPolicy: false }))

  // Set up cookie parser for refresh token cookie support
  app.use(cookieParser())

  // Enable CORS so browser clients can send cookies on refresh.
  // D-027: whitelist frontend origin(s) only — never reflect an arbitrary
  // Origin back when credentials are allowed. CORS_ORIGIN accepts a comma-
  // separated list for multiple environments (e.g. staging + prod).
  const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3001').split(',').map((origin) => origin.trim())
  app.enableCors({ origin: corsOrigins, credentials: true })

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  )

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter())

  // Global response interceptor
  app.useGlobalInterceptors(new ResponseInterceptor())

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('EERS API')
    .setVersion('1.0')
    .addBearerAuth()
    .build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('docs', app, document)

  const port = process.env.PORT ?? 3000
  await app.listen(port)
  console.log(`Application running on http://localhost:${port}`)
}

bootstrap()
