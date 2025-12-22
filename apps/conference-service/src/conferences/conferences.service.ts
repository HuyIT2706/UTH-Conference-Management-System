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
import { CreateConferenceDto } from './dto/create-conference.dto';
import { UpdateConferenceDto } from './dto/update-conference.dto';
import { CfpSetting } from '../cfp/entities/cfp-setting.entity';
import { SetCfpSettingDto } from '../cfp/dto/set-cfp-setting.dto';
import { UpdateTrackDto } from './dto/update-track.dto';
import { AddConferenceMemberDto } from './dto/add-conference-member.dto';

@Injectable()
export class ConferencesService {
  constructor(
    @InjectRepository(Conference)
    private readonly conferenceRepository: Repository<Conference>,
    @InjectRepository(Track)
    private readonly trackRepository: Repository<Track>,
    @InjectRepository(ConferenceMember)
    private readonly conferenceMemberRepository: Repository<ConferenceMember>,
    @InjectRepository(CfpSetting)
    private readonly cfpSettingRepository: Repository<CfpSetting>,
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
    return this.conferenceRepository.find({ relations: ['tracks', 'members'] });
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

  private async ensureCanManageConference(
    conferenceId: number,
    user: { id: number; roles: string[] },
  ) {
    const roles = user?.roles || [];
    if (roles.includes('ADMIN')) {
      return;
    }
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
}
