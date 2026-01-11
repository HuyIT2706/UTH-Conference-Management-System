import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Conference } from '../conferences/entities/conference.entity';
import { Track } from '../conferences/entities/track.entity';
import { ConferenceMember, ConferenceMemberRole } from '../conferences/entities/conference-member.entity';
import { SubmissionClientService } from '../integrations/submission-client.service';

@Injectable()
export class ReportingService {
  constructor(
    @InjectRepository(Conference)
    private conferenceRepository: Repository<Conference>,
    @InjectRepository(Track)
    private trackRepository: Repository<Track>,
    @InjectRepository(ConferenceMember)
    private conferenceMemberRepository: Repository<ConferenceMember>,
    private submissionClient: SubmissionClientService,
  ) {}

  async getConferenceStats(conferenceId: number): Promise<{
    totalTracks: number;
    totalMembers: number;
    membersByRole: Record<string, number>;
    tracks: Array<{ id: number; name: string }>;
  }> {
    const conference = await this.conferenceRepository.findOne({
      where: { 
        id: conferenceId,
        deletedAt: IsNull(),
        isActive: true,
      },
    });

    if (!conference) {
      throw new NotFoundException(`Conference với ID ${conferenceId} không tồn tại`);
    }

    const tracks = await this.trackRepository.find({
      where: { 
        conferenceId,
        deletedAt: IsNull(),
        isActive: true,
      },
    });

    const members = await this.conferenceMemberRepository.find({
      where: { conferenceId },
    });

    const membersByRole: Record<string, number> = {};
    members.forEach((member) => {
      membersByRole[member.role] = (membersByRole[member.role] || 0) + 1;
    });

    return {
      totalTracks: tracks.length,
      totalMembers: members.length,
      membersByRole,
      tracks: tracks.map((track) => ({
        id: track.id,
        name: track.name,
      })),
    };
  }

  /**
   * Get submission statistics
   */
  async getSubmissionStats(
    conferenceId: number,
    authToken: string,
  ): Promise<{
    totalSubmissions: number;
    submissionsByTrack: Array<{
      trackId: number;
      trackName: string;
      count: number;
      accepted: number;
      rejected: number;
    }>;
    submissionsByStatus: Record<string, number>;
    acceptanceRate: number;
    totalAccepted: number;
    totalRejected: number;
  }> {
    try {
      const stats = await this.submissionClient.getSubmissionStatistics(
        conferenceId,
        authToken,
      );

      // Map track names from database
      const tracks = await this.trackRepository.find({
        where: { 
          conferenceId,
          deletedAt: IsNull(),
          isActive: true,
        },
      });
      const trackMap = new Map(tracks.map((t) => [t.id, t.name]));

      const submissionsByTrack = stats.submissionsByTrack.map((trackStat) => ({
        ...trackStat,
        trackName: trackMap.get(trackStat.trackId) || `Track ${trackStat.trackId}`,
      }));

      return {
        totalSubmissions: stats.totalSubmissions,
        submissionsByTrack,
        submissionsByStatus: stats.submissionsByStatus,
        acceptanceRate: stats.acceptanceRate,
        totalAccepted: stats.totalAccepted,
        totalRejected: stats.totalRejected,
      };
    } catch (error: any) {
      // Only log if it's not a service unavailability error (502)
      const status = error?.status || error?.response?.status;
      if (status !== 502) {
        console.error('[ReportingService] Error getting submission stats:', error);
      }
      // Return empty stats if submission-service is unavailable
      return {
        totalSubmissions: 0,
        submissionsByTrack: [],
        submissionsByStatus: {},
        acceptanceRate: 0,
        totalAccepted: 0,
        totalRejected: 0,
      };
    }
  }

  /**
   * Get acceptance rate
   */
  async getAcceptanceRate(
    conferenceId: number,
    authToken: string,
  ): Promise<{
    acceptanceRate: number;
    totalAccepted: number;
    totalRejected: number;
    totalSubmissions: number;
  }> {
    try {
      const stats = await this.submissionClient.getSubmissionStatistics(
        conferenceId,
        authToken,
      );

      return {
        acceptanceRate: stats.acceptanceRate,
        totalAccepted: stats.totalAccepted,
        totalRejected: stats.totalRejected,
        totalSubmissions: stats.totalSubmissions,
      };
    } catch (error: any) {
      console.error('[ReportingService] Error getting acceptance rate:', error);
      return {
        acceptanceRate: 0,
        totalAccepted: 0,
        totalRejected: 0,
        totalSubmissions: 0,
      };
    }
  }

  /**
   * Get comprehensive dashboard statistics
   */
  async getDashboardStats(
    conferenceId: number,
    authToken: string,
  ): Promise<{
    totalSubmissions: number;
    totalSubmissionsChange?: number;
    acceptanceRate: number;
    acceptanceRateChange?: number;
    totalAccepted: number;
    totalRejected: number;
    totalReviewers: number;
    averageSLA?: number;
    averageSLAChange?: number;
    submissionsByTrack: Array<{
      trackId: number;
      trackName: string;
      submissions: number;
      accepted: number;
      rejected: number;
    }>;
    statusDistribution: {
      accepted: number;
      rejected: number;
      reviewing: number;
    };
  }> {
    const conference = await this.conferenceRepository.findOne({
      where: { 
        id: conferenceId,
        deletedAt: IsNull(),
        isActive: true,
      },
    });

    if (!conference) {
      throw new NotFoundException(`Conference với ID ${conferenceId} không tồn tại`);
    }

    // Get submission stats (with error handling)
    // getSubmissionStats already handles errors and returns empty stats
    const submissionStats = await this.getSubmissionStats(conferenceId, authToken);

    // Get reviewers count (members with REVIEWER role)
    const members = await this.conferenceMemberRepository.find({
      where: { conferenceId },
    });
    const totalReviewers = members.filter(
      (m) => m.role === ConferenceMemberRole.REVIEWER,
    ).length;

    // Calculate status distribution percentages
    const total = submissionStats.totalSubmissions;
    const statusDistribution = {
      accepted:
        total > 0
          ? Math.round((submissionStats.totalAccepted / total) * 100)
          : 0,
      rejected:
        total > 0
          ? Math.round((submissionStats.totalRejected / total) * 100)
          : 0,
      reviewing:
        total > 0
          ? Math.round(
              ((submissionStats.submissionsByStatus['REVIEWING'] || 0) / total) *
                100,
            )
          : 0,
    };

    return {
      totalSubmissions: submissionStats.totalSubmissions,
      acceptanceRate: submissionStats.acceptanceRate,
      totalAccepted: submissionStats.totalAccepted,
      totalRejected: submissionStats.totalRejected,
      totalReviewers,
      submissionsByTrack: submissionStats.submissionsByTrack.map((t) => ({
        trackId: t.trackId,
        trackName: t.trackName,
        submissions: t.count,
        accepted: t.accepted,
        rejected: t.rejected,
      })),
      statusDistribution,
    };
  }
}












