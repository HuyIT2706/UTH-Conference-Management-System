import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ReportingService } from './reporting.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';
import { ConferencesService } from '../conferences/conferences.service';

@Controller('conferences/:conferenceId/stats')
@UseGuards(JwtAuthGuard)
export class ReportingController {
  constructor(
    private readonly reportingService: ReportingService,
    private readonly conferencesService: ConferencesService,
  ) {}

  @Get()
  async getStats(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.conferencesService.ensureCanManageConference(
      conferenceId,
      user.sub,
      user.roles,
    );

    const stats = await this.reportingService.getConferenceStats(conferenceId);

    return {
      message: 'Lấy thống kê thành công',
      data: stats,
    };
  }

  @Get('submissions')
  async getSubmissionStats(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.conferencesService.ensureCanManageConference(
      conferenceId,
      user.sub,
      user.roles,
    );

    const stats = await this.reportingService.getSubmissionStats(conferenceId);

    return {
      message: 'Lấy thống kê submissions thành công',
      data: stats,
    };
  }

  @Get('acceptance-rate')
  async getAcceptanceRate(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.conferencesService.ensureCanManageConference(
      conferenceId,
      user.sub,
      user.roles,
    );

    const stats = await this.reportingService.getAcceptanceRate(conferenceId);

    return {
      message: 'Lấy tỷ lệ chấp nhận thành công',
      data: stats,
    };
  }

  @Get('tracks')
  async getTrackStats(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.conferencesService.ensureCanManageConference(
      conferenceId,
      user.sub,
      user.roles,
    );

    const stats = await this.reportingService.getConferenceStats(conferenceId);

    return {
      message: 'Lấy thống kê tracks thành công',
      data: {
        tracks: stats.tracks,
        totalTracks: stats.totalTracks,
      },
    };
  }
}
