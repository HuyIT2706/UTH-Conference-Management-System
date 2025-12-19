import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SubmissionsService } from './submissions.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';

interface AuthUser {
  id: number;
  roles: string[];
}

@Controller('submissions')
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  /**
   * Decode JWT token từ Authorization header
   * @param header Authorization header
   * @returns AuthUser hoặc undefined
   */
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

  /**
   * POST /submissions
   * Upload file (bắt buộc) + Body (title, abstract, trackId)
   */
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @Body() createDto: CreateSubmissionDto,
    @UploadedFile() file: Express.Multer.File,
    @Headers('authorization') authHeader?: string,
  ) {
    const user = this.decodeUserFromAuthHeader(authHeader);
    if (!user || !user.id) {
      throw new UnauthorizedException('Token không hợp lệ');
    }

    return await this.submissionsService.create(
      createDto,
      file,
      user.id,
    );
  }

  /**
   * PUT /submissions/:id
   * Upload file (tùy chọn) + Body update
   */
  @Put(':id')
  @UseInterceptors(FileInterceptor('file'))
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateSubmissionDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Headers('authorization') authHeader?: string,
  ) {
    const user = this.decodeUserFromAuthHeader(authHeader);
    if (!user || !user.id) {
      throw new UnauthorizedException('Token không hợp lệ');
    }

    return await this.submissionsService.update(id, updateDto, file, user.id);
  }

  /**
   * GET /submissions
   * Lấy danh sách bài của user
   */
  @Get()
  async findAll(@Headers('authorization') authHeader?: string) {
    const user = this.decodeUserFromAuthHeader(authHeader);
    if (!user || !user.id) {
      throw new UnauthorizedException('Token không hợp lệ');
    }

    return await this.submissionsService.findAllByAuthor(user.id);
  }

  /**
   * GET /submissions/:id
   * Xem chi tiết (kèm lịch sử versions)
   */
  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('authorization') authHeader?: string,
  ) {
    const user = this.decodeUserFromAuthHeader(authHeader);
    if (!user || !user.id) {
      throw new UnauthorizedException('Token không hợp lệ');
    }

    return await this.submissionsService.findOne(id, user.id);
  }
}
