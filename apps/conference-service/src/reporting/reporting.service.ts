import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conference } from '../conferences/entities/conference.entity';
import { Track } from '../conferences/entities/track.entity';
import { ConferenceMember } from '../conferences/entities/conference-member.entity';

@Injectable()
export class ReportingService {
  constructor(
    @InjectRepository(Conference)
    private conferenceRepository: Repository<Conference>,
    @InjectRepository(Track)
    private trackRepository: Repository<Track>,
    @InjectRepository(ConferenceMember)
    private conferenceMemberRepository: Repository<ConferenceMember>,
  ) {}

  async getConferenceStats(conferenceId: number): Promise<{
    totalTracks: number;
    totalMembers: number;
    membersByRole: Record<string, number>;
    tracks: Array<{ id: number; name: string }>;
  }> {
    const conference = await this.conferenceRepository.findOne({
      where: { id: conferenceId },
    });

    if (!conference) {
      throw new NotFoundException(`Conference với ID ${conferenceId} không tồn tại`);
    }

    const tracks = await this.trackRepository.find({
      where: { conferenceId },
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
   * Note: This requires integration with submission-service
   */
  async getSubmissionStats(conferenceId: number): Promise<{
    totalSubmissions: number;
    submissionsByTrack: Array<{ trackId: number; trackName: string; count: number }>;
    submissionsByStatus: Record<string, number>;
    acceptanceRate: number;
  }> {
    // TODO: Integrate with submission-service
    // For now, return mock data structure
    return {
      totalSubmissions: 0,
      submissionsByTrack: [],
      submissionsByStatus: {},
      acceptanceRate: 0,
    };
  }

  /**
   * Get acceptance rate
   */
  async getAcceptanceRate(conferenceId: number): Promise<{
    acceptanceRate: number;
    totalAccepted: number;
    totalRejected: number;
    totalSubmissions: number;
  }> {
    // TODO: Integrate with submission-service
    return {
      acceptanceRate: 0,
      totalAccepted: 0,
      totalRejected: 0,
      totalSubmissions: 0,
    };
  }
}




