import { NestFactory } from '@nestjs/core';
import { SubmissionServiceModule } from './submission-service.module';
import { ValidationPipe } from '@nestjs/common';
import { webcrypto, randomUUID } from 'crypto';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
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
  console.log(`[Submission-Service] Starting server on port ${port}...`);
  console.log(`[Submission-Service] Listening on 0.0.0.0:${port}`);
  
  await app.listen(port, '0.0.0.0');
  
  console.log(`[Submission-Service] ====== SERVER STARTED SUCCESSFULLY ======`);
  console.log(`[Submission-Service] Application is running on: http://localhost:${port}/api`);
  console.log(`[Submission-Service] Swagger documentation: http://localhost:${port}/api/docs`);
  console.log(`[Submission-Service] Docker network URL: http://submission-service:3003/api`);
  console.log(`[Submission-Service] Ready to accept requests!`);
}

bootstrap().catch((error) => {
  console.error('[Submission-Service] ====== FATAL ERROR DURING STARTUP ======');
  console.error('[Submission-Service] Error:', error);
  console.error('[Submission-Service] Stack:', error.stack);
  process.exit(1);
});
