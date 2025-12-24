import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  ForbiddenException,
  BadRequestException,
  UseGuards,
  Req,
  UnauthorizedException,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import type { Request } from 'express';
import { ReviewsService } from './reviews.service';
import { CreateBidDto } from './dto/create-bid.dto';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { AssignmentStatus } from './entities/assignment.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt.strategy';
import { CreateDecisionDto } from './dto/create-decision.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { CreateRebuttalDto } from './dto/create-rebuttal.dto';
import { CreateAutoAssignmentDto } from './dto/create-auto-assignment.dto';

@ApiTags('Reviews')
@Controller('reviews')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  private ensureCanManageConference(user?: JwtPayload) {
    const roles = user?.roles || [];
    if (!roles.includes('ADMIN') && !roles.includes('CHAIR')) {
      throw new ForbiddenException('Bạn không có quyền thực hiện thao tác này');
    }
  }

  private ensureIsReviewer(user?: JwtPayload) {
    const roles = user?.roles || [];
    if (
      !roles.includes('ADMIN') &&
      !roles.includes('CHAIR') &&
      !roles.includes('REVIEWER')
    ) {
      throw new ForbiddenException('Bạn không có quyền thực hiện thao tác này');
    }
  }

  // ========== REVIEWER APIs ==========

  /**
   * POST /reviews/bids
   * Reviewer submit preference (bidding) for a submission
   */
  @Post('bids')
  @ApiOperation({ summary: 'Reviewer submit preference (bidding) cho bài báo' })
  @ApiResponse({ status: 201, description: 'Submit bidding thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền REVIEWER' })
  async submitBid(
    @Req() req: Request,
    @Body() dto: CreateBidDto,
  ) {
    const user = req.user as JwtPayload | undefined;
    if (!user?.sub) {
      throw new UnauthorizedException('Token không hợp lệ');
    }
    this.ensureIsReviewer(user);
    const bid = await this.reviewsService.submitBid(user.sub, dto);

    return {
      message: 'Đánh giá quan tâm bài báo thành công',
      data: bid,
    };
  }

  /**
   * GET /reviews/assignments/me
   * Reviewer view their assigned submissions
   */
  @Get('assignments/me')
  async getMyAssignments(
    @Req() req: Request,
    @Query() query: PaginationQueryDto,
  ) {
    const user = req.user as JwtPayload | undefined;
    if (!user?.sub) {
      throw new UnauthorizedException('Token không hợp lệ');
    }
    this.ensureIsReviewer(user);
    const assignments = await this.reviewsService.getMyAssignments(
      user.sub,
      query.page,
      query.limit,
    );

    return {
      message: 'Lấy danh sách assignments thành công',
      data: assignments,
    };
  }

  /**
   * PUT /reviews/assignments/:id/accept
   * Reviewer accept an assignment
   */
  @Put('assignments/:id/accept')
  async acceptAssignment(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const user = req.user as JwtPayload | undefined;
    if (!user?.sub) {
      throw new UnauthorizedException('Token không hợp lệ');
    }
    this.ensureIsReviewer(user);
    const assignment = await this.reviewsService.updateAssignmentStatus(
      id,
      user.sub,
      AssignmentStatus.ACCEPTED,
    );

    return {
      message: 'Chấp nhận assignment thành công',
      data: assignment,
    };
  }

  /**
   * PUT /reviews/assignments/:id/reject
   * Reviewer reject an assignment
   */
  @Put('assignments/:id/reject')
  async rejectAssignment(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const user = req.user as JwtPayload | undefined;
    if (!user?.sub) {
      throw new UnauthorizedException('Token không hợp lệ');
    }
    this.ensureIsReviewer(user);
    const assignment = await this.reviewsService.updateAssignmentStatus(
      id,
      user.sub,
      AssignmentStatus.REJECTED,
    );

    return {
      message: 'Từ chối assignment thành công',
      data: assignment,
    };
  }

  /**
   * POST /reviews
   * Reviewer submit review for an assignment
   */
  @Post()
  @ApiOperation({ summary: 'Reviewer nộp bài chấm' })
  @ApiResponse({ status: 201, description: 'Nộp review thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền hoặc assignment chưa được accept' })
  async submitReview(
    @Req() req: Request,
    @Body() dto: CreateReviewDto,
  ) {
    const user = req.user as JwtPayload | undefined;
    if (!user?.sub) {
      throw new UnauthorizedException('Token không hợp lệ');
    }
    this.ensureIsReviewer(user);
    const review = await this.reviewsService.submitReview(user.sub, dto);

    return {
      message: 'Nộp bài chấm thành công',
      data: review,
    };
  }

  // ========== CHAIR APIs ==========

  /**
   * POST /reviews/assignments
   * Chair assign submission to reviewer
   */
  @Post('assignments')
  async createAssignment(
    @Req() req: Request,
    @Body() dto: CreateAssignmentDto,
  ) {
    const user = req.user as JwtPayload | undefined;
    if (!user?.sub) {
      throw new UnauthorizedException('Token không hợp lệ');
    }
    this.ensureCanManageConference(user);
    const assignment = await this.reviewsService.createAssignment(
      user.sub,
      dto,
    );

    return {
      message: 'Gán bài cho Reviewer thành công',
      data: assignment,
    };
  }

  /**
   * POST /reviews/assignments/auto
   * Simple auto-assignment: assign one submission to multiple reviewers
   */
  @Post('assignments/auto')
  async autoAssign(
    @Req() req: Request,
    @Body() dto: CreateAutoAssignmentDto,
  ) {
    const user = req.user as JwtPayload | undefined;
    if (!user?.sub) {
      throw new UnauthorizedException('Token không hợp lệ');
    }
    this.ensureCanManageConference(user);

    const result = await this.reviewsService.autoAssignSubmission(
      user.sub,
      dto.submissionId,
      dto.conferenceId,
      dto.reviewerIds,
    );

    return {
      message: 'Tự động gán bài cho nhiều Reviewer (đơn giản) thành công',
      data: result,
    };
  }

  /**
   * GET /reviews/submission/:id
   * Chair view all reviews for a submission
   */
  @Get('submission/:id')
  async getReviewsBySubmission(
    @Req() req: Request,
    @Param('id', ParseIntPipe) submissionId: number,
    @Query() query: PaginationQueryDto,
  ) {
    const user = req.user as JwtPayload | undefined;
    if (!user?.sub) {
      throw new UnauthorizedException('Token không hợp lệ');
    }
    this.ensureCanManageConference(user);
    const reviews = await this.reviewsService.getReviewsBySubmission(
      submissionId,
      query.page,
      query.limit,
    );

    return {
      message: 'Lấy danh sách reviews thành công',
      data: reviews,
    };
  }

  /**
   * GET /reviews/submission/:id/anonymized
   * Anonymized reviews for authors (single-blind)
   */
  @Get('submission/:id/anonymized')
  async getAnonymizedReviews(
    @Param('id', ParseIntPipe) submissionId: number,
  ) {
    const reviews =
      await this.reviewsService.getAnonymizedReviewsBySubmission(submissionId);

    return {
      message: 'Lấy danh sách reviews ẩn danh thành công',
      data: reviews,
    };
  }

  /**
   * GET /reviews/bids/submission/:id
   * Chair view all bids for a submission (optional)
   */
  @Get('bids/submission/:id')
  async getBidsBySubmission(
    @Req() req: Request,
    @Param('id', ParseIntPipe) submissionId: number,
    @Query() query: PaginationQueryDto,
  ) {
    const user = req.user as JwtPayload | undefined;
    if (!user?.sub) {
      throw new UnauthorizedException('Token không hợp lệ');
    }
    this.ensureCanManageConference(user);

    const bids = await this.reviewsService.getBidsBySubmission(
      submissionId,
      query.page,
      query.limit,
    );

    return {
      message: 'Lấy danh sách bids thành công',
      data: bids,
    };
  }

  /**
   * POST /reviews/discussions
   * Create PC Discussion message
   */
  @Post('discussions')
  async createDiscussion(
    @Req() req: Request,
    @Body() body: { submissionId: number; message: string },
  ) {
    const user = req.user as JwtPayload | undefined;
    if (!user?.sub) {
      throw new UnauthorizedException('Token không hợp lệ');
    }
    this.ensureCanManageConference(user);

    if (!body.submissionId || !body.message) {
      throw new BadRequestException('submissionId và message là bắt buộc');
    }

    const discussion = await this.reviewsService.createDiscussion(
      user.sub,
      body.submissionId,
      body.message,
    );

    return {
      message: 'Tạo thảo luận thành công',
      data: discussion,
    };
  }

  // ========== REBUTTAL APIs ==========

  /**
   * POST /reviews/rebuttals
   * Author submit rebuttal for a submission
   */
  @Post('rebuttals')
  async createRebuttal(
    @Req() req: Request,
    @Body() dto: CreateRebuttalDto,
  ) {
    const user = req.user as JwtPayload | undefined;
    if (!user?.sub) {
      throw new UnauthorizedException('Token không hợp lệ');
    }

    const rebuttal = await this.reviewsService.createRebuttal(
      user.sub,
      dto.submissionId,
      dto.conferenceId ?? null,
      dto.message,
    );

    return {
      message: 'Gửi rebuttal thành công',
      data: rebuttal,
    };
  }

  /**
   * GET /reviews/rebuttals/submission/:id
   * Get all rebuttals for a submission (Chair/Admin)
   */
  @Get('rebuttals/submission/:id')
  async getRebuttalsBySubmission(
    @Req() req: Request,
    @Param('id', ParseIntPipe) submissionId: number,
  ) {
    const user = req.user as JwtPayload | undefined;
    if (!user?.sub) {
      throw new UnauthorizedException('Token không hợp lệ');
    }
    this.ensureCanManageConference(user);

    const rebuttals =
      await this.reviewsService.getRebuttalsBySubmission(submissionId);

    return {
      message: 'Lấy danh sách rebuttal thành công',
      data: rebuttals,
    };
  }

  /**
   * GET /reviews/discussions/submission/:id
   * Get PC Discussion for a submission
   */
  @Get('discussions/submission/:id')
  async getDiscussionsBySubmission(
    @Req() req: Request,
    @Param('id', ParseIntPipe) submissionId: number,
    @Query() query: PaginationQueryDto,
  ) {
    const user = req.user as JwtPayload | undefined;
    if (!user?.sub) {
      throw new UnauthorizedException('Token không hợp lệ');
    }
    this.ensureCanManageConference(user);

    const discussions = await this.reviewsService.getDiscussionsBySubmission(
      submissionId,
      query.page,
      query.limit,
    );

    return {
      message: 'Lấy danh sách thảo luận thành công',
      data: discussions,
    };
  }

  // ========== DECISION & AGGREGATION (CHAIR) ==========

  /**
   * GET /reviews/decisions/submission/:id
   * Get aggregated review stats + current decision for a submission
   */
  @Get('decisions/submission/:id')
  async getDecisionSummary(
    @Req() req: Request,
    @Param('id', ParseIntPipe) submissionId: number,
  ) {
    const user = req.user as JwtPayload | undefined;
    if (!user?.sub) {
      throw new UnauthorizedException('Token không hợp lệ');
    }
    this.ensureCanManageConference(user);

    const summary =
      await this.reviewsService.getDecisionSummaryBySubmission(submissionId);

    return {
      message: 'Lấy tổng hợp review và quyết định thành công',
      data: summary,
    };
  }

  /**
   * POST /reviews/decisions
   * Chair/Admin set or update final decision for a submission
   */
  @Post('decisions')
  async setDecision(
    @Req() req: Request,
    @Body() dto: CreateDecisionDto,
  ) {
    const user = req.user as JwtPayload | undefined;
    if (!user?.sub) {
      throw new UnauthorizedException('Token không hợp lệ');
    }
    this.ensureCanManageConference(user);

    const decision = await this.reviewsService.upsertDecisionForSubmission(
      dto.submissionId,
      user.sub,
      dto.decision,
      dto.note,
    );

    const summary =
      await this.reviewsService.getDecisionSummaryBySubmission(
        dto.submissionId,
      );

    return {
      message: 'Cập nhật quyết định cuối cùng thành công',
      data: {
        decision,
        summary,
      },
    };
  }

  // ========== PROGRESS TRACKING (CHAIR) ==========

  /**
   * GET /reviews/progress/submission/:id
   * Basic progress metrics for a single submission
   */
  @Get('progress/submission/:id')
  async getSubmissionProgress(
    @Req() req: Request,
    @Param('id', ParseIntPipe) submissionId: number,
  ) {
    const user = req.user as JwtPayload | undefined;
    if (!user?.sub) {
      throw new UnauthorizedException('Token không hợp lệ');
    }
    this.ensureCanManageConference(user);

    const progress =
      await this.reviewsService.getSubmissionProgress(submissionId);

    return {
      message: 'Lấy tiến độ review của bài báo thành công',
      data: progress,
    };
  }

  /**
   * GET /reviews/progress/conference/:id
   * Basic progress metrics for a conference
   */
  @Get('progress/conference/:id')
  async getConferenceProgress(
    @Req() req: Request,
    @Param('id', ParseIntPipe) conferenceId: number,
  ) {
    const user = req.user as JwtPayload | undefined;
    if (!user?.sub) {
      throw new UnauthorizedException('Token không hợp lệ');
    }
    this.ensureCanManageConference(user);

    const progress =
      await this.reviewsService.getConferenceProgress(conferenceId);

    return {
      message: 'Lấy tiến độ review của hội nghị thành công',
      data: progress,
    };
  }
}






