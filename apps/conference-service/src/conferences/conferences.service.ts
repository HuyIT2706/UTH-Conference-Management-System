import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conference } from './entities/conference.entity';
import { Track } from './entities/track.entity';
import {
  ConferenceMember,
  ConferenceMemberRole,
} from './entities/conference-member.entity';
import { TrackMember } from './entities/track-member.entity';
import { CreateConferenceDto } from './dto/create-conference.dto';
import { UpdateConferenceDto } from './dto/update-conference.dto';
import { CfpSetting } from '../cfp/entities/cfp-setting.entity';
import { SetCfpSettingDto } from '../cfp/dto/set-cfp-setting.dto';
import { UpdateTrackDto } from './dto/update-track.dto';
import { AddConferenceMemberDto } from './dto/add-conference-member.dto';
import { AddTrackMemberDto } from './dto/add-track-member.dto';
import { EmailService } from '../common/services/email.service';
import { IdentityClientService } from '../integrations/identity-client.service';

@Injectable()
export class ConferencesService {
  constructor(
    @InjectRepository(Conference)
    private readonly conferenceRepository: Repository<Conference>,
    @InjectRepository(Track)
    private readonly trackRepository: Repository<Track>,
    @InjectRepository(ConferenceMember)
    private readonly conferenceMemberRepository: Repository<ConferenceMember>,
    @InjectRepository(TrackMember)
    private readonly trackMemberRepository: Repository<TrackMember>,
    @InjectRepository(CfpSetting)
    private readonly cfpSettingRepository: Repository<CfpSetting>,
    private readonly emailService: EmailService,
    private readonly identityClient: IdentityClientService,
  ) {}

  async createConference(
    dto: CreateConferenceDto,
    organizerId: number,
  ): Promise<Conference> {
    this.ensureValidDateRange(dto.startDate, dto.endDate);

    const conference = this.conferenceRepository.create({
      name: dto.name,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      venue: dto.venue,
      description: dto.description ?? null,
      shortDescription: dto.shortDescription ?? null,
      contactEmail: dto.contactEmail ?? null,
      organizerId,
    });

    const saved = await this.conferenceRepository.save(conference);

    const member = this.conferenceMemberRepository.create({
      conferenceId: saved.id,
      userId: organizerId,
      role: ConferenceMemberRole.CHAIR,
    });
    await this.conferenceMemberRepository.save(member);

    return saved;
  }

  async findAll(): Promise<Conference[]> {
    return this.conferenceRepository.find({ relations: ['tracks', 'members', 'cfpSetting'] });
  }

  async findOne(id: number): Promise<Conference> {
    const conference = await this.conferenceRepository.findOne({
      where: { id },
      relations: ['tracks', 'members', 'cfpSetting'],
    });

    if (!conference) {
      throw new NotFoundException('Conference not found');
    }

    return conference;
  }

  async addTrack(
    conferenceId: number,
    name: string,
    user: { id: number; roles: string[] },
  ): Promise<Track> {
    await this.ensureCanManageConference(conferenceId, user);
    const conference = await this.getConferenceOrThrow(conferenceId);
    const track = this.trackRepository.create({
      name,
      conferenceId: conferenceId,
      conference,
    });

    return this.trackRepository.save(track);
  }

  async setCfpSettings(
    conferenceId: number,
    dto: SetCfpSettingDto,
    user: { id: number; roles: string[] },
  ): Promise<CfpSetting> {
    await this.ensureCanManageConference(conferenceId, user);
    const conference = await this.getConferenceOrThrow(conferenceId);
    this.ensureValidCfpDates(dto);

    let setting = await this.cfpSettingRepository.findOne({
      where: { conferenceId },
    });

    if (!setting) {
      setting = this.cfpSettingRepository.create({
        conferenceId,
        conference,
      });
    }

    setting.submissionDeadline = new Date(dto.submissionDeadline);
    setting.reviewDeadline = new Date(dto.reviewDeadline);
    setting.notificationDate = new Date(dto.notificationDate);
    setting.cameraReadyDeadline = new Date(dto.cameraReadyDeadline);

    return this.cfpSettingRepository.save(setting);
  }

  async updateConference(
    id: number,
    dto: UpdateConferenceDto,
    user: { id: number; roles: string[] },
  ): Promise<Conference> {
    await this.ensureCanManageConference(id, user);
    const conference = await this.getConferenceOrThrow(id);

    const nextStart = dto.startDate ?? conference.startDate.toISOString();
    const nextEnd = dto.endDate ?? conference.endDate.toISOString();
    this.ensureValidDateRange(nextStart, nextEnd);

    Object.assign(conference, {
      name: dto.name ?? conference.name,
      startDate: dto.startDate ? new Date(dto.startDate) : conference.startDate,
      endDate: dto.endDate ? new Date(dto.endDate) : conference.endDate,
      venue: dto.venue ?? conference.venue,
      description: dto.description !== undefined ? dto.description : conference.description,
      shortDescription: dto.shortDescription !== undefined ? dto.shortDescription : conference.shortDescription,
      contactEmail: dto.contactEmail !== undefined ? dto.contactEmail : conference.contactEmail,
    });

    return this.conferenceRepository.save(conference);
  }

  async deleteConference(
    id: number,
    user: { id: number; roles: string[] },
  ): Promise<void> {
    await this.ensureCanManageConference(id, user);
    const conference = await this.getConferenceOrThrow(id);
    await this.conferenceRepository.remove(conference);
  }

  async updateTrack(
    conferenceId: number,
    trackId: number,
    dto: UpdateTrackDto,
    user: { id: number; roles: string[] },
  ): Promise<Track> {
    await this.ensureCanManageConference(conferenceId, user);
    const track = await this.trackRepository.findOne({
      where: { id: trackId, conferenceId },
    });
    if (!track) {
      throw new NotFoundException('Không tìm thấy chủ đề');
    }
    
    if (dto.name !== undefined && dto.name !== null) {
      track.name = dto.name;
    }
    
    await this.trackRepository.save(track);
    
    const updated = await this.trackRepository.findOne({
      where: { id: trackId, conferenceId },
    });
    
    if (!updated) {
      throw new NotFoundException('Không tìm thấy chủ đề sau khi cập nhật');
    }
    
    return updated;
  }

  async deleteTrack(
    conferenceId: number,
    trackId: number,
    user: { id: number; roles: string[] },
  ): Promise<void> {
    await this.ensureCanManageConference(conferenceId, user);
    const track = await this.trackRepository.findOne({
      where: { id: trackId, conferenceId },
    });
    if (!track) {
      throw new NotFoundException('Chủ đề không tồn tại');
    }
    await this.trackRepository.remove(track);
  }

  async listMembers(
    conferenceId: number,
    user: { id: number; roles: string[] },
  ): Promise<ConferenceMember[]> {
    await this.ensureCanManageConference(conferenceId, user);
    await this.getConferenceOrThrow(conferenceId);
    return this.conferenceMemberRepository.find({
      where: { conferenceId },
    });
  }

  async addMember(
    conferenceId: number,
    dto: AddConferenceMemberDto,
    user: { id: number; roles: string[] },
  ): Promise<ConferenceMember> {
    await this.ensureCanManageConference(conferenceId, user);
    await this.getConferenceOrThrow(conferenceId);

    const existing = await this.conferenceMemberRepository.findOne({
      where: { conferenceId, userId: dto.userId },
    });
    if (existing) {
      throw new BadRequestException('Người dùng đã là thành viên của hội nghị này');
    }

    const member = this.conferenceMemberRepository.create({
      conferenceId,
      userId: dto.userId,
      role: dto.role,
    });
    return this.conferenceMemberRepository.save(member);
  }

  async removeMember(
    conferenceId: number,
    memberUserId: number,
    user: { id: number; roles: string[] },
  ): Promise<void> {
    await this.ensureCanManageConference(conferenceId, user);
    const member = await this.conferenceMemberRepository.findOne({
      where: { conferenceId, userId: memberUserId },
    });
    if (!member) {
      throw new NotFoundException('Không tìm thấy thành viên này');
    }
    await this.conferenceMemberRepository.remove(member);
  }

  private ensureValidDateRange(start: string, end: string) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('Ngày bắt đầu/kết thúc không hợp lệ');
    }
    if (startDate >= endDate) {
      throw new BadRequestException('startDate phải trước endDate');
    }
  }

  private ensureValidCfpDates(dto: SetCfpSettingDto) {
    const submissionDeadline = new Date(dto.submissionDeadline);
    const reviewDeadline = new Date(dto.reviewDeadline);
    const notificationDate = new Date(dto.notificationDate);
    const cameraReadyDeadline = new Date(dto.cameraReadyDeadline);

    if (
      [
        submissionDeadline,
        reviewDeadline,
        notificationDate,
        cameraReadyDeadline,
      ].some((d) => Number.isNaN(d.getTime()))
    ) {
      throw new BadRequestException('Mốc thời gian CFP không hợp lệ');
    }

    if (
      !(
        submissionDeadline <= reviewDeadline &&
        reviewDeadline <= notificationDate &&
        notificationDate <= cameraReadyDeadline
      )
    ) {
      throw new BadRequestException(
        'Thứ tự mốc thời gian CFP không hợp lệ (submission <= review <= notification <= camera ready)',
      );
    }
  }

  async ensureCanManageConference(
    conferenceId: number,
    user: { id: number; roles: string[] },
  ) {
    const roles = user?.roles || [];
    // ADMIN và CHAIR có quyền quản lý tất cả conferences
    if (roles.includes('ADMIN') || roles.includes('CHAIR')) {
      return;
    }
    // Nếu không phải ADMIN/CHAIR, phải là member của conference với role CHAIR
    const membership = await this.conferenceMemberRepository.findOne({
      where: { conferenceId, userId: user.id },
    });
    if (!membership || membership.role !== ConferenceMemberRole.CHAIR) {
      throw new ForbiddenException('Bạn không có quyền quản lý hội nghị này');
    }
  }

  async findAllTracks(conferenceId: number): Promise<Track[]> {
    return await this.trackRepository.find({
      where: { conferenceId },
      order: { id: 'ASC' },
    });
  }

  async getCfpSetting(conferenceId: number): Promise<CfpSetting | null> {
    return await this.cfpSettingRepository.findOne({
      where: { conferenceId },
    });
  }

  private async getConferenceOrThrow(id: number): Promise<Conference> {
    const conference = await this.conferenceRepository.findOne({
      where: { id },
    });
    if (!conference) {
      throw new NotFoundException('Không tìm thấy hội nghị');
    }
    return conference;
  }

  async listTrackMembers(
    trackId: number,
    user: { id: number; roles: string[] },
  ): Promise<TrackMember[]> {
    const track = await this.trackRepository.findOne({
      where: { id: trackId },
    });
    if (!track) {
      throw new NotFoundException('Không tìm thấy chủ đề');
    }
    await this.ensureCanManageConference(track.conferenceId, user);
    return this.trackMemberRepository.find({
      where: { trackId },
      order: { createdAt: 'DESC' },
    });
  }

  async addTrackMember(
    trackId: number,
    dto: AddTrackMemberDto,
    user: { id: number; roles: string[] },
    authToken?: string,
  ): Promise<TrackMember> {
    const track = await this.trackRepository.findOne({
      where: { id: trackId },
      relations: ['conference'],
    });
    if (!track) {
      throw new NotFoundException('Không tìm thấy chủ đề');
    }
    await this.ensureCanManageConference(track.conferenceId, user);

    const existing = await this.trackMemberRepository.findOne({
      where: { trackId, userId: dto.userId },
    });
    if (existing) {
      throw new BadRequestException('Người dùng đã là thành viên của chủ đề này');
    }

    const member = this.trackMemberRepository.create({
      trackId,
      userId: dto.userId,
      track,
    });
    const savedMember = await this.trackMemberRepository.save(member);

    // Send email notification to reviewer (async, don't wait for it)
    if (authToken) {
      this.sendTrackAssignmentEmail(savedMember, track, authToken).catch((error) => {
        console.error('[ConferencesService] Failed to send track assignment email:', error);
        // Don't throw - email failure shouldn't break the API response
      });
    }

    return savedMember;
  }

  /**
   * Send email notification when reviewer is assigned to track
   */
  private async sendTrackAssignmentEmail(
    member: TrackMember,
    track: Track,
    authToken: string,
  ): Promise<void> {
    try {
      // Get user info from identity-service
      const userInfo = await this.identityClient.getUserById(member.userId, authToken);
      if (!userInfo || !userInfo.email) {
        console.warn(`[ConferencesService] Cannot send email: User ${member.userId} not found or has no email`);
        return;
      }

      // Get conference info
      const conference = await this.conferenceRepository.findOne({
        where: { id: track.conferenceId },
      });

      await this.emailService.sendTrackAssignmentEmail(
        userInfo.email,
        userInfo.fullName || 'Reviewer',
        track.name,
        conference?.name || 'Hội nghị',
      );
    } catch (error) {
      console.error('[ConferencesService] Error sending track assignment email:', error);
      // Don't throw - email failure shouldn't break the API response
    }
  }

  async removeTrackMember(
    trackId: number,
    memberUserId: number,
    user: { id: number; roles: string[] },
  ): Promise<void> {
    const track = await this.trackRepository.findOne({
      where: { id: trackId },
    });
    if (!track) {
      throw new NotFoundException('Không tìm thấy chủ đề');
    }
    await this.ensureCanManageConference(track.conferenceId, user);

    const member = await this.trackMemberRepository.findOne({
      where: { trackId, userId: memberUserId },
    });
    if (!member) {
      throw new NotFoundException('Không tìm thấy thành viên này');
    }
    await this.trackMemberRepository.remove(member);
  }

  // Get tracks assigned to a reviewer
  async getMyTrackAssignments(userId: number): Promise<TrackMember[]> {
    const assignments = await this.trackMemberRepository.find({
      where: { userId },
      relations: ['track', 'track.conference'],
      order: { createdAt: 'DESC' },
    });
    // Đảm bảo field status luôn có giá trị (mặc định là PENDING nếu null/undefined)
    return assignments.map((assignment) => ({
      ...assignment,
      status: assignment.status || 'PENDING',
    }));
  }

  // Accept track assignment
  async acceptTrackAssignment(
    trackId: number,
    userId: number,
  ): Promise<TrackMember> {
    const member = await this.trackMemberRepository.findOne({
      where: { trackId, userId },
      relations: ['track'],
    });
    if (!member) {
      throw new NotFoundException('Không tìm thấy phân công này');
    }
    if (member.status === 'ACCEPTED') {
      throw new BadRequestException('Phân công đã được chấp nhận');
    }
    if (member.status === 'REJECTED') {
      throw new BadRequestException('Phân công đã bị từ chối');
    }
    member.status = 'ACCEPTED';
    return this.trackMemberRepository.save(member);
  }

  // Check if reviewer has accepted track assignment
  async checkReviewerTrackAssignment(
    reviewerId: number,
    trackId: number,
  ): Promise<{ hasAccepted: boolean }> {
    console.log('[ConferencesService] checkReviewerTrackAssignment:', { reviewerId, trackId });
    const member = await this.trackMemberRepository.findOne({
      where: {
        userId: reviewerId,
        trackId: trackId,
        status: 'ACCEPTED',
      },
    });
    console.log('[ConferencesService] checkReviewerTrackAssignment result:', { hasAccepted: !!member, memberId: member?.id });
    return { hasAccepted: !!member };
  }

  // Reject track assignment
  async rejectTrackAssignment(
    trackId: number,
    userId: number,
  ): Promise<TrackMember> {
    const member = await this.trackMemberRepository.findOne({
      where: { trackId, userId },
      relations: ['track'],
    });
    if (!member) {
      throw new NotFoundException('Không tìm thấy phân công này');
    }
    if (member.status === 'REJECTED') {
      throw new BadRequestException('Phân công đã bị từ chối');
    }
    if (member.status === 'ACCEPTED') {
      throw new BadRequestException('Không thể từ chối phân công đã được chấp nhận');
    }
    member.status = 'REJECTED';
    return this.trackMemberRepository.save(member);
  }
}
