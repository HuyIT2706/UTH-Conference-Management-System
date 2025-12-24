import { NestFactory } from '@nestjs/core';
import { SubmissionServiceModule } from './submission-service.module';
import { ValidationPipe } from '@nestjs/common';
import { webcrypto, randomUUID } from 'crypto';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

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

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('UTH-ConfMS Submission Service')
    .setDescription('Hệ thống quản lý bài báo hội nghị nghiên cứu khoa học cho Đại học UTH (UTH-ConfMS) - Submission Service: Quản lý Bài nộp & Version History')
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

  const port = process.env.PORT ?? 3003;
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`[Submission-Service] Application is running on: http://localhost:${port}/api`);
  // eslint-disable-next-line no-console
  console.log(`[Submission-Service] Swagger documentation: http://localhost:${port}/api/docs`);
}
bootstrap();
