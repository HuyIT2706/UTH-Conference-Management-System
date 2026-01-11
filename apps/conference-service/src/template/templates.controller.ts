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
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
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

@ApiTags('Templates')
@Controller('conferences/:conferenceId/templates')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class TemplatesController {
  constructor(
    private readonly templatesService: TemplatesService,
    private readonly conferencesService: ConferencesService,
  ) {}

  // Email Templates
  @Post('email')
  @ApiOperation({
    summary: 'Tạo email template mới',
    description: 'Tạo một email template mới cho hội nghị.',
  })
  @ApiParam({ name: 'conferenceId', description: 'ID của hội nghị' })
  @ApiResponse({ status: 201, description: 'Tạo email template thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền quản lý hội nghị' })
  async createEmailTemplate(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
    @Body() createDto: CreateEmailTemplateDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.conferencesService.ensureCanManageConference(conferenceId, {
      id: user.sub,
      roles: user.roles,
    });

    const template = await this.templatesService.createEmailTemplate(
      conferenceId,
      createDto,
    );

    return {
      message: 'Tạo email template thành công',
      data: template,
    };
  }
// Lấy danh sách tất cả email templates của hội nghị
  @Get('email')
  @ApiOperation({
    summary: 'Lấy danh sách tất cả email templates của hội nghị',
  })
  @ApiParam({ name: 'conferenceId', description: 'ID của hội nghị' })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách email templates thành công',
  })
  async findAllEmailTemplates(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.conferencesService.ensureCanManageConference(conferenceId, {
      id: user.sub,
      roles: user.roles,
    });

    const templates =
      await this.templatesService.findAllEmailTemplates(conferenceId);

    return {
      message: 'Lấy danh sách email templates thành công',
      data: templates,
    };
  }
// Lấy chi tiết một email template
  @Get('email/:templateId')
  @ApiOperation({ summary: 'Lấy chi tiết một email template' })
  @ApiParam({ name: 'conferenceId', description: 'ID của hội nghị' })
  @ApiParam({ name: 'templateId', description: 'ID của email template' })
  @ApiResponse({ status: 200, description: 'Lấy email template thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy email template' })
  async findOneEmailTemplate(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
    @Param('templateId', ParseIntPipe) templateId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.conferencesService.ensureCanManageConference(conferenceId, {
      id: user.sub,
      roles: user.roles,
    });

    const template = await this.templatesService.findOneEmailTemplate(
      conferenceId,
      templateId,
    );

    return {
      message: 'Lấy email template thành công',
      data: template,
    };
  }
// Cap nhật email template
  @Patch('email/:templateId')
  @ApiOperation({
    summary: 'Cập nhật email template',
    description: `Cập nhật thông tin email template.`,
  })
  @ApiParam({ name: 'conferenceId', description: 'ID của hội nghị' })
  @ApiParam({ name: 'templateId', description: 'ID của email template' })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật email template thành công',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy email template' })
  async updateEmailTemplate(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
    @Param('templateId', ParseIntPipe) templateId: number,
    @Body() updateDto: UpdateEmailTemplateDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.conferencesService.ensureCanManageConference(conferenceId, {
      id: user.sub,
      roles: user.roles,
    });

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
//  Xóaa email template
  @Delete('email/:templateId')
  @ApiOperation({ summary: 'Xóa email template' })
  @ApiParam({ name: 'conferenceId', description: 'ID của hội nghị' })
  @ApiParam({
    name: 'templateId',
    description: 'ID của email template cần xóa',
  })
  @ApiResponse({ status: 200, description: 'Xóa email template thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy email template' })
  async deleteEmailTemplate(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
    @Param('templateId', ParseIntPipe) templateId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.conferencesService.ensureCanManageConference(conferenceId, {
      id: user.sub,
      roles: user.roles,
    });

    await this.templatesService.deleteEmailTemplate(conferenceId, templateId);

    return {
      message: 'Xóa email template thành công',
    };
  }

  // Form Templates
  @Post('form')
  @ApiOperation({
    summary: 'Tạo form template mới',
    description: 'Tạo một form template mới với các fields tùy chỉnh.',
  })
  @ApiParam({ name: 'conferenceId', description: 'ID của hội nghị' })
  @ApiResponse({ status: 201, description: 'Tạo form template thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền quản lý hội nghị' })
  async createFormTemplate(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
    @Body() createDto: CreateFormTemplateDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.conferencesService.ensureCanManageConference(conferenceId, {
      id: user.sub,
      roles: user.roles,
    });

    const template = await this.templatesService.createFormTemplate(
      conferenceId,
      createDto,
    );

    return {
      message: 'Tạo form template thành công',
      data: template,
    };
  }
// Lấy form template
  @Get('form')
  @ApiOperation({ summary: 'Lấy danh sách tất cả form templates của hội nghị' })
  @ApiParam({ name: 'conferenceId', description: 'ID của hội nghị' })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách form templates thành công',
  })
  async findAllFormTemplates(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.conferencesService.ensureCanManageConference(conferenceId, {
      id: user.sub,
      roles: user.roles,
    });

    const templates =
      await this.templatesService.findAllFormTemplates(conferenceId);

    return {
      message: 'Lấy danh sách form templates thành công',
      data: templates,
    };
  }
// Lấy chi tiết một form template
  @Get('form/:templateId')
  @ApiOperation({ summary: 'Lấy chi tiết một form template' })
  @ApiParam({ name: 'conferenceId', description: 'ID của hội nghị' })
  @ApiParam({ name: 'templateId', description: 'ID của form template' })
  @ApiResponse({ status: 200, description: 'Lấy form template thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy form template' })
  async findOneFormTemplate(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
    @Param('templateId', ParseIntPipe) templateId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.conferencesService.ensureCanManageConference(conferenceId, {
      id: user.sub,
      roles: user.roles,
    });

    const template = await this.templatesService.findOneFormTemplate(
      conferenceId,
      templateId,
    );

    return {
      message: 'Lấy form template thành công',
      data: template,
    };
  }
//  Cập nhật email template
  @Patch('form/:templateId')
  @ApiOperation({
    summary: 'Cập nhật form template',
    description: 'Cập nhật thông tin form template. Tất cả các trường đều tùy chọn.',
  })
  @ApiParam({ name: 'conferenceId', description: 'ID của hội nghị' })
  @ApiParam({ name: 'templateId', description: 'ID của form template' })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật form template thành công',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy form template' })
  async updateFormTemplate(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
    @Param('templateId', ParseIntPipe) templateId: number,
    @Body() updateDto: UpdateFormTemplateDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.conferencesService.ensureCanManageConference(conferenceId, {
      id: user.sub,
      roles: user.roles,
    });

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
//  Xóa form template
  @Delete('form/:templateId')
  @ApiOperation({ summary: 'Xóa form template' })
  @ApiParam({ name: 'conferenceId', description: 'ID của hội nghị' })
  @ApiParam({ name: 'templateId', description: 'ID của form template cần xóa' })
  @ApiResponse({ status: 200, description: 'Xóa form template thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy form template' })
  async deleteFormTemplate(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
    @Param('templateId', ParseIntPipe) templateId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.conferencesService.ensureCanManageConference(conferenceId, {
      id: user.sub,
      roles: user.roles,
    });

    await this.templatesService.deleteFormTemplate(conferenceId, templateId);

    return {
      message: 'Xóa form template thành công',
    };
  }

  // CFP Templates
  @Post('cfp')
  @ApiOperation({
    summary: 'Tạo hoặc cập nhật CFP template',
    description: 'Tạo hoặc cập nhật template HTML cho trang CFP công khai.',
  })
  @ApiParam({ name: 'conferenceId', description: 'ID của hội nghị' })
  @ApiResponse({ status: 201, description: 'Tạo CFP template thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền quản lý hội nghị' })
  async createCfpTemplate(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
    @Body() createDto: CreateCfpTemplateDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.conferencesService.ensureCanManageConference(conferenceId, {
      id: user.sub,
      roles: user.roles,
    });

    const template = await this.templatesService.createOrUpdateCfpTemplate(
      conferenceId,
      createDto,
    );

    return {
      message: 'Tạo CFP template thành công',
      data: template,
    };
  }
// Lấy CFP template
  @Get('cfp')
  @ApiOperation({ summary: 'Lấy CFP template của hội nghị' })
  @ApiParam({ name: 'conferenceId', description: 'ID của hội nghị' })
  @ApiResponse({ status: 200, description: 'Lấy CFP template thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy CFP template' })
  async getCfpTemplate(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.conferencesService.ensureCanManageConference(conferenceId, {
      id: user.sub,
      roles: user.roles,
    });

    const template = await this.templatesService.getCfpTemplate(conferenceId);

    return {
      message: 'Lấy CFP template thành công',
      data: template,
    };
  }
// Câp nhật CFP template
  @Patch('cfp')
  @ApiOperation({
    summary: 'Cập nhật CFP template',
    description: 'Cập nhật CFP template.',
  })
  @ApiParam({ name: 'conferenceId', description: 'ID của hội nghị' })
  @ApiResponse({ status: 200, description: 'Cập nhật CFP template thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy CFP template' })
  async updateCfpTemplate(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
    @Body() updateDto: UpdateCfpTemplateDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.conferencesService.ensureCanManageConference(conferenceId, {
      id: user.sub,
      roles: user.roles,
    });

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
