import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ConferencesService } from '../conferences/conferences.service';
import { Track } from '../conferences/entities/track.entity';
import { CfpSetting } from '../cfp/entities/cfp-setting.entity';

@Controller('conferences/:conferenceId')
export class ValidationController {
  constructor(
    private readonly conferencesService: ConferencesService,
  ) {}

  @Get('tracks/:trackId/validate')
  async validateTrack(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
    @Param('trackId', ParseIntPipe) trackId: number,
  ): Promise<{ valid: boolean; track?: Track }> {
    const tracks = await this.conferencesService.findAllTracks(conferenceId);
    const track = tracks.find((t) => t.id === trackId);

    return {
      valid: !!track,
      track: track || undefined,
    };
  }

  @Get('cfp/deadlines')
  async getDeadlines(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
  ): Promise<{ deadlines: CfpSetting | null }> {
    const cfpSetting = await this.conferencesService.getCfpSetting(conferenceId);

    return {
      deadlines: cfpSetting,
    };
  }

  @Get('cfp/check-deadline')
  async checkDeadline(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
    @Query('type') type: 'submission' | 'review' | 'notification' | 'camera-ready',
  ): Promise<{ valid: boolean; deadline?: Date; message: string }> {
    const cfpSetting = await this.conferencesService.getCfpSetting(conferenceId);

    if (!cfpSetting) {
      return {
        valid: false,
        message: 'CFP settings chưa được thiết lập',
      };
    }

    const now = new Date();
    let deadline: Date;
    let deadlineName: string;

    switch (type) {
      case 'submission':
        deadline = cfpSetting.submissionDeadline;
        deadlineName = 'Submission deadline';
        break;
      case 'review':
        deadline = cfpSetting.reviewDeadline;
        deadlineName = 'Review deadline';
        break;
      case 'notification':
        deadline = cfpSetting.notificationDate;
        deadlineName = 'Notification date';
        break;
      case 'camera-ready':
        deadline = cfpSetting.cameraReadyDeadline;
        deadlineName = 'Camera-ready deadline';
        break;
      default:
        return {
          valid: false,
          message: 'Invalid deadline type',
        };
    }

    const valid = now <= deadline;

    return {
      valid,
      deadline,
      message: valid
        ? `${deadlineName} chưa qua`
        : `${deadlineName} đã qua`,
    };
  }
}




