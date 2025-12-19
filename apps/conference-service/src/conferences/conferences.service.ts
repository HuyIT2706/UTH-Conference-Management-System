import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conference } from './entities/conference.entity';
import { Track } from './entities/track.entity';
import {
  ConferenceMember,
  ConferenceMemberRole,
} from './entities/conference-member.entity';
import { CreateConferenceDto } from './dto/create-conference.dto';
import { CfpSetting } from '../cfp/entities/cfp-setting.entity';
import { SetCfpSettingDto } from '../cfp/dto/set-cfp-setting.dto';

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
    return this.conferenceRepository.find({ relations: ['tracks'] });
  }

  async findOne(id: number): Promise<Conference> {
    const conference = await this.conferenceRepository.findOne({
      where: { id },
      relations: ['tracks'],
    });

    if (!conference) {
      throw new NotFoundException('Conference not found');
    }

    return conference;
  }

  async addTrack(conferenceId: number, name: string): Promise<Track> {
    const conference = await this.conferenceRepository.findOne({
      where: { id: conferenceId },
    });

    if (!conference) {
      throw new NotFoundException('Conference not found');
    }

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
  ): Promise<CfpSetting> {
    const conference = await this.conferenceRepository.findOne({
      where: { id: conferenceId },
    });

    if (!conference) {
      throw new NotFoundException('Conference not found');
    }

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
}
