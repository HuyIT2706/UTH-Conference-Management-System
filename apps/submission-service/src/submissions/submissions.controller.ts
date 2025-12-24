import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
  UnauthorizedException,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import type { Request } from 'express';
import { SubmissionsService } from './submissions.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { QuerySubmissionsDto } from './dto/query-submissions.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtPayload } from '../auth/jwt.strategy';

@ApiTags('Submissions')
@Controller('submissions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Tạo submission mới với file PDF' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: 'File PDF (tối đa 10MB)' },
        title: { type: 'string', example: 'Machine Learning in Healthcare' },
        abstract: { type: 'string', example: 'This paper presents...' },
        keywords: { type: 'string', example: 'machine learning, healthcare, AI' },
        trackId: { type: 'number', example: 1 },
        conferenceId: { type: 'number', example: 1 },
      },
      required: ['file', 'title', 'abstract', 'trackId', 'conferenceId'],
    },
  })
  @ApiResponse({ status: 201, description: 'Tạo submission thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ hoặc deadline đã qua' })
  async create(
    @Body() createDto: CreateSubmissionDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    const user = req.user as JwtPayload | undefined;
    if (!user?.sub) {
      throw new UnauthorizedException('Token không hợp lệ');
    }

    const submission = await this.submissionsService.create(
      createDto,
      file,
      user.sub,
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
    @Req() req: Request,
  ) {
    const user = req.user as JwtPayload | undefined;
    if (!user?.sub) {
      throw new UnauthorizedException('Token không hợp lệ');
    }

    const submission = await this.submissionsService.update(
      id,
      updateDto,
      file,
      user.sub,
    );

    return {
      message: 'Cập nhật bài nộp dự thi thành công',
      data: submission,
    };
  }
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách submissions (có phân trang và filter)' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  async findAll(
    @Query() queryDto: QuerySubmissionsDto,
    @Req() req: Request,
  ) {
    const user = req.user as JwtPayload | undefined;
    if (!user?.sub) {
      throw new UnauthorizedException('Token không hợp lệ');
    }

    const result = await this.submissionsService.findAll(
      queryDto,
      user.sub,
      user.roles || [],
    );

    return {
      message: 'Lấy danh sách các bài dự thi thành công',
      data: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
  }

  @Get('me')
  async findMySubmissions(@Req() req: Request) {
    const user = req.user as JwtPayload | undefined;
    if (!user?.sub) {
      throw new UnauthorizedException('Token không hợp lệ');
    }

    const submissions = await this.submissionsService.findAllByAuthor(user.sub);

    return {
      message: 'Lấy danh sách các bài dự thi của tôi thành công',
      data: submissions,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết submission kèm lịch sử versions' })
  @ApiParam({ name: 'id', description: 'UUID của submission' })
  @ApiResponse({ status: 200, description: 'Lấy chi tiết thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy submission' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ) {
    const user = req.user as JwtPayload | undefined;
    if (!user?.sub) {
      throw new UnauthorizedException('Token không hợp lệ');
    }

    const submission = await this.submissionsService.findOne(
      id,
      user.sub,
      user.roles || [],
    );

    return {
      message: 'Lấy chi tiết bài dự thi thành công',
      data: submission,
    };
  }

  @Delete(':id')
  async withdraw(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ) {
    const user = req.user as JwtPayload | undefined;
    if (!user?.sub) {
      throw new UnauthorizedException('Token không hợp lệ');
    }

    const submission = await this.submissionsService.withdraw(id, user.sub);

    return {
      message: 'Rút bài dự thi thành công',
      data: submission,
    };
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStatusDto: UpdateStatusDto,
    @Req() req: Request,
  ) {
    const user = req.user as JwtPayload | undefined;
    if (!user?.sub) {
      throw new UnauthorizedException('Token không hợp lệ');
    }

    const submission = await this.submissionsService.updateStatus(
      id,
      updateStatusDto,
      user.sub,
      user.roles || [],
    );

    return {
      message: 'Cập nhật trạng thái bài dự thi thành công',
      data: submission,
    };
  }

  @Post(':id/camera-ready')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCameraReady(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    const user = req.user as JwtPayload | undefined;
    if (!user?.sub) {
      throw new UnauthorizedException('Token không hợp lệ');
    }

    if (!file) {
      throw new UnauthorizedException('File PDF là bắt buộc');
    }

    const submission = await this.submissionsService.uploadCameraReady(
      id,
      file,
      user.sub,
    );

    return {
      message: 'Upload camera-ready thành công',
      data: submission,
    };
  }

  @Get(':id/reviews')
  async getAnonymizedReviews(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ) {
    const user = req.user as JwtPayload | undefined;
    if (!user?.sub) {
      throw new UnauthorizedException('Token không hợp lệ');
    }

    const reviews = await this.submissionsService.getAnonymizedReviews(
      id,
      user.sub,
    );

    return {
      message: 'Lấy danh sách reviews đã ẩn danh thành công',
      data: reviews,
    };
  }
}



