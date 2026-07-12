import { NestFactory } from '@nestjs/core';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';

function initializeEnv(): void {
  const envCandidates = [
    resolve(process.cwd(), '.env'),
    resolve(process.cwd(), '../../.env'),
  ];

  for (const envPath of envCandidates) {
    if (existsSync(envPath)) {
      loadEnv({ path: envPath });
      break;
    }
  }

  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'file:./dev.db';
  }
}

async function bootstrap() {
  initializeEnv();
  const { AppModule } = await import('./app.module.js');
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  await app.listen(4000);

  console.log('DropSync API running at http://localhost:4000');
}

bootstrap();