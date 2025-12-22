import { NestFactory } from '@nestjs/core';
import { ConferenceServiceModule } from './conference-service.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(ConferenceServiceModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: true,
    }),
  );
  const port = process.env.PORT || process.env.port || 3002;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`[Conference-Service] Application is running on: http://localhost:${port}/api`);
}
bootstrap();
