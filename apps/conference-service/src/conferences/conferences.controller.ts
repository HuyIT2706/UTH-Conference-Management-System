import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Post,
  ForbiddenException,
} from '@nestjs/common';
import { ConferencesService } from './conferences.service';
import { CreateConferenceDto } from './dto/create-conference.dto';
import { SetCfpSettingDto } from '../cfp/dto/set-cfp-setting.dto';

class CreateTrackDto {
  name: string;
}

interface AuthUser {
  id: number;
  roles: string[];
}

@Controller('conferences')
export class ConferencesController {
  constructor(private readonly conferencesService: ConferencesService) {}

  private decodeUserFromAuthHeader(header?: string): AuthUser | undefined {
    if (!header?.startsWith('Bearer ')) {
      return undefined;
    }
    const token = header.substring('Bearer '.length).trim();
    const parts = token.split('.');
    if (parts.length !== 3) {
      return undefined;
    }

    try {
      const payloadJson = Buffer.from(
        parts[1].replace(/-/g, '+').replace(/_/g, '/'),
        'base64',
      ).toString('utf8');
      const payload = JSON.parse(payloadJson) as {
        sub?: number;
        roles?: string[];
      };

      return {
        id: payload.sub ?? 0,
        roles: payload.roles ?? [],
      };
    } catch {
      return undefined;
    }
  }

  private ensureCanManageConference(user?: AuthUser) {
    const roles = user?.roles || [];
    if (!roles.includes('ADMIN') && !roles.includes('CHAIR')) {
      throw new ForbiddenException('Bạn không có quyền thực hiện thao tác này');
    }
  }

  @Post()
  async create(
    @Headers('authorization') authHeader: string | undefined,
    @Body() dto: CreateConferenceDto,
  ) {
    const user = this.decodeUserFromAuthHeader(authHeader);
    this.ensureCanManageConference(user);

    const conference = await this.conferencesService.createConference(dto, user!.id);

    return {
      message: 'Tạo hội nghị thành công',
      data: conference,
    };
  }

  @Get()
  findAll() {
    return this.conferencesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.conferencesService.findOne(id);
  }

  @Post(':id/tracks')
  async addTrack(
    @Headers('authorization') authHeader: string | undefined,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CreateTrackDto,
  ) {
    const user = this.decodeUserFromAuthHeader(authHeader);
    this.ensureCanManageConference(user);

    const track = await this.conferencesService.addTrack(id, body.name);

    return {
      message: 'Thêm track thành công',
      data: track,
    };
  }

  @Post(':id/cfp')
  async setCfp(
    @Headers('authorization') authHeader: string | undefined,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetCfpSettingDto,
  ) {
    const user = this.decodeUserFromAuthHeader(authHeader);
    this.ensureCanManageConference(user);

    const cfp = await this.conferencesService.setCfpSettings(id, dto);

    return {
      message: 'Cập nhật mốc thời gian CFP thành công',
      data: cfp,
    };
  }
}
