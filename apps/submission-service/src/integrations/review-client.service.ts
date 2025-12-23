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
    this.reviewServiceUrl =
      this.configService.get<string>('REVIEW_SERVICE_URL') ||
      'http://localhost:3003/api';

    this.httpService.axiosRef.defaults.baseURL = this.reviewServiceUrl;
    this.httpService.axiosRef.defaults.timeout = 10000;
  }

  /**
   * Get anonymized reviews for a submission (for authors).
   * Chỉ trả về commentForAuthor, không trả về commentForPC.
   * Nếu review-service chưa hỗ trợ endpoint → trả về mảng rỗng, không làm hỏng luồng chính.
   */
  async getAnonymizedReviewsForAuthor(
    submissionId: string,
  ): Promise<Array<{ score: number; commentForAuthor: string; recommendation: string }>> {
    try {
      // Note: This requires review-service to have an endpoint for authors
      // For now, we'll create a placeholder that can be implemented later
      // The review-service needs to add: GET /reviews/submission/:id/anonymized
      const response = await firstValueFrom(
        this.httpService.get(`/reviews/submission/${submissionId}/anonymized`),
      );
      return response.data.data || [];
    } catch (error: any) {
      const status = error.response?.status;

      // Endpoint chưa tồn tại hoặc submission chưa có review → coi như chưa có dữ liệu
      if (status === HttpStatus.NOT_FOUND) {
        return [];
      }

      // Các lỗi khác: log nhẹ và trả về rỗng, tránh làm hỏng luồng tác giả xem submission
      // eslint-disable-next-line no-console
      console.warn(
        '[ReviewClientService] Lỗi khi lấy anonymized reviews:',
        error.message || error,
      );
      return [];
    }
  }

  /**
   * Get assignment IDs for a reviewer.
   * Hiện tại chỉ dùng để hỗ trợ RBAC cho reviewer; lỗi sẽ được log và trả về mảng rỗng.
   */
  async getReviewerAssignments(reviewerId: number): Promise<number[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`/reviews/assignments/me`),
      );
      const assignments = response.data.data || [];
      return assignments.map((a: any) => a.submissionId);
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.warn(
        '[ReviewClientService] Lỗi khi lấy assignments cho reviewer:',
        error.message || error,
      );
      return [];
    }
  }
}
