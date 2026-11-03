import { INestApplication, ValidationPipe } from '@nestjs/common';
import type { Express } from 'express';
import helmet from 'helmet';
import { ThrottlerExceptionFilter } from './common/filters/throttler-exception.filter';
import { setupSwagger } from './swagger';

/**
 * Shared bootstrap for main.ts and e2e tests, so tests run against
 * exactly the same pipes, filters and prefix as production.
 */
export function configureApp(app: INestApplication) {
  // Behind nginx every request comes from the proxy's IP. Without this the
  // rate limiter would throttle all users together as one client.
  const trustProxy = process.env.TRUST_PROXY;
  if (trustProxy) {
    const express = app.getHttpAdapter().getInstance() as Express;
    express.set('trust proxy', Number(trustProxy) || trustProxy);
  }

  app.use(helmet());

  // Frontend is served same-origin (/api via ng proxy in dev, nginx in Docker),
  // so CORS is off unless origins are explicitly configured.
  const origins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  if (origins.length > 0) {
    app.enableCors({
      origin: origins,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type'],
    });
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new ThrottlerExceptionFilter());
  app.setGlobalPrefix('api');
  setupSwagger(app);
  app.enableShutdownHooks();
}
