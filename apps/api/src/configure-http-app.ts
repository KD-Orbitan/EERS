import { INestApplication, ValidationPipe } from '@nestjs/common'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import { GlobalExceptionFilter } from './common/filters/global-exception.filter'
import { ResponseInterceptor } from './common/interceptors/response.interceptor'

// Shared by the server and HTTP contract tests to prevent configuration drift.
export function configureHttpApp(app: INestApplication) {
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

}
