import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { CreateEmailTemplateDto } from './dto/create-email-template.dto';
import { UpdateEmailTemplateDto } from './dto/update-email-template.dto';
import { CreateFormTemplateDto } from './dto/create-form-template.dto';
import { UpdateFormTemplateDto } from './dto/update-form-template.dto';
import { CreateCfpTemplateDto } from './dto/create-cfp-template.dto';
import { UpdateCfpTemplateDto } from './dto/update-cfp-template.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';
import { ConferencesService } from '../conferences/conferences.service';

@Controller('conferences/:conferenceId/templates')
@UseGuards(JwtAuthGuard)
export class TemplatesController {
  constructor(
    private readonly templatesService: TemplatesService,
    private readonly conferencesService: ConferencesService,
  ) {}

  // Email Templates
  @Post('email')
  async createEmailTemplate(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
    @Body() createDto: CreateEmailTemplateDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.conferencesService.ensureCanManageConference(
      conferenceId,
      user.sub,
      user.roles,
    );

    const template = await this.templatesService.createEmailTemplate(
      conferenceId,
      createDto,
    );

    return {
      message: 'Tạo email template thành công',
      data: template,
    };
  }

  @Get('email')
  async findAllEmailTemplates(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.conferencesService.ensureCanManageConference(
      conferenceId,
      user.sub,
      user.roles,
    );

    const templates = await this.templatesService.findAllEmailTemplates(
      conferenceId,
    );

    return {
      message: 'Lấy danh sách email templates thành công',
      data: templates,
    };
  }

  @Get('email/:templateId')
  async findOneEmailTemplate(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
    @Param('templateId', ParseIntPipe) templateId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.conferencesService.ensureCanManageConference(
      conferenceId,
      user.sub,
      user.roles,
    );

    const template = await this.templatesService.findOneEmailTemplate(
      conferenceId,
      templateId,
    );

    return {
      message: 'Lấy email template thành công',
      data: template,
    };
  }

  @Patch('email/:templateId')
  async updateEmailTemplate(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
    @Param('templateId', ParseIntPipe) templateId: number,
    @Body() updateDto: UpdateEmailTemplateDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.conferencesService.ensureCanManageConference(
      conferenceId,
      user.sub,
      user.roles,
    );

    const template = await this.templatesService.updateEmailTemplate(
      conferenceId,
      templateId,
      updateDto,
    );

    return {
      message: 'Cập nhật email template thành công',
      data: template,
    };
  }

  @Delete('email/:templateId')
  async deleteEmailTemplate(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
    @Param('templateId', ParseIntPipe) templateId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.conferencesService.ensureCanManageConference(
      conferenceId,
      user.sub,
      user.roles,
    );

    await this.templatesService.deleteEmailTemplate(conferenceId, templateId);

    return {
      message: 'Xóa email template thành công',
    };
  }

  // Form Templates
  @Post('form')
  async createFormTemplate(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
    @Body() createDto: CreateFormTemplateDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.conferencesService.ensureCanManageConference(
      conferenceId,
      user.sub,
      user.roles,
    );

    const template = await this.templatesService.createFormTemplate(
      conferenceId,
      createDto,
    );

    return {
      message: 'Tạo form template thành công',
      data: template,
    };
  }

  @Get('form')
  async findAllFormTemplates(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.conferencesService.ensureCanManageConference(
      conferenceId,
      user.sub,
      user.roles,
    );

    const templates = await this.templatesService.findAllFormTemplates(
      conferenceId,
    );

    return {
      message: 'Lấy danh sách form templates thành công',
      data: templates,
    };
  }

  @Get('form/:templateId')
  async findOneFormTemplate(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
    @Param('templateId', ParseIntPipe) templateId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.conferencesService.ensureCanManageConference(
      conferenceId,
      user.sub,
      user.roles,
    );

    const template = await this.templatesService.findOneFormTemplate(
      conferenceId,
      templateId,
    );

    return {
      message: 'Lấy form template thành công',
      data: template,
    };
  }

  @Patch('form/:templateId')
  async updateFormTemplate(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
    @Param('templateId', ParseIntPipe) templateId: number,
    @Body() updateDto: UpdateFormTemplateDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.conferencesService.ensureCanManageConference(
      conferenceId,
      user.sub,
      user.roles,
    );

    const template = await this.templatesService.updateFormTemplate(
      conferenceId,
      templateId,
      updateDto,
    );

    return {
      message: 'Cập nhật form template thành công',
      data: template,
    };
  }

  @Delete('form/:templateId')
  async deleteFormTemplate(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
    @Param('templateId', ParseIntPipe) templateId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.conferencesService.ensureCanManageConference(
      conferenceId,
      user.sub,
      user.roles,
    );

    await this.templatesService.deleteFormTemplate(conferenceId, templateId);

    return {
      message: 'Xóa form template thành công',
    };
  }

  // CFP Templates
  @Post('cfp')
  async createCfpTemplate(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
    @Body() createDto: CreateCfpTemplateDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.conferencesService.ensureCanManageConference(
      conferenceId,
      user.sub,
      user.roles,
    );

    const template = await this.templatesService.createOrUpdateCfpTemplate(
      conferenceId,
      createDto,
    );

    return {
      message: 'Tạo CFP template thành công',
      data: template,
    };
  }

  @Get('cfp')
  async getCfpTemplate(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.conferencesService.ensureCanManageConference(
      conferenceId,
      user.sub,
      user.roles,
    );

    const template = await this.templatesService.getCfpTemplate(conferenceId);

    return {
      message: 'Lấy CFP template thành công',
      data: template,
    };
  }

  @Patch('cfp')
  async updateCfpTemplate(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
    @Body() updateDto: UpdateCfpTemplateDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.conferencesService.ensureCanManageConference(
      conferenceId,
      user.sub,
      user.roles,
    );

    const template = await this.templatesService.updateCfpTemplate(
      conferenceId,
      updateDto,
    );

    return {
      message: 'Cập nhật CFP template thành công',
      data: template,
    };
  }
}
