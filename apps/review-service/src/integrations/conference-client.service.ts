import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface TrackMember {
  id: number;
  trackId: number;
  userId: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  track?: {
    id: number;
    name: string;
    conferenceId: number;
    conference?: {
      id: number;
      name: string;
    };
  };
}

@Injectable()
export class ConferenceClientService {
  private readonly conferenceServiceUrl: string;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    // Check if running in Docker
    const isDocker = process.env.DOCKER_ENV === 'true' || 
                     process.env.CONFERENCE_SERVICE_URL?.includes('conference-service');
    
    this.conferenceServiceUrl =
      this.configService.get<string>('CONFERENCE_SERVICE_URL') ||
      (isDocker 
        ? 'http://conference-service:3002/api' 
        : 'http://localhost:3002/api');

    console.log('[ConferenceClient] Initialized with URL:', this.conferenceServiceUrl);

    this.httpService.axiosRef.defaults.baseURL = this.conferenceServiceUrl;
    this.httpService.axiosRef.defaults.timeout = 10000;
  }

  /**
   * Get track assignments for a reviewer
   */
  async getMyTrackAssignments(
    authToken: string,
  ): Promise<TrackMember[]> {
    try {
      console.log('[ConferenceClient] Getting track assignments, URL:', this.conferenceServiceUrl);
      
      // Use alternative endpoint to avoid route conflicts
      // Note: baseURL already includes /api, so we just need /conferences/...
      const url = '/conferences/reviewer/my-track-assignments';
      console.log('[ConferenceClient] Full URL will be:', `${this.conferenceServiceUrl}${url}`);
      
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }),
      );

      console.log('[ConferenceClient] Response status:', response.status);
      const result = response.data;
      const assignments = result?.data || [];
      
      console.log('[ConferenceClient] Got track assignments:', assignments.length);
      
      return assignments;
    } catch (error: any) {
      const status = error.response?.status;
      const message =
        error.response?.data?.message ||
        error.message ||
        'Lỗi khi lấy track assignments';

      console.error('[ConferenceClient] Error getting track assignments:', {
        status,
        statusText: error.response?.statusText,
        message,
        error: error.response?.data || error.message,
        url: `${this.conferenceServiceUrl}/conferences/reviewer/my-track-assignments`,
        hasAuthToken: !!authToken,
      });

      // If service is down or unreachable, return empty array instead of throwing
      if (!status || status >= 500) {
        console.warn('[ConferenceClient] Conference-service seems down, returning empty array');
        return [];
      }

      if (status === HttpStatus.UNAUTHORIZED || status === HttpStatus.FORBIDDEN) {
        throw new HttpException(message, status);
      }

      throw new HttpException(
        `Conference-service error: ${message}`,
        status && status >= 400 && status < 600
          ? status
          : HttpStatus.BAD_GATEWAY,
      );
    }
  }
}

