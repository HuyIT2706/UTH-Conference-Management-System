import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AiModule } from './ai/ai.module';
import { JwtStrategy } from './auth/jwt.strategy';
import { SubmissionSummary } from './ai/entities/submission-summary.entity';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        'Backend/ai-service/.env.local',
        'Backend/ai-service/.env',
        '.env',
      ],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const host = config.get<string>('DB_HOST') || 'localhost';
        const port = Number(config.get<string>('DB_PORT')) || 5432;
        const username = config.get<string>('DB_USERNAME') || 'admin';
        const password = config.get<string>('DB_PASSWORD') || 'admin123';
        const database = config.get<string>('DB_DATABASE') || 'db_aiservice';

        return {
          type: 'postgres',
          host,
          port,
          username,
          password,
          database,
          entities: [SubmissionSummary],
          synchronize: true,
        };
      },
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_SECRET') || 'access_secret',
        signOptions: {
          expiresIn: config.get<string>('JWT_ACCESS_EXPIRES_IN') || '15m',
        },
      }),
    }),
    AiModule,
  ],
  controllers: [HealthController],
  providers: [JwtStrategy],
})
export class AiServiceModule {}
