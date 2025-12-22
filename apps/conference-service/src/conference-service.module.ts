import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConferencesController } from './conferences/conferences.controller';
import { ConferencesService } from './conferences/conferences.service';
import { Conference } from './conferences/entities/conference.entity';
import { Track } from './conferences/entities/track.entity';
import { ConferenceMember } from './conferences/entities/conference-member.entity';
import { CfpSetting } from './cfp/entities/cfp-setting.entity';
import { JwtStrategy } from './auth/jwt.strategy';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        'apps/conference-service/.env.local',
        'apps/conference-service/.env',
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
        const database =
          config.get<string>('DB_DATABASE') || 'db_conference';

        // eslint-disable-next-line no-console
        console.log(
          `[Conference-Service] DB -> host=${host} port=${port} user=${username} db=${database}`,
        );

        return {
          type: 'postgres' as const,
          host,
          port,
          username,
          password,
          database,
          entities: [Conference, Track, ConferenceMember, CfpSetting],
          synchronize: true,
        };
      },
    }),
    TypeOrmModule.forFeature([Conference, Track, ConferenceMember, CfpSetting]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_SECRET') || 'access_secret',
        signOptions: {
          expiresIn: Number(config.get<string>('JWT_ACCESS_EXPIRES_IN')) || 900,
        },
      }),
    }),
  ],
  controllers: [ConferencesController],
  providers: [ConferencesService, JwtStrategy],
})
export class ConferenceServiceModule {}
