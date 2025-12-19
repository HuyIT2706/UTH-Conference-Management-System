import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Post,
  Put,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateBidDto } from './dto/create-bid.dto';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { AssignmentStatus } from './entities/assignment.entity';

interface AuthUser {
  id: number;
  roles: string[];
}

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

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

  private ensureIsReviewer(user?: AuthUser) {
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
  async submitBid(
    @Headers('authorization') authHeader: string | undefined,
    @Body() dto: CreateBidDto,
  ) {
    const user = this.decodeUserFromAuthHeader(authHeader);
    this.ensureIsReviewer(user);

    if (!user) {
      throw new ForbiddenException('Bạn cần đăng nhập để thực hiện thao tác này');
    }

    const bid = await this.reviewsService.submitBid(user.id, dto);

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
    @Headers('authorization') authHeader: string | undefined,
  ) {
    const user = this.decodeUserFromAuthHeader(authHeader);
    this.ensureIsReviewer(user);

    if (!user) {
      throw new ForbiddenException('Bạn cần đăng nhập để thực hiện thao tác này');
    }

    const assignments = await this.reviewsService.getMyAssignments(user.id);

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
    @Headers('authorization') authHeader: string | undefined,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const user = this.decodeUserFromAuthHeader(authHeader);
    this.ensureIsReviewer(user);

    if (!user) {
      throw new ForbiddenException('Bạn cần đăng nhập để thực hiện thao tác này');
    }

    const assignment = await this.reviewsService.updateAssignmentStatus(
      id,
      user.id,
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
    @Headers('authorization') authHeader: string | undefined,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const user = this.decodeUserFromAuthHeader(authHeader);
    this.ensureIsReviewer(user);

    if (!user) {
      throw new ForbiddenException('Bạn cần đăng nhập để thực hiện thao tác này');
    }

    const assignment = await this.reviewsService.updateAssignmentStatus(
      id,
      user.id,
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
  async submitReview(
    @Headers('authorization') authHeader: string | undefined,
    @Body() dto: CreateReviewDto,
  ) {
    const user = this.decodeUserFromAuthHeader(authHeader);
    this.ensureIsReviewer(user);

    if (!user) {
      throw new ForbiddenException('Bạn cần đăng nhập để thực hiện thao tác này');
    }

    const review = await this.reviewsService.submitReview(user.id, dto);

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
    @Headers('authorization') authHeader: string | undefined,
    @Body() dto: CreateAssignmentDto,
  ) {
    const user = this.decodeUserFromAuthHeader(authHeader);
    this.ensureCanManageConference(user);

    if (!user) {
      throw new ForbiddenException('Bạn cần đăng nhập để thực hiện thao tác này');
    }

    const assignment = await this.reviewsService.createAssignment(
      user.id,
      dto,
    );

    return {
      message: 'Gán bài cho Reviewer thành công',
      data: assignment,
    };
  }

  /**
   * GET /reviews/submission/:id
   * Chair view all reviews for a submission
   */
  @Get('submission/:id')
  async getReviewsBySubmission(
    @Headers('authorization') authHeader: string | undefined,
    @Param('id', ParseIntPipe) submissionId: number,
  ) {
    const user = this.decodeUserFromAuthHeader(authHeader);
    this.ensureCanManageConference(user);

    if (!user) {
      throw new ForbiddenException('Bạn cần đăng nhập để thực hiện thao tác này');
    }

    const reviews = await this.reviewsService.getReviewsBySubmission(
      submissionId,
    );

    return {
      message: 'Lấy danh sách reviews thành công',
      data: reviews,
    };
  }

  /**
   * GET /reviews/bids/submission/:id
   * Chair view all bids for a submission (optional)
   */
  @Get('bids/submission/:id')
  async getBidsBySubmission(
    @Headers('authorization') authHeader: string | undefined,
    @Param('id', ParseIntPipe) submissionId: number,
  ) {
    const user = this.decodeUserFromAuthHeader(authHeader);
    this.ensureCanManageConference(user);

    if (!user) {
      throw new ForbiddenException('Bạn cần đăng nhập để thực hiện thao tác này');
    }

    const bids = await this.reviewsService.getBidsBySubmission(submissionId);

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
    @Headers('authorization') authHeader: string | undefined,
    @Body() body: { submissionId: number; message: string },
  ) {
    const user = this.decodeUserFromAuthHeader(authHeader);
    this.ensureCanManageConference(user);

    if (!user) {
      throw new ForbiddenException('Bạn cần đăng nhập để thực hiện thao tác này');
    }

    if (!body.submissionId || !body.message) {
      throw new BadRequestException('submissionId và message là bắt buộc');
    }

    const discussion = await this.reviewsService.createDiscussion(
      user.id,
      body.submissionId,
      body.message,
    );

    return {
      message: 'Tạo thảo luận thành công',
      data: discussion,
    };
  }

  /**
   * GET /reviews/discussions/submission/:id
   * Get PC Discussion for a submission
   */
  @Get('discussions/submission/:id')
  async getDiscussionsBySubmission(
    @Headers('authorization') authHeader: string | undefined,
    @Param('id', ParseIntPipe) submissionId: number,
  ) {
    const user = this.decodeUserFromAuthHeader(authHeader);
    this.ensureCanManageConference(user);

    if (!user) {
      throw new ForbiddenException('Bạn cần đăng nhập để thực hiện thao tác này');
    }

    const discussions = await this.reviewsService.getDiscussionsBySubmission(
      submissionId,
    );

    return {
      message: 'Lấy danh sách thảo luận thành công',
      data: discussions,
    };
  }
}
