import { configureHttpApp } from './configure-http-app'
import { NestFactory } from '@nestjs/core'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  configureHttpApp(app)

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
