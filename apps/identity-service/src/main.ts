import { NestFactory } from '@nestjs/core';
import { IdentityServiceModule } from './identity-service.module';
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

  const app = await NestFactory.create(IdentityServiceModule);
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
    .setTitle('Identity Service API')
    .setDescription('API documentation for Identity Service - Authentication & User Management')
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

  await app.listen(process.env.port ?? 3001);
  // eslint-disable-next-line no-console
  console.log(`[Identity-Service] Application is running on: http://localhost:${process.env.port ?? 3001}/api`);
  // eslint-disable-next-line no-console
  console.log(`[Identity-Service] Swagger documentation: http://localhost:${process.env.port ?? 3001}/api/docs`);
}
bootstrap();
