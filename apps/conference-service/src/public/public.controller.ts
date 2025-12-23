import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ConferencesService } from '../conferences/conferences.service';
import { TemplatesService } from '../templates/templates.service';

@Controller('public/conferences')
export class PublicController {
  constructor(
    private readonly conferencesService: ConferencesService,
    private readonly templatesService: TemplatesService,
  ) {}

  @Get(':id/cfp')
  async getPublicCfp(@Param('id', ParseIntPipe) conferenceId: number) {
    const conference = await this.conferencesService.findOne(conferenceId);
    const tracks = await this.conferencesService.findAllTracks(conferenceId);
    const cfpSetting = await this.conferencesService.getCfpSetting(conferenceId);
    const cfpTemplate = await this.templatesService.getCfpTemplate(conferenceId);

    return {
      message: 'Lấy thông tin CFP công khai thành công',
      data: {
        conference: {
          id: conference.id,
          name: conference.name,
          startDate: conference.startDate,
          endDate: conference.endDate,
          venue: conference.venue,
        },
        tracks: tracks.map((track) => ({
          id: track.id,
          name: track.name,
        })),
        deadlines: cfpSetting
          ? {
              submissionDeadline: cfpSetting.submissionDeadline,
              reviewDeadline: cfpSetting.reviewDeadline,
              notificationDate: cfpSetting.notificationDate,
              cameraReadyDeadline: cfpSetting.cameraReadyDeadline,
            }
          : null,
        template: cfpTemplate
          ? {
              htmlContent: cfpTemplate.htmlContent,
              customStyles: cfpTemplate.customStyles,
            }
          : null,
      },
    };
  }

  @Get(':id/tracks')
  async getPublicTracks(@Param('id', ParseIntPipe) conferenceId: number) {
    const tracks = await this.conferencesService.findAllTracks(conferenceId);

    return {
      message: 'Lấy danh sách tracks công khai thành công',
      data: tracks.map((track) => ({
        id: track.id,
        name: track.name,
      })),
    };
  }
}

