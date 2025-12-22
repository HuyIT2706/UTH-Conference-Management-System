import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';
import { ConferencesService } from '../conferences/conferences.service';

@Controller('conferences/:conferenceId/audit-logs')
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(
    private readonly auditService: AuditService,
    private readonly conferencesService: ConferencesService,
  ) {}

  @Get()
  async getAuditLogs(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.conferencesService.ensureCanManageConference(
      conferenceId,
      user.sub,
      user.roles,
    );

    const logs = await this.auditService.findAll(conferenceId);

    return {
      message: 'Lấy audit logs thành công',
      data: logs,
    };
  }
}
