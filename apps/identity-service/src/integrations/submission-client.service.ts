import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SubmissionClientService {
  private readonly submissionServiceUrl: string;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    const isDocker = process.env.DOCKER_ENV === 'true' || 
                     process.env.SUBMISSION_SERVICE_URL?.includes('submission-service');
    
    this.submissionServiceUrl =
      this.configService.get<string>('SUBMISSION_SERVICE_URL') ||
      (isDocker 
        ? 'http://submission-service:3003/api' 
        : 'http://localhost:3003/api');

    console.log('[SubmissionClient] Initialized with URL:', this.submissionServiceUrl);
  }

  /**
   * Count submissions by authorId (for Guard Clause Case 1)
   * Returns the number of submissions where the user is an author
   * 
   * CRITICAL: Uses fail-secure approach - if service is down/error, THROWS ERROR
   * to PREVENT user deletion and potential data loss.
   */
  async countSubmissionsByAuthorId(authorId: number, authToken?: string): Promise<number> {
    try {
      const headers: Record<string, string> = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const fullUrl = `${this.submissionServiceUrl}/submissions/author/${authorId}/count`;
      const response = await firstValueFrom(
        this.httpService.get(fullUrl, {
          headers,
          timeout: 10000,
        }),
      );

      const count = response.data?.data?.count || response.data?.count || 0;
      return typeof count === 'number' ? count : 0;
    } catch (error: any) {
      const status = error.response?.status;
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      
      // If service is down or unreachable, THROW ERROR to PREVENT deletion (fail-secure)
      // This ensures data integrity - we cannot verify user has no submissions if service is down
      if (!status || status >= 500) {
        console.error('[SubmissionClient] Service seems down/unreachable, BLOCKING user deletion to prevent data loss:', {
          authorId,
          serviceUrl: this.submissionServiceUrl,
          error: errorMessage,
        });
        throw new HttpException(
          {
            code: 'SUBMISSION_SERVICE_UNAVAILABLE',
            message: 'Không thể xác minh người dùng có bài nộp hay không. Submission-service đang không khả dụng. Vui lòng thử lại sau hoặc liên hệ admin.',
            detail: {
              authorId,
              service: 'submission-service',
              reason: 'Service unavailable or timeout',
            },
          },
          HttpStatus.SERVICE_UNAVAILABLE, // 503
        );
      }

      // If user not found (404), user has no submissions - safe to return 0
      if (status === HttpStatus.NOT_FOUND) {
        return 0;
      }

      // For other errors (401, 403, 400), log and throw to prevent deletion
      console.error('[SubmissionClient] Error counting submissions by author, BLOCKING deletion:', {
        authorId,
        status,
        message: errorMessage,
      });

      throw new HttpException(
        {
          code: 'SUBMISSION_SERVICE_ERROR',
          message: `Không thể kiểm tra submissions của người dùng: ${errorMessage}`,
          detail: {
            authorId,
            status,
            service: 'submission-service',
          },
        },
        status && status >= 400 && status < 600 ? status : HttpStatus.BAD_GATEWAY, // 502
      );
    }
  }
}
