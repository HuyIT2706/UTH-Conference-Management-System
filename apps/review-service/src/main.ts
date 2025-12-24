import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ReviewServiceModule } from './review-service.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

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

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Review Service API')
    .setDescription('API documentation for Review Service - Review, Assignment, Bidding, Decision & Rebuttal Management')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || process.env.port || 3004;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`[Review-Service] Application is running on: http://localhost:${port}/api`);
  // eslint-disable-next-line no-console
  console.log(`[Review-Service] Swagger documentation: http://localhost:${port}/api/docs`);
}
bootstrap();
