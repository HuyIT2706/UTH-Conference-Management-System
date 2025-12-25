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

  @Get('tracks/:trackId/validate')
  @ApiOperation({
    summary: 'Xác thực track thuộc conference',
    description: 'Kiểm tra xem track có tồn tại và thuộc về conference không.'
  })
  @ApiParam({ name: 'conferenceId', description: 'ID của hội nghị' })
  @ApiParam({ name: 'trackId', description: 'ID của track cần validate' })
  @ApiResponse({ 
    status: 200, 
    description: 'Xác thực thành công',
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean', example: true },
        track: { type: 'object', nullable: true }
      }
    }
  })
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

  @Get('cfp/check-deadline')
  @ApiOperation({
    summary: 'Kiểm tra deadline còn hợp lệ không',
    description: `Kiểm tra xem một deadline cụ thể còn hợp lệ (chưa qua) hay không để các services khác validate deadline trước khi cho phép thao tác.
    
    **Các loại deadline type:**
    - \`submission\`: Hạn nộp bài
    - \`review\`: Hạn đánh giá
    - \`notification\`: Ngày thông báo
    - \`camera-ready\`: Hạn nộp bản cuối cùng`
  })
  @ApiParam({ name: 'conferenceId', description: 'ID của hội nghị' })
  @ApiQuery({ 
    name: 'type', 
    description: 'Loại deadline cần check',
    enum: ['submission', 'review', 'notification', 'camera-ready'],
    example: 'submission'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Check deadline thành công',
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean', example: true, description: 'Deadline còn hợp lệ (chưa qua)' },
        deadline: { type: 'string', format: 'date-time', nullable: true },
        message: { type: 'string', example: 'Submission deadline chưa qua' }
      }
    }
  })
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





