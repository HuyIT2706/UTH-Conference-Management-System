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

    const submission = await this.submissionsService.create(
      createDto,
      file,
      user.id,
    );

    return {
      message: 'Nộp bài dự thi thành công',
      data: submission,
    };
  }
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

    const submission = await this.submissionsService.update(
      id,
      updateDto,
      file,
      user.id,
    );

    return {
      message: 'Cập nhật bài nộp dự thi thành công',
      data: submission,
    };
  }
  @Get()
  async findAll(@Headers('authorization') authHeader?: string) {
    const user = this.decodeUserFromAuthHeader(authHeader);
    if (!user || !user.id) {
      throw new UnauthorizedException('Token không hợp lệ');
    }

    const submissions = await this.submissionsService.findAllByAuthor(user.id);

    return {
      message: 'Lấy danh sách các bài dự thi thành công',
      data: submissions,
    };
  }
  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('authorization') authHeader?: string,
  ) {
    const user = this.decodeUserFromAuthHeader(authHeader);
    if (!user || !user.id) {
      throw new UnauthorizedException('Token không hợp lệ');
    }

    const submission = await this.submissionsService.findOne(id, user.id);

    return {
      message: 'Lấy chi tiết bài dự thi thành công',
      data: submission,
    };
  }
}


