import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { EmailVerificationToken } from './entities/email-verification-token.entity';
import { RoleName } from '../users/entities/role.entity';

@Injectable()
export class AuthService {
  private readonly refreshSecret: string;
  private readonly refreshExpiresIn: string;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(EmailVerificationToken)
    private readonly emailVerificationTokenRepository: Repository<EmailVerificationToken>,
  ) {
    this.refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') || 'refresh_secret';
    this.refreshExpiresIn =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';
  }

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new BadRequestException('Email đã tồn tại');
    }

    const adminRole = await this.usersService.findRoleByName(RoleName.ADMIN);
    if (!adminRole || !adminRole.id) {
      throw new BadRequestException(
        'Không tìm thấy quyền ADMIN. Vui lòng chạy seed dữ liệu trước.',
      );
    }

    const hashed = await bcrypt.hash(dto.password, 10);
    console.log('[Đăng ký] Gọi createUser với quyền ADMIN...');
    const user = await this.usersService.createUser({
      email: dto.email,
      password: hashed,
      fullName: dto.fullName,
      roles: [adminRole],
    });

    // Sau khi tạo user, tạo token verify email
    await this.createAndSendEmailVerificationToken(user);

    // Không tự động login, yêu cầu xác minh email trước (tùy bạn có thể đổi)
    return {
      user: this.stripPassword(user),
      message: 'Vui lòng kiểm tra email để xác minh tài khoản',
    };
  }

  private async createAndSendEmailVerificationToken(user: User) {
    const token = await bcrypt.genSalt(10); // dùng chuỗi random, không liên quan password
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const entity = this.emailVerificationTokenRepository.create({
      token,
      userId: user.id,
      expiresAt,
      used: false,
    });
    await this.emailVerificationTokenRepository.save(entity);

    const appUrl =
      this.configService.get<string>('APP_BASE_URL') ||
      'http://localhost:3000';
    const verifyUrl = `${appUrl}/verify-email?token=${encodeURIComponent(
      token,
    )}`;

    // TODO: gửi email thật qua SMTP/notification-service
    // Tạm thời log ra server để dev kiểm tra
    // eslint-disable-next-line no-console
    console.log(
      `[EmailVerification] Send verify link to ${user.email}: ${verifyUrl} (expires at ${expiresAt.toISOString()})`,
    );
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Thông tin đăng nhập không hợp lệ');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException(
        'Tài khoản chưa được xác minh email. Vui lòng kiểm tra email.',
      );
    }

    const isValid = await bcrypt.compare(dto.password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Thông tin đăng nhập không hợp lệ');
    }

    const tokens = await this.issueTokens(user);
    return { user: this.stripPassword(user), ...tokens };
  }

  async refreshToken(dto: RefreshTokenDto) {
    const payload = await this.verifyRefreshToken(dto.refreshToken);
    const stored = await this.refreshTokenRepository.findOne({
      where: { token: dto.refreshToken, userId: payload.sub },
    });

    if (!stored) {
      throw new UnauthorizedException('Refresh token đã bị thu hồi');
    }

    if (stored.expiryDate.getTime() < Date.now()) {
      await this.refreshTokenRepository.delete({ id: stored.id });
      throw new UnauthorizedException('Refresh token đã hết hạn');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Không tìm thấy người dùng');
    }

    // Rotate refresh token: remove old, issue new
    await this.refreshTokenRepository.delete({ id: stored.id });
    const tokens = await this.issueTokens(user);
    return { user: this.stripPassword(user), ...tokens };
  }

  async logout(dto: RefreshTokenDto) {
    await this.refreshTokenRepository.delete({ token: dto.refreshToken });
    return { message: 'Đã đăng xuất' };
  }

  async verifyEmail(token: string) {
    const record = await this.emailVerificationTokenRepository.findOne({
      where: { token, used: false },
    });

    if (!record) {
      throw new NotFoundException('Token xác minh không hợp lệ');
    }

    if (record.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Token xác minh đã hết hạn');
    }

    const user = await this.usersService.markEmailVerified(record.userId);

    record.used = true;
    await this.emailVerificationTokenRepository.save(record);

    return { message: 'Xác minh email thành công' };
  }

  /**
   * Helper method để lấy verification token từ database (cho development/testing)
   * Chỉ dùng trong development, không nên expose trong production
   * Nếu không có token hoặc đã verify, sẽ tạo token mới
   */
  async getVerificationTokenByEmail(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    // Nếu đã verify rồi thì báo luôn
    if (user.isVerified) {
      return {
        email: user.email,
        message: 'Email đã được xác minh',
        isVerified: true,
      };
    }

    // Tìm token chưa dùng
    let token = await this.emailVerificationTokenRepository.findOne({
      where: { userId: user.id, used: false },
      order: { createdAt: 'DESC' },
    });

    // Nếu không có token hợp lệ, tạo mới
    if (!token || token.expiresAt.getTime() < Date.now()) {
      // Tạo token mới
      await this.createAndSendEmailVerificationToken(user);
      
      // Lấy token vừa tạo
      token = await this.emailVerificationTokenRepository.findOne({
        where: { userId: user.id, used: false },
        order: { createdAt: 'DESC' },
      });

      if (!token) {
        throw new NotFoundException('Không thể tạo verification token');
      }
    }

    return {
      email: user.email,
      token: token.token,
      expiresAt: token.expiresAt,
      verifyUrl: `http://localhost:3001/api/auth/verify-email?token=${encodeURIComponent(token.token)}`,
      isVerified: false,
    };
  }

  private stripPassword(user: User) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...rest } = user;
    return rest;
  }

  private async issueTokens(user: User) {
    // Get role names from user roles
    const roleNames = user.roles?.map((role) => role.name) || [];
    
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      roles: roleNames,
    });

    const refreshToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
      },
      {
        secret: this.refreshSecret,
        // jose types prefer numeric seconds
        expiresIn: this.parseExpiryToSeconds(this.refreshExpiresIn),
      },
    );

    const expiryDate = new Date(
      Date.now() + this.parseExpiryToMs(this.refreshExpiresIn),
    );

    const entity = this.refreshTokenRepository.create({
      token: refreshToken,
      userId: user.id,
      expiryDate,
    });
    await this.refreshTokenRepository.save(entity);

    return {
      accessToken,
      refreshToken,
      expiresIn:
        this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '900',
      refreshExpiresIn: this.refreshExpiresIn,
    };
  }

  private async verifyRefreshToken(token: string) {
    try {
      return await this.jwtService.verifyAsync(token, {
        secret: this.refreshSecret,
      });
    } catch (err) {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }
  }

  private parseExpiryToMs(expiry: string): number {
    const match = /^(\d+)([smhd])$/.exec(expiry);
    if (!match) return 7 * 24 * 60 * 60 * 1000; // default 7d
    const value = Number(match[1]);
    const unit = match[2];
    const unitMs =
      { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit] ?? 0;
    return value * unitMs;
  }

  private parseExpiryToSeconds(expiry: string): number {
    const match = /^(\d+)([smhd])$/.exec(expiry);
    if (!match) return 7 * 24 * 60 * 60;
    const value = Number(match[1]);
    const unit = match[2];
    const unitSec = { s: 1, m: 60, h: 3_600, d: 86_400 }[unit] ?? 0;
    return value * unitSec;
  }
}

