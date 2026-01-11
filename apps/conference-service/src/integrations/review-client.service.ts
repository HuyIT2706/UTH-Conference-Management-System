import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ReviewClientService {
  private readonly reviewServiceUrl: string;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    const isDocker = process.env.DOCKER_ENV === 'true' || 
                     process.env.REVIEW_SERVICE_URL?.includes('review-service');
    
    this.reviewServiceUrl =
      this.configService.get<string>('REVIEW_SERVICE_URL') ||
      (isDocker 
        ? 'http://review-service:3004/api' 
        : 'http://localhost:3004/api');

    console.log('[ReviewClient] Initialized with URL:', this.reviewServiceUrl);
  }

  /**
   * Check if user has reviewed submissions (for Guard Clause Case 3)
   * Used by conference-service to check if track member can be removed
   * 
   * CRITICAL: Uses fail-secure approach - if service is down/error, THROWS ERROR
   * to PREVENT track member removal and potential data loss.
   */
  async hasUserReviewedSubmissions(
    reviewerId: number,
    submissionIds: string[],
    authToken: string,
  ): Promise<boolean> {
    try {
      if (!submissionIds || submissionIds.length === 0) {
        return false;
      }

      // Call review-service to check if reviewer has assignments for these submissions
      // We'll use the getReviewerActivityStats endpoint and filter by submissionIds
      // For now, we'll make a simple check by calling the stats endpoint
      // In production, you might want a dedicated endpoint for this check
      const response = await firstValueFrom(
        this.httpService.get(`${this.reviewServiceUrl}/reviews/reviewer/${reviewerId}/stats`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          timeout: 10000,
        }),
      );

      const stats = response.data?.data || response.data || {};
      // If reviewer has any assignments or reviews, we need to check if they're for submissions in this track
      // For now, if they have any activity, we'll assume they might have reviewed submissions in this track
      // This is a simplified check - in production, you'd want to verify the specific submissionIds
      return (stats.assignmentCount || 0) > 0 || (stats.reviewCount || 0) > 0;
    } catch (error: any) {
      const status = error.response?.status;
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      
      // If service is down or unreachable, THROW ERROR to PREVENT removal (fail-secure)
      // This ensures data integrity - we cannot verify user has no reviews if service is down
      if (!status || status >= 500) {
        console.error('[ReviewClient] Service seems down/unreachable, BLOCKING track member removal to prevent data loss:', {
          reviewerId,
          submissionIdsCount: submissionIds?.length || 0,
          serviceUrl: this.reviewServiceUrl,
          error: errorMessage,
        });
        throw new HttpException(
          {
            code: 'REVIEW_SERVICE_UNAVAILABLE',
            message: 'Không thể xác minh người dùng có đã review submissions trong track này hay không. Review-service đang không khả dụng. Vui lòng thử lại sau hoặc liên hệ admin.',
            detail: {
              reviewerId,
              submissionIdsCount: submissionIds?.length || 0,
              service: 'review-service',
              reason: 'Service unavailable or timeout',
            },
          },
          HttpStatus.SERVICE_UNAVAILABLE, // 503
        );
      }

      // If reviewer not found (404), reviewer has no activity - safe to return false
      if (status === HttpStatus.NOT_FOUND) {
        return false;
      }

      // For other errors (401, 403, 400), log and throw to prevent removal
      console.error('[ReviewClient] Error checking user reviewed submissions, BLOCKING removal:', {
        reviewerId,
        submissionIdsCount: submissionIds?.length || 0,
        status,
        message: errorMessage,
      });

      throw new HttpException(
        {
          code: 'REVIEW_SERVICE_ERROR',
          message: `Không thể kiểm tra reviews của người dùng trong track này: ${errorMessage}`,
          detail: {
            reviewerId,
            submissionIdsCount: submissionIds?.length || 0,
            status,
            service: 'review-service',
          },
        },
        status && status >= 400 && status < 600 ? status : HttpStatus.BAD_GATEWAY, // 502
      );
    }
  }
}
