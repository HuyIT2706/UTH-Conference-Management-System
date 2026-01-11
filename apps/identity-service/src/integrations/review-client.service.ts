import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface ReviewerActivityStats {
  assignmentCount: number;
  reviewCount: number;
  hasActiveAssignments: boolean;
  completedReviews: number;
}

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
   * Get reviewer activity stats (for Guard Clause Case 2)
   * Returns statistics about assignments and reviews for a reviewer
   * 
   * CRITICAL: Uses fail-secure approach - if service is down/error, THROWS ERROR
   * to PREVENT user deletion and potential data loss.
   */
  async getReviewerActivityStats(
    reviewerId: number, 
    authToken?: string
  ): Promise<ReviewerActivityStats> {
    try {
      const headers: Record<string, string> = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const fullUrl = `${this.reviewServiceUrl}/reviews/reviewer/${reviewerId}/stats`;
      const response = await firstValueFrom(
        this.httpService.get(fullUrl, {
          headers,
          timeout: 10000,
        }),
      );

      const stats = response.data?.data || response.data || {};
      return {
        assignmentCount: stats.assignmentCount || 0,
        reviewCount: stats.reviewCount || 0,
        hasActiveAssignments: stats.hasActiveAssignments || false,
        completedReviews: stats.completedReviews || 0,
      };
    } catch (error: any) {
      const status = error.response?.status;
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      
      // If service is down or unreachable, THROW ERROR to PREVENT deletion (fail-secure)
      // This ensures data integrity - we cannot verify user has no reviews if service is down
      if (!status || status >= 500) {
        console.error('[ReviewClient] Service seems down/unreachable, BLOCKING user deletion to prevent data loss:', {
          reviewerId,
          serviceUrl: this.reviewServiceUrl,
          error: errorMessage,
        });
        throw new HttpException(
          {
            code: 'REVIEW_SERVICE_UNAVAILABLE',
            message: 'Không thể xác minh người dùng có đang chấm bài hay không. Review-service đang không khả dụng. Vui lòng thử lại sau hoặc liên hệ admin.',
            detail: {
              reviewerId,
              service: 'review-service',
              reason: 'Service unavailable or timeout',
            },
          },
          HttpStatus.SERVICE_UNAVAILABLE, // 503
        );
      }

      // If reviewer not found (404), reviewer has no activity - safe to return zeros
      if (status === HttpStatus.NOT_FOUND) {
        return {
          assignmentCount: 0,
          reviewCount: 0,
          hasActiveAssignments: false,
          completedReviews: 0,
        };
      }

      // For other errors (401, 403, 400), log and throw to prevent deletion
      console.error('[ReviewClient] Error getting reviewer activity stats, BLOCKING deletion:', {
        reviewerId,
        status,
        message: errorMessage,
      });

      throw new HttpException(
        {
          code: 'REVIEW_SERVICE_ERROR',
          message: `Không thể kiểm tra hoạt động reviewer của người dùng: ${errorMessage}`,
          detail: {
            reviewerId,
            status,
            service: 'review-service',
          },
        },
        status && status >= 400 && status < 600 ? status : HttpStatus.BAD_GATEWAY, // 502
      );
    }
  }
}
