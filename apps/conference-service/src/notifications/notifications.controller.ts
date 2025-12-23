import {
  Controller,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { BulkNotificationDto } from './dto/bulk-notification.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';
import { ConferencesService } from '../conferences/conferences.service';

@Controller('conferences/:conferenceId/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly conferencesService: ConferencesService,
  ) {}

  @Post('bulk')
  async sendBulkNotification(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
    @Body() dto: BulkNotificationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.conferencesService.ensureCanManageConference(
      conferenceId,
      { id: user.sub, roles: user.roles },
    );

    const result = await this.notificationsService.sendBulkNotification(
      conferenceId,
      dto,
    );

    return {
      message: 'Gửi email hàng loạt thành công',
      data: result,
    };
  }

  @Post('preview')
  async previewNotification(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
    @Body() dto: BulkNotificationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.conferencesService.ensureCanManageConference(
      conferenceId,
      { id: user.sub, roles: user.roles },
    );

    const preview = await this.notificationsService.previewNotification(
      conferenceId,
      dto,
    );

    return {
      message: 'Preview email thành công',
      data: preview,
    };
  }
}

