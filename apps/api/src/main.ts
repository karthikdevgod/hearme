import './load-env';
import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { WsAdapter } from '@nestjs/platform-ws';
import { loadServerEnv } from '@hearme/config';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const env = loadServerEnv(process.env);
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Input validation is handled per-route with Zod schemas (see controllers),
  // so no global class-validator ValidationPipe is needed.
  app.enableCors({ origin: env.CORS_ORIGINS, credentials: true });
  app.useWebSocketAdapter(new WsAdapter(app));

  await app.listen(env.API_PORT);
  new Logger('Bootstrap').log(`${env.APP_NAME} api listening on :${env.API_PORT}`);
}

void bootstrap();
