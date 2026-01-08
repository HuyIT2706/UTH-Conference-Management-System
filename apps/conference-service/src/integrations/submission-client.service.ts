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
  submittedAt?: string;
}

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
   * Get all submissions for a conference
   */
  async getSubmissionsByConference(
    conferenceId: number,
    authToken: string,
    trackId?: number,
    status?: string,
  ): Promise<Submission[]> {
    try {
      const params: Record<string, any> = { conferenceId };
      if (trackId) params.trackId = trackId;
      if (status) params.status = status;

      const response = await firstValueFrom(
        this.httpService.get(`${this.submissionServiceUrl}/submissions`, {
          params,
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          timeout: 10000,
        }),
      );

      return response.data?.data || [];
    } catch (error: any) {
      const status = error.response?.status;
      const message =
        error.response?.data?.message ||
        error.message ||
        'Lỗi khi lấy danh sách submissions';

      // Log warning instead of error for service unavailability (502)
      if (status === HttpStatus.BAD_GATEWAY || !status) {
        console.warn('[SubmissionClient] Submission-service unavailable:', {
          conferenceId,
          message: 'Submission-service không khả dụng hoặc chưa chạy',
        });
      } else {
        console.error('[SubmissionClient] Error getting submissions:', {
          conferenceId,
          status,
          error: error.message,
        });
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
   * Get submission statistics for a conference
   */
  async getSubmissionStatistics(
    conferenceId: number,
    authToken: string,
  ): Promise<{
    totalSubmissions: number;
    submissionsByTrack: Array<{ trackId: number; trackName: string; count: number; accepted: number; rejected: number }>;
    submissionsByStatus: Record<string, number>;
    acceptanceRate: number;
    totalAccepted: number;
    totalRejected: number;
  }> {
    try {
      const submissions = await this.getSubmissionsByConference(
        conferenceId,
        authToken,
      );

      const submissionsByStatus: Record<string, number> = {};
      const submissionsByTrackMap = new Map<
        number,
        { trackName: string; count: number; accepted: number; rejected: number }
      >();

      let totalAccepted = 0;
      let totalRejected = 0;

      submissions.forEach((submission) => {
        // Count by status
        submissionsByStatus[submission.status] =
          (submissionsByStatus[submission.status] || 0) + 1;

        // Count by track
        if (!submissionsByTrackMap.has(submission.trackId)) {
          submissionsByTrackMap.set(submission.trackId, {
            trackName: `Track ${submission.trackId}`,
            count: 0,
            accepted: 0,
            rejected: 0,
          });
        }

        const trackStat = submissionsByTrackMap.get(submission.trackId)!;
        trackStat.count += 1;

        if (submission.status === 'ACCEPTED') {
          trackStat.accepted += 1;
          totalAccepted += 1;
        } else if (submission.status === 'REJECTED') {
          trackStat.rejected += 1;
          totalRejected += 1;
        }
      });

      const totalSubmissions = submissions.length;
      const acceptanceRate =
        totalSubmissions > 0
          ? (totalAccepted / totalSubmissions) * 100
          : 0;

      const submissionsByTrack = Array.from(
        submissionsByTrackMap.entries(),
      ).map(([trackId, stat]) => ({
        trackId,
        ...stat,
      }));

      return {
        totalSubmissions,
        submissionsByTrack,
        submissionsByStatus,
        acceptanceRate: Math.round(acceptanceRate * 10) / 10,
        totalAccepted,
        totalRejected,
      };
    } catch (error: any) {
      // Error already logged in getSubmissionsByConference
      throw error;
    }
  }
}

