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
      const response = await firstValueFrom(
        this.httpService.get(
          `/conferences/${conferenceId}/tracks/${trackId}/validate`,
        ),
      );
      const result = response.data;
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
      if (status === HttpStatus.NOT_FOUND) {
        const result = { valid: false };
        this.trackCache.set(cacheKey, {
          data: result,
          expiresAt: Date.now() + 60 * 1000,
        });
        return result;
      }
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
          `/conferences/${conferenceId}/cfp/check-deadline`,
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
}
