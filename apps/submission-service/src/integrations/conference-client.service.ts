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
  // Cache TTL: 5 phút cho track validation, 1 phút cho deadline checks
  private readonly TRACK_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly DEADLINE_CACHE_TTL = 60 * 1000; // 1 minute
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

    // Cleanup expired cache entries mỗi 10 phút
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

  /**
   * Validate track belongs to conference.
   * Throw rõ ràng cho lỗi 4xx/5xx từ conference-service.
   * Có cache 5 phút để giảm số lượng HTTP calls.
   */
  async validateTrack(
    conferenceId: number,
    trackId: number,
  ): Promise<{ valid: boolean; track?: any }> {
    const cacheKey = `${conferenceId}:${trackId}`;
    const cached = this.trackCache.get(cacheKey);

    // Check cache
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `/conferences/${conferenceId}/tracks/${trackId}/validate`,
        ),
      );
      const result = response.data;

      // Cache kết quả (chỉ cache valid tracks để tránh cache negative results quá lâu)
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

      // Track không tồn tại → trả về invalid, không ném 500
      if (status === HttpStatus.NOT_FOUND) {
        const result = { valid: false };
        // Cache negative result với TTL ngắn hơn (1 phút)
        this.trackCache.set(cacheKey, {
          data: result,
          expiresAt: Date.now() + 60 * 1000,
        });
        return result;
      }

      // Các lỗi khác: wrap lại với status tương ứng nếu có
      throw new HttpException(
        `Conference-service validateTrack lỗi: ${message}`,
        status && status >= 400 && status < 600
          ? status
          : HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * Check if deadline is still valid.
   * Nếu conference-service trả về lỗi cấu hình (CFP chưa setup) → coi như invalid với message rõ ràng.
   * Có cache 1 phút để giảm số lượng HTTP calls (deadline có thể thay đổi nên cache ngắn hơn).
   */
  async checkDeadline(
    conferenceId: number,
    type: 'submission' | 'review' | 'notification' | 'camera-ready',
  ): Promise<{ valid: boolean; deadline?: Date; message: string }> {
    const cacheKey = `${conferenceId}:${type}`;
    const cached = this.deadlineCache.get(cacheKey);

    // Check cache
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `/conferences/${conferenceId}/cfp/check-deadline`,
          {
            params: { type },
          },
        ),
      );
      const result = response.data;

      // Cache kết quả
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

      // Nếu CFP chưa cấu hình hoặc conference không tồn tại → báo lỗi 400 để phía trên hiểu rõ
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

  /**
   * Get track info to extract conferenceId
   */
  async getTrackInfo(trackId: number): Promise<{ conferenceId: number } | null> {
    try {
      // We need to find which conference this track belongs to
      // Since we don't have a direct endpoint, we'll need to search
      // For now, we'll return null and require conferenceId in DTO
      // This can be improved later with a better API
      return null;
    } catch (error) {
      return null;
    }
  }
}
