import { Injectable, ExecutionContext, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    this.logger.log(`[JwtAuthGuard] Checking authentication for: ${request.method} ${request.url}`);
    this.logger.log(`[JwtAuthGuard] Has Authorization header: ${!!request.headers.authorization}`);
    
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err) {
      this.logger.error(`[JwtAuthGuard] Authentication error:`, err);
      throw err;
    }
    if (info) {
      this.logger.warn(`[JwtAuthGuard] Authentication info:`, info);
    }
    if (!user) {
      this.logger.warn(`[JwtAuthGuard] No user found in token`);
    } else {
      this.logger.log(`[JwtAuthGuard] User authenticated: userId=${user.sub}, roles=${user.roles?.join(',')}`);
    }
    return user;
  }
}

