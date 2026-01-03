import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { ConferencesService } from '../conferences/conferences.service';
import { Track } from '../conferences/entities/track.entity';
import { CfpSetting } from '../cfp/entities/cfp-setting.entity';

@ApiTags('Validation')
@Controller('conferences/:conferenceId')
export class ValidationController {
  constructor(
    private readonly conferencesService: ConferencesService,
  ) {}

  @Get('cfp/deadlines')
  @ApiOperation({
    summary: 'Lấy tất cả deadlines của conference',
    description: 'Lấy tất cả các mốc thời gian CFP của hội nghị.'
  })
  @ApiParam({ name: 'conferenceId', description: 'ID của hội nghị' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lấy deadlines thành công',
    schema: {
      type: 'object',
      properties: {
        deadlines: { 
          type: 'object',
          nullable: true,
          properties: {
            submissionDeadline: { type: 'string', format: 'date-time' },
            reviewDeadline: { type: 'string', format: 'date-time' },
            notificationDate: { type: 'string', format: 'date-time' },
            cameraReadyDeadline: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  })
  async getDeadlines(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
  ): Promise<{ deadlines: CfpSetting | null }> {
    const cfpSetting = await this.conferencesService.getCfpSetting(conferenceId);

    return {
      deadlines: cfpSetting,
    };
  }

}





