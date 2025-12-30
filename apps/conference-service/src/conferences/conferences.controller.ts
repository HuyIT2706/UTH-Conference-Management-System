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
  @ApiOperation({ 
    summary: 'Tạo hội nghị mới',
    description: `Tạo một hội nghị mới. Người tạo sẽ tự động trở thành CHAIR của hội nghị.
    
**Ví dụ request body:**
\`\`\`json
{
  "name": "International UTH Conference 2025",
  "startDate": "2025-06-01T09:00:00Z",
  "endDate": "2025-06-03T18:00:00Z",
  "venue": "HCMC University of Transport",
  "description": "International Conference on Transportation and Logistics 2025...",
  "shortDescription": "Join us for the premier conference on transportation research...",
  "contactEmail": "conference@uth.edu.vn"
}
\`\`\`

**Lưu ý:** \`description\`, \`shortDescription\`, và \`contactEmail\` là các trường tùy chọn.`
  })
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
  async findAll() {
    const conferences = await this.conferencesService.findAll();
    return {
      message: 'Lấy danh sách hội nghị thành công',
      data: conferences,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết hội nghị' })
  @ApiParam({ name: 'id', description: 'ID của hội nghị' })
  @ApiResponse({ status: 200, description: 'Lấy thông tin thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy hội nghị' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const conference = await this.conferencesService.findOne(id);
    const conferenceData = {
      ...conference,
      submissionDeadline: conference.cfpSetting?.submissionDeadline?.toISOString(),
      reviewDeadline: conference.cfpSetting?.reviewDeadline?.toISOString(),
      notificationDate: conference.cfpSetting?.notificationDate?.toISOString(),
      cameraReadyDeadline: conference.cfpSetting?.cameraReadyDeadline?.toISOString(),
    };
    
    return {
      message: 'Lấy thông tin hội nghị thành công',
      data: conferenceData,
    };
  }

  @Get(':id/tracks')
  @ApiOperation({ summary: 'Lấy danh sách tracks của hội nghị' })
  @ApiParam({ name: 'id', description: 'ID của hội nghị' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách tracks thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy hội nghị' })
  async getTracks(@Param('id', ParseIntPipe) id: number) {
    const tracks = await this.conferencesService.findAllTracks(id);
    return {
      message: 'Lấy danh sách tracks thành công',
      data: tracks,
    };
  }

  @Post(':id/tracks')
  @ApiOperation({ 
    summary: 'Thêm track vào hội nghị',
    description: `Thêm một track (lĩnh vực/chủ đề) mới vào hội nghị.
    
**Ví dụ request body:**
\`\`\`json
{
  "name": "Artificial Intelligence & Machine Learning"
}
\`\`\``
  })
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
  @ApiOperation({ 
    summary: 'Thiết lập các mốc thời gian CFP (Call for Papers)',
    description: `Thiết lập các deadline cho hội nghị. Thứ tự deadline phải hợp lệ: submissionDeadline ≤ reviewDeadline ≤ notificationDate ≤ cameraReadyDeadline.
    
**Ví dụ request body:**
\`\`\`json
{
  "submissionDeadline": "2025-03-01T23:59:59.000Z",
  "reviewDeadline": "2025-03-15T23:59:59.000Z",
  "notificationDate": "2025-04-01T12:00:00.000Z",
  "cameraReadyDeadline": "2025-04-15T23:59:59.000Z"
}
\`\`\``
  })
  @ApiParam({ name: 'id', description: 'ID của hội nghị' })
  @ApiResponse({ status: 201, description: 'Thiết lập CFP thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ (thứ tự deadline không đúng)' })
  @ApiResponse({ status: 403, description: 'Không có quyền quản lý hội nghị' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy hội nghị' })
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
  @ApiOperation({ 
    summary: 'Cập nhật thông tin hội nghị',
    description: `Cập nhật thông tin hội nghị. Tất cả các trường đều tùy chọn, chỉ cần gửi các trường muốn cập nhật.
    
**Ví dụ request body (cập nhật một số trường):**
\`\`\`json
{
  "name": "International UTH Conference 2025 Updated",
  "venue": "HCMC University of Transport - Main Campus",
  "description": "Updated description for the conference",
  "contactEmail": "conference2025@uth.edu.vn"
}
\`\`\``
  })
  @ApiParam({ name: 'id', description: 'ID của hội nghị' })
  @ApiResponse({ status: 200, description: 'Cập nhật hội nghị thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 403, description: 'Không có quyền quản lý hội nghị' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy hội nghị' })
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
  @ApiOperation({ summary: 'Xóa hội nghị' })
  @ApiParam({ name: 'id', description: 'ID của hội nghị' })
  @ApiResponse({ status: 200, description: 'Xóa hội nghị thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền quản lý hội nghị' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy hội nghị' })
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
  @ApiOperation({ 
    summary: 'Cập nhật thông tin track (lĩnh vực/chủ đề)',
    description: `Cập nhật tên của track. Tất cả các trường đều tùy chọn.
    
**Ví dụ request body:**
\`\`\`json
{
  "name": "AI & ML Track (Updated)"
}
\`\`\``
  })
  @ApiParam({ name: 'conferenceId', description: 'ID của hội nghị' })
  @ApiParam({ name: 'trackId', description: 'ID của track cần cập nhật' })
  @ApiResponse({ status: 200, description: 'Cập nhật track thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền quản lý hội nghị' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy hội nghị hoặc track' })
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
  @ApiOperation({ summary: 'Xóa track (lĩnh vực/chủ đề) khỏi hội nghị' })
  @ApiParam({ name: 'conferenceId', description: 'ID của hội nghị' })
  @ApiParam({ name: 'trackId', description: 'ID của track cần xóa' })
  @ApiResponse({ status: 200, description: 'Xóa track thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền quản lý hội nghị' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy hội nghị hoặc track' })
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
  @ApiOperation({ summary: 'Lấy danh sách thành viên (PC members và Chairs) của hội nghị' })
  @ApiParam({ name: 'id', description: 'ID của hội nghị' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành viên thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy hội nghị' })
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
  @ApiOperation({ 
    summary: 'Thêm thành viên (PC member hoặc Chair) vào hội nghị',
    description: `Thêm một user vào hội nghị với vai trò PC_MEMBER hoặc CHAIR.
    
**Ví dụ request body:**
\`\`\`json
{
  "userId": 5,
  "role": "PC_MEMBER"
}
\`\`\`

**Các giá trị role có thể:**
- \`PC_MEMBER\`: Thành viên ban chương trình
- \`CHAIR\`: Chủ tịch hội nghị`
  })
  @ApiParam({ name: 'id', description: 'ID của hội nghị' })
  @ApiResponse({ status: 201, description: 'Thêm thành viên thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ hoặc user không tồn tại' })
  @ApiResponse({ status: 403, description: 'Không có quyền quản lý hội nghị' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy hội nghị' })
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
  @ApiOperation({ summary: 'Xóa thành viên khỏi hội nghị' })
  @ApiParam({ name: 'id', description: 'ID của hội nghị' })
  @ApiParam({ name: 'userId', description: 'ID của user cần xóa khỏi hội nghị' })
  @ApiResponse({ status: 200, description: 'Xóa thành viên thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền quản lý hội nghị' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy hội nghị hoặc thành viên' })
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
