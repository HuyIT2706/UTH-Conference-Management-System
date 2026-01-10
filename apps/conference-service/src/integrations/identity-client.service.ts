import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface UserInfo {
  id: number;
  email: string;
  fullName: string;
  isVerified: boolean;
}

@Injectable()
export class IdentityClientService {
  private readonly identityServiceUrl: string;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    const isDocker = process.env.DOCKER_ENV === 'true' ||
                     process.env.IDENTITY_SERVICE_URL?.includes('identity-service');

    this.identityServiceUrl =
      this.configService.get<string>('IDENTITY_SERVICE_URL') ||
      (isDocker
        ? 'http://identity-service:3001/api'
        : 'http://localhost:3001/api');

    console.log('[IdentityClient] Initialized with URL:', this.identityServiceUrl);
  }

  /**
   * Get user information by ID
   */
  async getUserById(userId: number, authToken: string): Promise<UserInfo | null> {
    try {
      console.log('[IdentityClient] Getting user info:', {
        userId,
        url: `${this.identityServiceUrl}/users/${userId}`,
        hasAuthToken: !!authToken,
      });

      const response = await firstValueFrom(
        this.httpService.get(`${this.identityServiceUrl}/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          timeout: 10000,
        }),
      );

      const userInfo = response.data?.data || response.data || null;
      console.log('[IdentityClient] Got user info:', {
        userId,
        hasEmail: !!userInfo?.email,
        hasFullName: !!userInfo?.fullName,
      });
      
      return userInfo;
    } catch (error: any) {
      const status = error.response?.status;
      const message =
        error.response?.data?.message ||
        error.message ||
        'Lỗi khi lấy thông tin user';

      // Log detailed error info
      console.error('[IdentityClient] Error getting user:', {
        userId,
        status,
        statusText: error.response?.statusText,
        message,
        errorMessage: error.message,
        errorCode: error.code,
        url: `${this.identityServiceUrl}/users/${userId}`,
        responseData: error.response?.data,
      });

      // Log warning for 404 (user not found) or service unavailability
      if (status === HttpStatus.NOT_FOUND) {
        console.warn('[IdentityClient] User not found:', { userId });
        return null;
      }

      // Check for connection errors (ECONNREFUSED, ETIMEDOUT, etc.)
      const isConnectionError = !status || 
                                error.code === 'ECONNREFUSED' || 
                                error.code === 'ETIMEDOUT' ||
                                error.code === 'ENOTFOUND';

      if (isConnectionError || status === HttpStatus.BAD_GATEWAY) {
        console.warn('[IdentityClient] Identity-service unavailable:', {
          userId,
          errorCode: error.code,
          message: 'Identity-service không khả dụng hoặc chưa chạy. Vui lòng kiểm tra identity-service đã chạy chưa.',
          suggestedUrl: this.identityServiceUrl,
        });
        return null;
      }

      // For 401/403, might be permission issue - log but don't throw
      if (status === HttpStatus.UNAUTHORIZED || status === HttpStatus.FORBIDDEN) {
        console.warn('[IdentityClient] Permission denied:', {
          userId,
          status,
          message: 'Token không có quyền truy cập endpoint này',
        });
        return null;
      }

      // Return null for other errors too - don't break the main flow
      return null;
    }
  }

  /**
   * Get user email by ID (simplified method)
   */
  async getUserEmail(userId: number, authToken: string): Promise<string | null> {
    const userInfo = await this.getUserById(userId, authToken);
    return userInfo?.email || null;
  }

  /**
   * Get user full name by ID (simplified method)
   */
  async getUserFullName(userId: number, authToken: string): Promise<string | null> {
    const userInfo = await this.getUserById(userId, authToken);
    return userInfo?.fullName || null;
  }
}
