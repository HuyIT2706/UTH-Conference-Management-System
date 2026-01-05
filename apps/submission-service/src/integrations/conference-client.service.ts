import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

@Injectable()
export class ConferenceClientService {
  private readonly conferenceServiceUrl: string;
  private readonly TRACK_CACHE_TTL = 5 * 60 * 1000; 
  private readonly DEADLINE_CACHE_TTL = 60 * 1000; 
  private trackCache = new Map<string, CacheEntry<{ valid: boolean; track?: any }>>();
  private deadlineCache = new Map<string, CacheEntry<{ valid: boolean; deadline?: Date; message: string }>>();

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    this.conferenceServiceUrl =
      this.configService.get<string>('CONFERENCE_SERVICE_URL') ||
      'http://localhost:3002/api';

    this.httpService.axiosRef.defaults.baseURL = this.conferenceServiceUrl;
    this.httpService.axiosRef.defaults.timeout = 10000;
    setInterval(() => this.cleanupCache(), 10 * 60 * 1000);
  }

  private cleanupCache() {
    const now = Date.now();
    for (const [key, entry] of this.trackCache.entries()) {
      if (entry.expiresAt < now) {
        this.trackCache.delete(key);
      }
    }
    for (const [key, entry] of this.deadlineCache.entries()) {
      if (entry.expiresAt < now) {
        this.deadlineCache.delete(key);
      }
    }
  }
  async validateTrack(
    conferenceId: number,
    trackId: number,
  ): Promise<{ valid: boolean; track?: any }> {
    const cacheKey = `${conferenceId}:${trackId}`;
    const cached = this.trackCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    try {
      console.log('[ConferenceClient] Calling validateTrack:', {
        url: `/public/conferences/${conferenceId}/tracks/${trackId}/validate`,
        conferenceId,
        trackId,
      });
      const response = await firstValueFrom(
        this.httpService.get(
          `/public/conferences/${conferenceId}/tracks/${trackId}/validate`,
        ),
      );
      console.log('[ConferenceClient] Raw response:', {
        status: response.status,
        data: response.data,
        headers: response.headers,
      });
      
      // Handle both direct response and wrapped response
      let result = response.data;
      if (result && result.data && typeof result.data.valid === 'boolean') {
        console.log('[ConferenceClient] Response wrapped in data field, unwrapping...');
        result = result.data;
      }
      
      if (!result || typeof result.valid !== 'boolean') {
        console.error('[ConferenceClient] Invalid response structure:', {
          result,
          type: typeof result,
          hasValid: result?.valid !== undefined,
        });
        return { valid: false };
      }
      
      console.log('[ConferenceClient] Track validation result:', result);
      
      if (result.valid) {
        this.trackCache.set(cacheKey, {
          data: result,
          expiresAt: Date.now() + this.TRACK_CACHE_TTL,
        });
      }

      return result;
    } catch (error: any) {
      const status = error.response?.status;
      const message =
        error.response?.data?.message ||
        error.message ||
        'Lỗi khi validate track';
      
      console.error('[ConferenceClient] validateTrack error:', {
        status,
        message,
        error: error.response?.data || error.message,
        conferenceId,
        trackId,
      });
      
      // Nếu là 401/403, có thể endpoint cần auth
      if (status === HttpStatus.UNAUTHORIZED || status === HttpStatus.FORBIDDEN) {
        console.warn('[ConferenceClient] Validation endpoint requires auth, returning invalid');
        return { valid: false };
      }
      
      if (status === HttpStatus.NOT_FOUND) {
        const result = { valid: false };
        this.trackCache.set(cacheKey, {
          data: result,
          expiresAt: Date.now() + 60 * 1000,
        });
        return result;
      }
      
      // Nếu là 400 Bad Request, có thể track không hợp lệ
      if (status === HttpStatus.BAD_REQUEST) {
        console.warn('[ConferenceClient] Bad request from validation endpoint, track may be invalid');
        return { valid: false };
      }
      
      // Với các lỗi khác, throw exception để submission service xử lý
      throw new HttpException(
        `Conference-service validateTrack lỗi: ${message}`,
        status && status >= 400 && status < 600
          ? status
          : HttpStatus.BAD_GATEWAY,
      );
    }
  }
  async checkDeadline(
    conferenceId: number,
    type: 'submission' | 'review' | 'notification' | 'camera-ready',
  ): Promise<{ valid: boolean; deadline?: Date; message: string }> {
    const cacheKey = `${conferenceId}:${type}`;
    const cached = this.deadlineCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `/public/conferences/${conferenceId}/cfp/check-deadline`,
          {
            params: { type },
          },
        ),
      );
      const result = response.data;
      this.deadlineCache.set(cacheKey, {
        data: result,
        expiresAt: Date.now() + this.DEADLINE_CACHE_TTL,
      });

      return result;
    } catch (error: any) {
      const status = error.response?.status;
      const message =
        error.response?.data?.message ||
        error.message ||
        'Lỗi khi kiểm tra deadline';
      if (status === HttpStatus.NOT_FOUND || status === HttpStatus.BAD_REQUEST) {
        throw new HttpException(
          `Không thể kiểm tra deadline: ${message}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      throw new HttpException(
        `Conference-service checkDeadline lỗi: ${message}`,
        status && status >= 400 && status < 600
          ? status
          : HttpStatus.BAD_GATEWAY,
      );
    }
  }
  async getTrackInfo(trackId: number): Promise<{ conferenceId: number } | null> {
    try {
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if reviewer has accepted track assignment for a specific track
   * Alternative: Get all track assignments and check locally
   */
  async checkReviewerTrackAssignment(
    reviewerId: number,
    trackId: number,
    authToken?: string,
  ): Promise<{ hasAccepted: boolean }> {
    try {
      // Try the new endpoint first
      const headers: Record<string, string> = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      const url = `/conferences/tracks/${trackId}/reviewer/${reviewerId}/check-assignment`;
      console.log('[ConferenceClient] Calling:', url, { reviewerId, trackId });
      
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers,
        }),
      );
      
      const result = response.data;
      const hasAccepted = result?.data?.hasAccepted || result?.hasAccepted || false;
      
      console.log('[ConferenceClient] Track assignment check result:', hasAccepted);
      
      return { hasAccepted };
    } catch (error: any) {
      // If endpoint returns 404, try alternative: get all track assignments
      if (error.response?.status === 404) {
        console.log('[ConferenceClient] check-assignment endpoint not found, trying alternative method');
        try {
          const headers: Record<string, string> = {};
          if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
          }
          
          // Get all track assignments for this reviewer
          const response = await firstValueFrom(
            this.httpService.get('/conferences/tracks/my-assignments', {
              headers,
            }),
          );
          
          const assignments = response.data?.data || [];
          console.log('[ConferenceClient] Got track assignments:', assignments.length);
          
          // Check if any assignment matches trackId and has status ACCEPTED
          const hasAccepted = assignments.some(
            (assignment: any) => 
              assignment.trackId === trackId && 
              assignment.status === 'ACCEPTED'
          );
          
          console.log('[ConferenceClient] Track assignment check result (alternative):', hasAccepted);
          
          return { hasAccepted };
        } catch (altError: any) {
          console.error('[ConferenceClient] Alternative method also failed:', altError.message);
          return { hasAccepted: false };
        }
      }
      
      // For other errors, return false
      console.error(
        '[ConferenceClient] Error checking reviewer track assignment:',
        {
          message: error.message || error,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          reviewerId,
          trackId,
        },
      );
      return { hasAccepted: false };
    }
  }
}
