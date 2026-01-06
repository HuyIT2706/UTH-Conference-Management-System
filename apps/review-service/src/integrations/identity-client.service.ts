import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface UserInfo {
  id: number;
  email: string;
  fullName?: string;
  roles?: string[];
}

@Injectable()
export class IdentityClientService {
  private readonly identityServiceUrl: string;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    // Check if running in Docker
    const isDocker = process.env.DOCKER_ENV === 'true' || 
                     process.env.IDENTITY_SERVICE_URL?.includes('identity-service');
    
    this.identityServiceUrl =
      this.configService.get<string>('IDENTITY_SERVICE_URL') ||
      (isDocker 
        ? 'http://identity-service:3001/api' 
        : 'http://localhost:3001/api');

    console.log('[IdentityClient] Initialized with URL:', this.identityServiceUrl);

    this.httpService.axiosRef.defaults.baseURL = this.identityServiceUrl;
    this.httpService.axiosRef.defaults.timeout = 10000;
  }

  /**
   * Get user information by ID
   */
  async getUserById(userId: number, authToken?: string): Promise<UserInfo | null> {
    try {
      const headers: Record<string, string> = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await firstValueFrom(
        this.httpService.get(`/users/${userId}`, { headers }),
      );

      const userData = response.data?.data;
      if (!userData) {
        return null;
      }

      return {
        id: userData.id,
        email: userData.email,
        fullName: userData.fullName,
        roles: userData.roles || [],
      };
    } catch (error: any) {
      const status = error.response?.status;
      const message =
        error.response?.data?.message ||
        error.message ||
        'Lỗi khi lấy thông tin user';

      console.error('[IdentityClient] Error getting user:', {
        userId,
        status,
        statusText: error.response?.statusText,
        message,
        error: error.response?.data || error.message,
      });

      // If service is down or unreachable, return null instead of throwing
      if (!status || status >= 500) {
        console.warn('[IdentityClient] Identity-service seems down, returning null');
        return null;
      }

      if (status === HttpStatus.NOT_FOUND) {
        return null;
      }

      // If forbidden/unauthorized, just return null (don't throw)
      // This allows the system to continue working even if we can't get user names
      if (status === HttpStatus.UNAUTHORIZED || status === HttpStatus.FORBIDDEN) {
        console.warn(`[IdentityClient] Cannot get user ${userId}: ${message}`);
        return null;
      }

      // For other errors, also return null instead of throwing
      console.warn(`[IdentityClient] Error getting user ${userId}: ${message}`);
      return null;
    }
  }

  /**
   * Get multiple users by IDs (batch)
   */
  async getUsersByIds(userIds: number[], authToken?: string): Promise<Map<number, UserInfo>> {
    const userMap = new Map<number, UserInfo>();
    
    // Fetch users in parallel
    const promises = userIds.map(async (userId) => {
      try {
        const user = await this.getUserById(userId, authToken);
        if (user) {
          userMap.set(userId, user);
        }
      } catch (error) {
        console.error(`[IdentityClient] Failed to get user ${userId}:`, error);
      }
    });

    await Promise.all(promises);
    return userMap;
  }
}

