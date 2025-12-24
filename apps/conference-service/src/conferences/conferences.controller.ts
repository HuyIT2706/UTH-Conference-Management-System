import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ConferencesService } from './conferences.service';
import { CreateConferenceDto } from './dto/create-conference.dto';
import { SetCfpSettingDto } from '../cfp/dto/set-cfp-setting.dto';
import { UpdateConferenceDto } from './dto/update-conference.dto';
import { CreateTrackDto } from './dto/create-track.dto';
import { UpdateTrackDto } from './dto/update-track.dto';
import { AddConferenceMemberDto } from './dto/add-conference-member.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';

@ApiTags('Conferences')
@Controller('conferences')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ConferencesController {
  constructor(private readonly conferencesService: ConferencesService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo hội nghị mới' })
  @ApiResponse({ status: 201, description: 'Tạo hội nghị thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateConferenceDto,
  ) {
    const conference = await this.conferencesService.createConference(dto, user.sub);

    return {
      message: 'Tạo hội nghị thành công',
      data: conference,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tất cả hội nghị' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  findAll() {
    return this.conferencesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết hội nghị' })
  @ApiParam({ name: 'id', description: 'ID của hội nghị' })
  @ApiResponse({ status: 200, description: 'Lấy thông tin thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy hội nghị' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.conferencesService.findOne(id);
  }

  @Post(':id/tracks')
  @ApiOperation({ summary: 'Thêm track vào hội nghị' })
  @ApiParam({ name: 'id', description: 'ID của hội nghị' })
  @ApiResponse({ status: 201, description: 'Thêm track thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền quản lý hội nghị' })
  async addTrack(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CreateTrackDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const track = await this.conferencesService.addTrack(id, body.name, {
      id: user.sub,
      roles: user.roles ?? [],
    });

    return {
      message: 'Thêm track thành công',
      data: track,
    };
  }

  @Post(':id/cfp')
  async setCfp(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetCfpSettingDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const cfp = await this.conferencesService.setCfpSettings(id, dto, {
      id: user.sub,
      roles: user.roles ?? [],
    });

    return {
      message: 'Cập nhật mốc thời gian CFP thành công',
      data: cfp,
    };
  }

  @Patch(':id')
  async updateConference(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateConferenceDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const updated = await this.conferencesService.updateConference(id, dto, {
      id: user.sub,
      roles: user.roles ?? [],
    });
    return {
      message: 'Cập nhật hội nghị thành công',
      data: updated,
    };
  }

  @Delete(':id')
  async deleteConference(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.conferencesService.deleteConference(id, {
      id: user.sub,
      roles: user.roles ?? [],
    });
    return {
      message: 'Xóa hội nghị thành công',
    };
  }

  @Patch(':conferenceId/tracks/:trackId')
  async updateTrack(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
    @Param('trackId', ParseIntPipe) trackId: number,
    @Body() dto: UpdateTrackDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const updated = await this.conferencesService.updateTrack(
      conferenceId,
      trackId,
      dto,
      { id: user.sub, roles: user.roles ?? [] },
    );
    return {
      message: 'Cập nhật người chấm bài thành công',
      data: updated,
    };
  }

  @Delete(':conferenceId/tracks/:trackId')
  async deleteTrack(
    @Param('conferenceId', ParseIntPipe) conferenceId: number,
    @Param('trackId', ParseIntPipe) trackId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.conferencesService.deleteTrack(conferenceId, trackId, {
      id: user.sub,
      roles: user.roles ?? [],
    });
    return { message: 'Xóa người chấm bài thành công' };
  }

  @Get(':id/members')
  async listMembers(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    const members = await this.conferencesService.listMembers(id, {
      id: user.sub,
      roles: user.roles ?? [],
    });
    return { message: 'Lấy danh sách thành viên thành công', data: members };
  }

  @Post(':id/members')
  async addMember(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddConferenceMemberDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const member = await this.conferencesService.addMember(id, dto, {
      id: user.sub,
      roles: user.roles ?? [],
    });
    return { message: 'Thêm thành viên thành công', data: member };
  }

  @Delete(':id/members/:userId')
  async removeMember(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.conferencesService.removeMember(id, userId, {
      id: user.sub,
      roles: user.roles ?? [],
    });
    return { message: 'Xóa thành viên thành công' };
  }
}
