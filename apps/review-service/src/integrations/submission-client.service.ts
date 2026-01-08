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

    // Don't set baseURL on shared axios instance - use full URL in requests instead
    // This prevents conflicts with other client services that share the same HttpService
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
        fullUrl: `${this.submissionServiceUrl}/submissions?trackId=${trackId}&limit=100&page=1`,
      });

      // Use full URL instead of baseURL to avoid conflicts with other client services
      const fullUrl = `${this.submissionServiceUrl}/submissions`;
      const response = await firstValueFrom(
        this.httpService.get(fullUrl, {
          params,
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          timeout: 10000,
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
        totalInPagination: response.data?.pagination?.total || 0,
        trackId,
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
      // Type-safe extraction of error properties
      const hasResponse = error?.response !== undefined && error?.response !== null;
      const status: number | undefined = hasResponse ? (error.response.status as number | undefined) : undefined;
      const statusText: string | undefined = hasResponse ? (error.response.statusText as string | undefined) : undefined;
      const responseData: any = hasResponse ? error.response.data : undefined;
      const errorMessage: string = error?.message || 'Unknown error';
      const errorName: string = error?.name || 'Error';
      const errorCode: string | undefined = error?.code;
      
      // Extract message from various possible locations
      const message: string =
        (responseData?.message as string) ||
        (responseData?.error as string) ||
        errorMessage ||
        'Lỗi khi lấy submissions';

      console.error('[SubmissionClient] Error getting submissions - DETAILED:', {
        status: status !== undefined ? status : 'undefined',
        statusText: statusText || 'undefined',
        errorName: errorName || 'undefined',
        errorCode: errorCode || 'undefined',
        message,
        errorMessage,
        responseData,
        errorStack: error?.stack,
        trackId,
        url: `${this.submissionServiceUrl}/submissions`,
        params: { trackId, limit: 100, page: 1 },
        hasResponse,
        responseStatus: status,
        responseHeaders: hasResponse ? error.response.headers : undefined,
        errorType: typeof error,
        isAxiosError: error?.isAxiosError || false,
      });

      // If it's an HTTP error with status code (status is a number)
      if (typeof status === 'number' && status > 0) {
      if (status === HttpStatus.UNAUTHORIZED || status === HttpStatus.FORBIDDEN) {
        throw new HttpException(message, status);
      }
        throw new HttpException(
          `Submission-service error: ${message}`,
          status >= 400 && status < 600 ? status : HttpStatus.BAD_GATEWAY,
        );
      }

      // If no status (network error, timeout, etc.)
      // Check if it's a connection/timeout error
      if (errorCode === 'ECONNREFUSED' || errorCode === 'ETIMEDOUT' || errorName === 'TimeoutError' || errorCode === 'ENOTFOUND') {
        const connectionErrorMsg = errorCode === 'ECONNREFUSED' 
          ? `Submission-service không chạy hoặc không thể kết nối. URL: ${this.submissionServiceUrl}`
          : errorCode === 'ETIMEDOUT'
          ? `Kết nối đến submission-service quá thời gian. URL: ${this.submissionServiceUrl}`
          : errorCode === 'ENOTFOUND'
          ? `Không tìm thấy submission-service. URL: ${this.submissionServiceUrl}`
          : `Không thể kết nối đến submission-service. URL: ${this.submissionServiceUrl}`;
        
        console.error('[SubmissionClient] Connection error details:', {
          errorCode,
          errorName,
          targetUrl: this.submissionServiceUrl,
          dockerEnv: process.env.DOCKER_ENV,
          submissionServiceUrl: process.env.SUBMISSION_SERVICE_URL,
        });
        
        throw new HttpException(
          `${connectionErrorMsg}. Vui lòng kiểm tra submission-service có đang chạy không.`,
          HttpStatus.BAD_GATEWAY,
        );
      }

      // Generic error
      throw new HttpException(
        `Submission-service error: ${message || 'Unknown error'}`,
        HttpStatus.BAD_GATEWAY,
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
      // Use full URL instead of baseURL to avoid conflicts with other client services
      const fullUrl = `${this.submissionServiceUrl}/submissions/${submissionId}`;
      const response = await firstValueFrom(
        this.httpService.get(fullUrl, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          timeout: 10000,
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

  /**
   * Update submission status
   */
  async updateSubmissionStatus(
    submissionId: string,
    status: string,
    authToken: string,
  ): Promise<Submission> {
    try {
      const fullUrl = `${this.submissionServiceUrl}/submissions/${submissionId}/status`;
      console.log('[SubmissionClient] Updating submission status:', {
        fullUrl,
        submissionId,
        status,
        hasAuthToken: !!authToken,
        authTokenLength: authToken.length,
      });

      const response = await firstValueFrom(
        this.httpService.patch(
          fullUrl,
          { status },
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
            timeout: 10000,
          },
        ),
      );

      console.log('[SubmissionClient] Successfully updated submission status:', {
        submissionId,
        newStatus: response.data?.data?.status,
        responseStatus: response.status,
      });

      return response.data?.data;
    } catch (error: any) {
      const status = error.response?.status;
      const message =
        error.response?.data?.message ||
        error.message ||
        'Lỗi khi cập nhật status submission';

      console.error('[SubmissionClient] Error updating submission status:', {
        submissionId,
        status,
        error: error.message,
        errorName: error.name,
        errorCode: error.code,
        responseStatus: status,
        responseData: error.response?.data,
        stack: error.stack,
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

