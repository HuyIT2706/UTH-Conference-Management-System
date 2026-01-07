import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface JwtPayload {
  sub: number;
  roles: string[];
  email?: string;
  fullName?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(configService: ConfigService) {
    const secret = configService.get<string>('JWT_ACCESS_SECRET') || 'access_secret';
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
    this.logger.log(`[JwtStrategy] Initialized with secret: ${secret ? 'present' : 'missing'}`);
  }

  async validate(payload: JwtPayload) {
    this.logger.log(`[JwtStrategy] Validating payload: userId=${payload.sub}, roles=${payload.roles?.join(',')}`);
    return payload;
  }
}

