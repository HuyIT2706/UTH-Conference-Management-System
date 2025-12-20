import { NestFactory } from '@nestjs/core';
import { SubmissionServiceModule } from './submission-service.module';
import { ValidationPipe } from '@nestjs/common';
import { webcrypto, randomUUID } from 'crypto';

async function bootstrap() {
  // Ensure global crypto + randomUUID for libraries expecting WebCrypto on Node 18
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
  const g: any = global as any;
  if (typeof g.crypto === 'undefined') {
    g.crypto = webcrypto;
  }
  if (g.crypto && !g.crypto.randomUUID) {
    g.crypto.randomUUID = randomUUID;
  }

  const app = await NestFactory.create(SubmissionServiceModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: true,
    }),
  );
  await app.listen(process.env.PORT ?? 3003, '0.0.0.0');
}
bootstrap();
