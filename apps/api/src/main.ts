import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { Logger as PinoLogger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { loadEnv } from '@prioritizz/config';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ZodValidationPipe } from './common/pipes/zod-validation.pipe';

async function bootstrap() {
  const env = loadEnv();
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });

  app.useLogger(app.get(PinoLogger));
  app.set('trust proxy', 1);
  app.use(
    helmet({
      contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.enableCors({
    origin: env.CORS_ORIGINS,
    credentials: true,
    allowedHeaders: ['authorization', 'content-type', 'idempotency-key', 'x-telegram-init-data'],
  });
  app.setGlobalPrefix(env.API_GLOBAL_PREFIX);
  app.enableVersioning();

  // Single validation path: Zod schemas from @prioritizz/schemas (one source of truth).
  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableShutdownHooks();

  if (env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Prioritizz API')
      .setDescription('Escrow marketplace for Telegram digital services')
      .setVersion('v1')
      .addBearerAuth()
      .build();
    const doc = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(`${env.API_GLOBAL_PREFIX}/docs`, app, doc);
  }

  if (env.APP_MODE === 'worker') {
    Logger.log('Started in WORKER mode — HTTP server disabled', 'Bootstrap');
    await app.init();
    return;
  }

  await app.listen(env.API_PORT);
  Logger.log(`API listening on :${env.API_PORT} (${env.NODE_ENV})`, 'Bootstrap');
}

void bootstrap();
