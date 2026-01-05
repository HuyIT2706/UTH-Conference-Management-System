import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface Submission {
  id: string;
  title: string;
  abstract: string;
  keywords?: string;
  authorId: number;
  authorName?: string;
  trackId: number;
  conferenceId: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class SubmissionClientService {
  private readonly submissionServiceUrl: string;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    // Check if running in Docker
    const isDocker = process.env.DOCKER_ENV === 'true' || 
                     process.env.SUBMISSION_SERVICE_URL?.includes('submission-service');
    
    this.submissionServiceUrl =
      this.configService.get<string>('SUBMISSION_SERVICE_URL') ||
      (isDocker 
        ? 'http://submission-service:3003/api' 
        : 'http://localhost:3003/api');

    console.log('[SubmissionClient] Initialized with URL:', this.submissionServiceUrl);

    this.httpService.axiosRef.defaults.baseURL = this.submissionServiceUrl;
    this.httpService.axiosRef.defaults.timeout = 10000;
  }

  /**
   * Get submissions by trackId
   */
  async getSubmissionsByTrack(
    trackId: number,
    authToken: string,
    status?: string[],
  ): Promise<Submission[]> {
    try {
      // Don't pass status to params - submission-service only supports single status
      // We'll filter by status after getting all submissions
      const params: Record<string, any> = {
        trackId,
        limit: 100,
        page: 1,
      };

      console.log('[SubmissionClient] Getting submissions by track:', {
        trackId,
        requestedStatusFilter: status,
        url: `${this.submissionServiceUrl}/submissions`,
        params,
        hasAuthToken: !!authToken,
      });

      const response = await firstValueFrom(
        this.httpService.get('/submissions', {
          params,
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }),
      );

      console.log('[SubmissionClient] Response:', {
        status: response.status,
        statusText: response.statusText,
        hasData: !!response.data,
        dataType: typeof response.data,
        message: response.data?.message,
        pagination: response.data?.pagination,
        dataCount: response.data?.data?.length || 0,
      });

      const result = response.data;
      let submissions: Submission[] = result?.data || [];

      console.log('[SubmissionClient] Raw submissions before filter:', {
        count: submissions.length,
        submissions: submissions.map(s => ({ 
          id: s.id, 
          title: s.title?.substring(0, 50),
          status: s.status, 
          trackId: s.trackId,
          authorId: s.authorId,
        })),
      });

      // Filter by status if provided (submission-service doesn't support array of statuses)
      if (status && status.length > 0) {
        const beforeFilter = submissions.length;
        submissions = submissions.filter((s) => status.includes(s.status));
        console.log('[SubmissionClient] After status filter:', {
          before: beforeFilter,
          after: submissions.length,
          filterStatus: status,
          filteredOut: beforeFilter - submissions.length,
        });
      }

      console.log('[SubmissionClient] Final submissions:', {
        count: submissions.length,
        ids: submissions.map(s => s.id),
      });

      return submissions;
    } catch (error: any) {
      const status = error.response?.status;
      const message =
        error.response?.data?.message ||
        error.message ||
        'Lỗi khi lấy submissions';

      console.error('[SubmissionClient] Error getting submissions:', {
        status,
        message,
        error: error.response?.data || error.message,
        trackId,
      });

      if (status === HttpStatus.UNAUTHORIZED || status === HttpStatus.FORBIDDEN) {
        throw new HttpException(message, status);
      }

      throw new HttpException(
        `Submission-service error: ${message}`,
        status && status >= 400 && status < 600
          ? status
          : HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * Get submission by ID
   */
  async getSubmissionById(
    submissionId: string,
    authToken: string,
  ): Promise<Submission | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`/submissions/${submissionId}`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }),
      );

      const result = response.data;
      return result?.data || null;
    } catch (error: any) {
      const status = error.response?.status;
      if (status === HttpStatus.NOT_FOUND) {
        return null;
      }

      const message =
        error.response?.data?.message ||
        error.message ||
        'Lỗi khi lấy submission';

      console.error('[SubmissionClient] Error getting submission:', {
        status,
        message,
        error: error.response?.data || error.message,
        submissionId,
      });

      throw new HttpException(
        `Submission-service error: ${message}`,
        status && status >= 400 && status < 600
          ? status
          : HttpStatus.BAD_GATEWAY,
      );
    }
  }
}

