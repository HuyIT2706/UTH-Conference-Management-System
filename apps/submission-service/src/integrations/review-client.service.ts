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
  async getAnonymizedReviewsForAuthor(
    submissionId: string,
  ): Promise<Array<{ score: number; commentForAuthor: string; recommendation: string }>> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`/reviews/submission/${submissionId}/anonymized`),
      );
      return response.data.data || [];
    } catch (error: any) {
      const status = error.response?.status;
      if (status === HttpStatus.NOT_FOUND) {
        return [];
      }
      console.warn(
        '[ReviewClientService] Lỗi khi lấy anonymized reviews:',
        error.message || error,
      );
      return [];
    }
  }
  async getReviewerAssignments(reviewerId: number): Promise<number[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`/reviews/assignments/me`),
      );
      const assignments = response.data.data || [];
      return assignments.map((a: any) => a.submissionId);
    } catch (error: any) {
      console.warn(
        '[ReviewClientService] Lỗi khi lấy assignments cho reviewer:',
        error.message || error,
      );
      return [];
    }
  }
}
