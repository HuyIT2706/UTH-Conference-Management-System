import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ReviewServiceModule } from './review-service.module';

async function bootstrap() {
  const app = await NestFactory.create(ReviewServiceModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  const port = process.env.PORT || process.env.port || 3004;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`[Review-Service] Application is running on: http://localhost:${port}/api`);
}
bootstrap();
