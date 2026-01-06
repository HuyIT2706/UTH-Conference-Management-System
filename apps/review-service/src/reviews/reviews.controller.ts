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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
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

  private canManageConference(user?: JwtPayload): boolean {
    const roles = user?.roles || [];
    return roles.includes('ADMIN') || roles.includes('CHAIR');
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

  @Post('bids')
  @ApiOperation({
    summary: 'Reviewer submit preference (bidding) cho bài báo',
    description: `Reviewer đánh giá mức độ quan tâm của mình đối với một bài báo để Chair có thể xem xét khi phân công.
    
    **Các loại preference:**
    - \`INTERESTED\`: Rất quan tâm, muốn review
    - \`MAYBE\`: Có thể quan tâm
    - \`CONFLICT\`: Có xung đột lợi ích (COI)
    - \`NOT_INTERESTED\`: Không quan tâm

    **Ví dụ request body:**
    \`\`\`json
    {
      "submissionId": 1,
      "conferenceId": 1,
      "preference": "INTERESTED"
    }
    \`\`\``
  })
  @ApiBody({ type: CreateBidDto })
  @ApiResponse({ status: 201, description: 'Submit bidding thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 403, description: 'Không có quyền REVIEWER' })
  @ApiResponse({ status: 401, description: 'Token không hợp lệ' })
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

  @Get('assignments/me')
  @ApiOperation({
    summary: 'Lấy danh sách assignments của reviewer hiện tại',
    description: `Reviewer xem danh sách các bài báo được gán cho mình để review. Có phân trang.
    
    **Query parameters:**
    - \`page\`: Số trang (mặc định: 1)
    - \`limit\`: Số lượng mỗi trang (mặc định: 10, tối đa: 100)

    **Response bao gồm:**
    - Danh sách assignments với status (PENDING, ACCEPTED, REJECTED, COMPLETED)
    - Thông tin submission được gán
    - Due date (nếu có)
    - Review đã nộp (nếu có)`
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Số trang' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Số lượng mỗi trang' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách assignments thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền REVIEWER' })
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

  @Get('submissions/accepted-tracks')
  @ApiOperation({
    summary: 'Reviewer xem danh sách bài nộp trong các track đã chấp nhận',
    description: `Reviewer xem tất cả submissions trong các track mà họ đã chấp nhận.
    
    **Query parameters:**
    - \`status\`: Filter theo status (SUBMITTED, REVIEWING, etc.). Có thể truyền nhiều giá trị, ví dụ: ?status=SUBMITTED&status=REVIEWING
    
    **Response bao gồm:**
    - Danh sách submissions trong các track đã chấp nhận
    - Mặc định chỉ hiển thị submissions có status SUBMITTED hoặc REVIEWING`
  })
  @ApiQuery({ name: 'status', required: false, type: String, isArray: true, description: 'Filter by submission status' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách submissions thành công' })
  @ApiResponse({ status: 401, description: 'Token không hợp lệ' })
  async getSubmissionsForReviewer(
    @Req() req: Request,
    @Query('status') status?: string | string[],
  ) {
    const user = req.user as JwtPayload | undefined;
    if (!user?.sub) {
      throw new UnauthorizedException('Token không hợp lệ');
    }
    this.ensureIsReviewer(user);

    // Extract JWT token from Authorization header
    const authHeader = req.headers.authorization;
    const authToken = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : undefined;

    if (!authToken) {
      throw new UnauthorizedException('Token không hợp lệ');
    }

    // Convert status to array if it's a string
    // Default: get SUBMITTED and REVIEWING submissions (submissions that need review)
    let statusArray: string[] = ['SUBMITTED', 'REVIEWING']; // Default
    
    if (status) {
      if (Array.isArray(status)) {
        statusArray = status;
      } else if (typeof status === 'string') {
        // Handle comma-separated string: "SUBMITTED,REVIEWING" -> ["SUBMITTED", "REVIEWING"]
        statusArray = status.split(',').map(s => s.trim()).filter(s => s.length > 0);
      }
    }

    console.log('[ReviewsController] Status filter:', {
      rawStatus: status,
      statusArray,
    });

    const submissions = await this.reviewsService.getSubmissionsForReviewer(
      user.sub,
      authToken,
      statusArray,
    );

    return {
      message: 'Lấy danh sách bài nộp thành công',
      data: submissions,
    };
  }

  @Put('assignments/:id/accept')
  @ApiOperation({
    summary: 'Reviewer chấp nhận assignment',
    description: `Reviewer chấp nhận bài báo được gán để bắt đầu review. Status sẽ chuyển từ PENDING sang ACCEPTED.`
  })
  @ApiParam({ name: 'id', description: 'ID của assignment' })
  @ApiResponse({ status: 200, description: 'Chấp nhận assignment thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền hoặc không phải assignment của reviewer này' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy assignment' })
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
  @Put('assignments/:id/reject')
  @ApiOperation({
    summary: 'Reviewer từ chối assignment',
    description: `Reviewer từ chối bài báo được gán. Status sẽ chuyển từ PENDING sang REJECTED.`
  })
  @ApiParam({ name: 'id', description: 'ID của assignment' })
  @ApiResponse({ status: 200, description: 'Từ chối assignment thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền hoặc không phải assignment của reviewer này' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy assignment' })
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
  @Post()
  @ApiOperation({
    summary: 'Reviewer nộp bài chấm',
    description: `Reviewer nộp kết quả đánh giá cho bài báo. Assignment phải ở trạng thái ACCEPTED.
    
    **Ví dụ request body:**
    \`\`\`json
    {
      "assignmentId": 1,
      "score": 85,
      "confidence": "HIGH",
      "commentForAuthor": "Bài viết tốt, cần chỉnh sửa một số phần nhỏ về phương pháp thực nghiệm.",
      "commentForPC": "Tác giả có thể cải thiện phần methodology và thêm so sánh với các phương pháp hiện có.",
      "recommendation": "ACCEPT"
    }
    \`\`\`

    **Các trường:**
    - \`score\`: Điểm số từ 0-10
    - \`confidence\`: Mức độ tự tin (HIGH, MEDIUM, LOW)
    - \`commentForAuthor\`: Nhận xét cho tác giả (sẽ được hiển thị sau khi có decision)
    - \`commentForPC\`: Nhận xét nội bộ cho PC (confidential)
    - \`recommendation\`: Khuyến nghị (ACCEPT, MINOR_REVISION, MAJOR_REVISION, REJECT)

    **Lưu ý:** Sau khi nộp review, assignment status sẽ chuyển sang COMPLETED.`
  })
  @ApiBody({ type: CreateReviewDto })
  @ApiResponse({ status: 201, description: 'Nộp review thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ hoặc assignment chưa được accept' })
  @ApiResponse({ status: 403, description: 'Không có quyền hoặc không phải assignment của reviewer này' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy assignment' })
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

  @Post('assignments')
  @ApiOperation({
    summary: 'Chair gán bài báo cho reviewer (Manual Assignment)',
    description: `Chair gán một bài báo cho một reviewer cụ thể để review.
    
    **Ví dụ request body:**
    \`\`\`json
    {
      "reviewerId": 5,
      "submissionId": 1,
      "conferenceId": 1,
      "dueDate": "2025-02-01T23:59:59.000Z"
    }
    \`\`\`

    **Lưu ý:**
    - Chỉ Chair/Admin mới có quyền gán
    - Reviewer sẽ nhận assignment với status PENDING
    - Reviewer cần accept assignment trước khi nộp review
    - \`dueDate\`: Tùy chọn, hạn nộp review (ISO 8601 format)`
  })
  @ApiBody({ type: CreateAssignmentDto })
  @ApiResponse({ status: 201, description: 'Gán bài cho Reviewer thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 403, description: 'Chỉ Chair/Admin mới có quyền gán' })
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

  @Post('assignments/auto')
  @ApiOperation({
    summary: 'Chair tự động gán bài báo cho nhiều reviewers (Auto Assignment)',
    description: `Chair gán một bài báo cho nhiều reviewers cùng lúc (simple auto-assignment).
    
    **Ví dụ request body:**
    \`\`\`json
    {
      "submissionId": 1,
      "conferenceId": 1,
      "reviewerIds": [2, 3, 4]
    }
    \`\`\`

    **Lưu ý:**
    - Tất cả reviewers sẽ nhận assignment với status PENDING
    - Mỗi reviewer cần accept assignment của mình trước khi nộp review
    - Đây là simple auto-assignment, không có logic phân công thông minh dựa trên bidding/keywords`
  })
  @ApiBody({ type: CreateAutoAssignmentDto })
  @ApiResponse({ status: 201, description: 'Tự động gán bài cho nhiều Reviewer thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ (reviewerIds không được rỗng)' })
  @ApiResponse({ status: 403, description: 'Chỉ Chair/Admin mới có quyền gán' })
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

  @Post('assignments/self')
  @ApiOperation({
    summary: 'Reviewer tự phân công bài báo cho chính mình (Self Assignment)',
    description: `Reviewer tự phân công một bài báo cho chính mình để review. Chỉ áp dụng khi reviewer đã chấp nhận track assignment.
    
    **Ví dụ request body:**
    \`\`\`json
    {
      "submissionId": "8ccd4365-3258-4b87-8903-c48d06189ed1",
      "conferenceId": 1
    }
    \`\`\`

    **Lưu ý:**
    - Reviewer phải đã chấp nhận track assignment trước
    - Assignment sẽ được tạo với status ACCEPTED (tự động chấp nhận)
    - Nếu đã có assignment, sẽ tự động accept nếu đang PENDING`
  })
  @ApiResponse({ status: 201, description: 'Tự phân công thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ hoặc có CONFLICT' })
  async selfAssign(
    @Req() req: Request,
    @Body() dto: { submissionId: string; conferenceId: number },
  ) {
    const user = req.user as JwtPayload | undefined;
    if (!user?.sub) {
      throw new UnauthorizedException('Token không hợp lệ');
    }
    
    // Check if user is reviewer
    const isReviewer = user.roles?.includes('REVIEWER') || user.roles?.includes('PC_MEMBER');
    if (!isReviewer) {
      throw new ForbiddenException('Chỉ Reviewer mới có thể tự phân công');
    }

    const assignment = await this.reviewsService.selfAssignSubmission(
      user.sub,
      dto.submissionId,
      dto.conferenceId,
    );

    return {
      message: 'Tự phân công bài báo thành công',
      data: assignment,
    };
  }

  @Get('submission/:id')
  @ApiOperation({
    summary: 'Xem tất cả reviews của một submission',
    description: `Chair/Admin/Reviewer xem danh sách tất cả reviews đã được nộp cho một submission.
    
    **Quyền truy cập:**
    - Chair/Admin: Xem tất cả reviews
    - Reviewer: Chỉ xem được nếu có assignment cho submission này
    
    **Query parameters:**
    - \`page\`: Số trang (mặc định: 1)
    - \`limit\`: Số lượng mỗi trang (mặc định: 10, tối đa: 100)   

    **Response bao gồm:**
    - Danh sách reviews với đầy đủ thông tin (score, comments, recommendation)
    - Thông tin reviewer (cho Chair/Admin)
    - Assignment details`
  })
  @ApiParam({ name: 'id', description: 'ID của submission (UUID)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({ status: 200, description: 'Lấy danh sách reviews thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền xem' })
  async getReviewsBySubmission(
    @Req() req: Request,
    @Param('id') submissionId: string,
    @Query() query: PaginationQueryDto,
  ) {
    const user = req.user as JwtPayload | undefined;
    if (!user?.sub) {
      throw new UnauthorizedException('Token không hợp lệ');
    }
    
    // Check if user is Chair/Admin
    const isChairOrAdmin = this.canManageConference(user);
    
    // If not Chair/Admin, check if reviewer has assignment for this submission
    if (!isChairOrAdmin) {
      const hasAssignment = await this.reviewsService.checkReviewerAssignment(
        user.sub,
        submissionId,
      );
      if (!hasAssignment) {
        throw new ForbiddenException(
          'Bạn không có quyền xem reviews của submission này. Chỉ reviewer được gán bài mới có thể xem.',
        );
      }
    }
    
    // Extract JWT token from Authorization header
    const authHeader = req.headers.authorization;
    const authToken = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : undefined;

    const reviews = await this.reviewsService.getReviewsBySubmission(
      submissionId,
      query.page,
      query.limit,
      authToken,
    );

    return {
      message: 'Lấy danh sách reviews thành công',
      data: reviews,
    };
  }
  @Get('submission/:id/anonymized')
  @ApiOperation({
    summary: 'Xem reviews đã ẩn danh (cho tác giả)',
    description: `Lấy danh sách reviews đã được ẩn danh để tác giả xem sau khi có quyết định (single-blind review).
    
    **Response chỉ bao gồm:**
    - Score
    - commentForAuthor (không có commentForPC)
    - Recommendation
    - CreatedAt

    **Không bao gồm:** Thông tin reviewer (đã ẩn danh)`
  })
  @ApiParam({ name: 'id', description: 'ID của submission (UUID)' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách reviews ẩn danh thành công' })
  async getAnonymizedReviews(
    @Param('id') submissionId: string,
  ) {
    const reviews =
      await this.reviewsService.getAnonymizedReviewsBySubmission(submissionId);

    return {
      message: 'Lấy danh sách reviews ẩn danh thành công',
      data: reviews,
    };
  }

  @Get('bids/submission/:id')
  @ApiOperation({
    summary: 'Chair xem tất cả bids cho một submission',
    description: `Chair xem danh sách tất cả preferences/bids mà reviewers đã submit cho một submission.
    
    **Query parameters:**
    - \`page\`: Số trang (mặc định: 1)
    - \`limit\`: Số lượng mỗi trang (mặc định: 10, tối đa: 100)

    **Response bao gồm:**
    - Danh sách bids với preference (INTERESTED, MAYBE, CONFLICT, NOT_INTERESTED)
    - Thông tin reviewer
    - Timestamp`
  })
  @ApiParam({ name: 'id', description: 'ID của submission (UUID)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({ status: 200, description: 'Lấy danh sách bids thành công' })
  @ApiResponse({ status: 403, description: 'Chỉ Chair/Admin mới có quyền xem' })
  async getBidsBySubmission(
    @Req() req: Request,
    @Param('id') submissionId: string,
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
  @ApiOperation({
    summary: 'Chair tạo thảo luận PC (PC Discussion)',
    description: `Chair tạo một thông điệp thảo luận nội bộ trong PC về một submission.
    
    **Ví dụ request body:**
    \`\`\`json
    {
      "submissionId": 1,
      "message": "Tôi nghĩ cần thêm 1 reviewer nữa cho chủ đề này vì có sự khác biệt lớn giữa các reviews hiện tại."
    }
    \`\`\`    

    **Lưu ý:**
    - Chỉ Chair/Admin mới có quyền tạo discussion
    - Discussions là nội bộ PC, tác giả không thể xem`
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        submissionId: { type: 'number', example: 1, description: 'ID của submission' },
        message: { type: 'string', example: 'Tôi nghĩ cần thêm 1 reviewer nữa cho chủ đề này.', description: 'Nội dung thảo luận' },
      },
      required: ['submissionId', 'message'],
    },
  })
  @ApiResponse({ status: 201, description: 'Tạo thảo luận thành công' })
  @ApiResponse({ status: 400, description: 'submissionId và message là bắt buộc' })
  @ApiResponse({ status: 403, description: 'Chỉ Chair/Admin mới có quyền tạo discussion' })
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
  @Post('rebuttals')
  @ApiOperation({
    summary: 'Tác giả gửi rebuttal (phản hồi reviewers)',
    description: `Tác giả gửi phản hồi/rebuttal cho các comments từ reviewers.
    
    **Ví dụ request body:**
    \`\`\`json
    {
      "submissionId": 1,
      "conferenceId": 1,
      "message": "Chúng tôi đã cập nhật phần thí nghiệm như góp ý của reviewers. Các thay đổi chính bao gồm: (1) Thêm 2 datasets mới, (2) Cải thiện phần so sánh với baseline methods."
    }
    \`\`\`

    **Lưu ý:**
    - Chỉ tác giả của submission mới có quyền gửi rebuttal
    - Rebuttals sẽ được hiển thị cho Chair/Admin và reviewers`
  })
  @ApiBody({ type: CreateRebuttalDto })
  @ApiResponse({ status: 201, description: 'Gửi rebuttal thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 403, description: 'Chỉ tác giả của submission mới có quyền gửi rebuttal' })
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
  @Get('rebuttals/submission/:id')
  @ApiOperation({
    summary: 'Chair xem tất cả rebuttals của một submission',
    description: `Chair/Admin xem danh sách tất cả rebuttals mà tác giả đã gửi cho một submission.`
  })
  @ApiParam({ name: 'id', description: 'ID của submission (UUID)' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách rebuttal thành công' })
  @ApiResponse({ status: 403, description: 'Chỉ Chair/Admin mới có quyền xem' })
  async getRebuttalsBySubmission(
    @Req() req: Request,
    @Param('id') submissionId: string,
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
  @ApiOperation({
    summary: 'Chair xem danh sách thảo luận PC của một submission',
    description: `Chair/Admin xem danh sách tất cả PC discussions về một submission.
    
    **Query parameters:**
    - \`page\`: Số trang (mặc định: 1)
    - \`limit\`: Số lượng mỗi trang (mặc định: 10, tối đa: 100)`
  })
  @ApiParam({ name: 'id', description: 'ID của submission (UUID)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thảo luận thành công' })
  @ApiResponse({ status: 403, description: 'Chỉ Chair/Admin mới có quyền xem' })
  async getDiscussionsBySubmission(
    @Req() req: Request,
    @Param('id') submissionId: string,
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

  @Get('decisions/submission/:id')
  @ApiOperation({
    summary: 'Chair xem tổng hợp reviews và quyết định hiện tại',
    description: `Chair xem tổng hợp thống kê reviews và quyết định cuối cùng (nếu có) cho một submission.
    
    **Response bao gồm:**
    - Tổng hợp thống kê: điểm trung bình, số lượng reviews, consensus
    - Quyết định cuối cùng (nếu đã set)
    - Note về quyết định (nếu có)`
  })
  @ApiParam({ name: 'id', description: 'ID của submission (UUID)' })
  @ApiResponse({ status: 200, description: 'Lấy tổng hợp review và quyết định thành công' })
  @ApiResponse({ status: 403, description: 'Chỉ Chair/Admin mới có quyền xem' })
  async getDecisionSummary(
    @Req() req: Request,
    @Param('id') submissionId: string,
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
  @ApiOperation({
    summary: 'Chair set/update quyết định cuối cùng cho submission',
    description: `Chair/Admin set hoặc cập nhật quyết định cuối cùng cho một submission sau khi đã có đủ reviews.
    
    **Ví dụ request body:**
    \`\`\`json
    {
      "submissionId": 1,
      "decision": "ACCEPT",
      "note": "Điểm trung bình cao (85/100), đồng thuận tốt giữa các reviewers. Tất cả đều recommend ACCEPT. Quyết định: Chấp nhận."
    }
    \`\`\`

    **Các loại decision:**
    - \`ACCEPT\`: Chấp nhận
    - \`REJECT\`: Từ chối
    - \`MINOR_REVISION\`: Yêu cầu chỉnh sửa nhỏ
    - \`MAJOR_REVISION\`: Yêu cầu chỉnh sửa lớn

    **Lưu ý:** Quyết định này sẽ được gửi đến submission-service để update submission status.`
  })
  @ApiBody({ type: CreateDecisionDto })
  @ApiResponse({ status: 201, description: 'Cập nhật quyết định cuối cùng thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 403, description: 'Chỉ Chair/Admin mới có quyền set decision' })
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
  @ApiOperation({
    summary: 'Chair xem tiến độ review của một submission',
    description: `Chair xem các metrics về tiến độ review cho một submission cụ thể.
    
    **Response bao gồm:**
    - Số lượng assignments (tổng, đã accept, đã reject, đã complete)
    - Số lượng reviews đã nộp
    - Tỷ lệ hoàn thành
    - Thông tin về due dates`
  })
  @ApiParam({ name: 'id', description: 'ID của submission (UUID)' })
  @ApiResponse({ status: 200, description: 'Lấy tiến độ review của bài báo thành công' })
  @ApiResponse({ status: 403, description: 'Chỉ Chair/Admin mới có quyền xem' })
  async getSubmissionProgress(
    @Req() req: Request,
    @Param('id') submissionId: string,
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
  @ApiOperation({
    summary: 'Chair xem tiến độ review của cả hội nghị',
    description: `Chair xem các metrics tổng hợp về tiến độ review cho toàn bộ submissions trong một conference.
    
    **Response bao gồm:**
    - Tổng số submissions
    - Số lượng assignments (theo các status)
    - Số lượng reviews đã nộp
    - Tỷ lệ hoàn thành tổng thể
    - Thống kê theo submission status`
  })
  @ApiParam({ name: 'id', description: 'ID của conference' })
  @ApiResponse({ status: 200, description: 'Lấy tiến độ review của hội nghị thành công' })
  @ApiResponse({ status: 403, description: 'Chỉ Chair/Admin mới có quyền xem' })
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






