import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ReviewPreference, PreferenceType } from './entities/review-preference.entity';
import {
  Assignment,
  AssignmentStatus,
} from './entities/assignment.entity';
import { Review } from './entities/review.entity';
import { PcDiscussion } from './entities/pc-discussion.entity';
import { CreateBidDto } from './dto/create-bid.dto';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(ReviewPreference)
    private readonly reviewPreferenceRepository: Repository<ReviewPreference>,
    @InjectRepository(Assignment)
    private readonly assignmentRepository: Repository<Assignment>,
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(PcDiscussion)
    private readonly pcDiscussionRepository: Repository<PcDiscussion>,
  ) {}

  /**
   * Bidding Logic: Reviewer submit preference for a submission
   */
  async submitBid(reviewerId: number, dto: CreateBidDto): Promise<ReviewPreference> {
    // Check if bid already exists
    const existingBid = await this.reviewPreferenceRepository.findOne({
      where: {
        reviewerId,
        submissionId: dto.submissionId,
      },
    });

    if (existingBid) {
      // Update existing bid
      existingBid.preference = dto.preference;
      return this.reviewPreferenceRepository.save(existingBid);
    }

    // Create new bid
    const bid = this.reviewPreferenceRepository.create({
      reviewerId,
      submissionId: dto.submissionId,
      preference: dto.preference,
    });

    return this.reviewPreferenceRepository.save(bid);
  }

  /**
   * Check Conflict of Interest (COI)
   * Returns true if reviewer has CONFLICT preference for this submission
   */
  async checkConflictOfInterest(
    reviewerId: number,
    submissionId: number,
  ): Promise<boolean> {
    const preference = await this.reviewPreferenceRepository.findOne({
      where: {
        reviewerId,
        submissionId,
      },
    });

    return preference?.preference === PreferenceType.CONFLICT;
  }

  /**
   * Assignment Logic: Chair assigns submission to reviewer
   */
  async createAssignment(
    chairId: number,
    dto: CreateAssignmentDto,
  ): Promise<Assignment> {
    // Check for Conflict of Interest
    const hasConflict = await this.checkConflictOfInterest(
      dto.reviewerId,
      dto.submissionId,
    );

    if (hasConflict) {
      throw new BadRequestException(
        'Không thể gán bài này vì Reviewer đã báo cáo xung đột lợi ích (CONFLICT)',
      );
    }

    // Mock check: Verify reviewer exists in system
    // In real system, this would call Identity Service
    // For now, we'll just check if reviewerId > 0
    if (dto.reviewerId <= 0) {
      throw new BadRequestException('Reviewer không tồn tại trong hệ thống');
    }

    // Check if assignment already exists
    const existingAssignment = await this.assignmentRepository.findOne({
      where: {
        reviewerId: dto.reviewerId,
        submissionId: dto.submissionId,
      },
    });

    if (existingAssignment) {
      throw new BadRequestException(
        'Bài này đã được gán cho Reviewer này rồi',
      );
    }

    // Create assignment
    const assignment = this.assignmentRepository.create({
      reviewerId: dto.reviewerId,
      submissionId: dto.submissionId,
      assignedBy: chairId,
      status: AssignmentStatus.PENDING,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
    });

    return this.assignmentRepository.save(assignment);
  }

  /**
   * Get assignments for a reviewer
   */
  async getMyAssignments(reviewerId: number): Promise<Assignment[]> {
    return this.assignmentRepository.find({
      where: { reviewerId },
      order: { createdAt: 'DESC' },
      relations: ['review'],
    });
  }

  /**
   * Accept or reject assignment
   */
  async updateAssignmentStatus(
    assignmentId: number,
    reviewerId: number,
    status: AssignmentStatus.ACCEPTED | AssignmentStatus.REJECTED,
  ): Promise<Assignment> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id: assignmentId },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment không tồn tại');
    }

    if (assignment.reviewerId !== reviewerId) {
      throw new ForbiddenException(
        'Bạn không có quyền cập nhật assignment này',
      );
    }

    if (assignment.status !== AssignmentStatus.PENDING) {
      throw new BadRequestException(
        'Assignment này đã được xử lý rồi, không thể thay đổi trạng thái',
      );
    }

    assignment.status = status;
    return this.assignmentRepository.save(assignment);
  }

  /**
   * Review Logic: Submit review for an assignment
   */
  async submitReview(reviewerId: number, dto: CreateReviewDto): Promise<Review> {
    // Find assignment
    const assignment = await this.assignmentRepository.findOne({
      where: { id: dto.assignmentId },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment không tồn tại');
    }

    // Verify reviewer owns this assignment
    if (assignment.reviewerId !== reviewerId) {
      throw new ForbiddenException(
        'Bạn không có quyền nộp review cho assignment này',
      );
    }

    // Only ACCEPTED assignments can submit review
    if (assignment.status !== AssignmentStatus.ACCEPTED) {
      throw new BadRequestException(
        `Chỉ có thể nộp review khi assignment ở trạng thái ACCEPTED. Hiện tại: ${assignment.status}`,
      );
    }

    // Check if review already exists (more reliable check)
    const existingReview = await this.reviewRepository.findOne({
      where: { assignmentId: dto.assignmentId },
    });

    if (existingReview) {
      throw new BadRequestException('Review cho assignment này đã được nộp rồi');
    }

    // Create review
    const review = this.reviewRepository.create({
      assignmentId: dto.assignmentId,
      score: dto.score,
      confidence: dto.confidence,
      commentForAuthor: dto.commentForAuthor || null,
      commentForPC: dto.commentForPC || null,
      recommendation: dto.recommendation,
    });

    const savedReview = await this.reviewRepository.save(review);

    // Update assignment status to COMPLETED
    assignment.status = AssignmentStatus.COMPLETED;
    await this.assignmentRepository.save(assignment);

    return savedReview;
  }

  /**
   * Get all reviews for a submission (Chair view)
   */
  async getReviewsBySubmission(submissionId: number): Promise<Review[]> {
    // Find all assignments for this submission
    const assignments = await this.assignmentRepository.find({
      where: { submissionId },
    });

    const assignmentIds = assignments.map((a) => a.id);
    if (assignmentIds.length === 0) {
      return [];
    }

    // Get all reviews for these assignments
    return this.reviewRepository.find({
      where: { assignmentId: In(assignmentIds) },
      relations: ['assignment'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get all bids for a submission (optional helper)
   */
  async getBidsBySubmission(submissionId: number): Promise<ReviewPreference[]> {
    return this.reviewPreferenceRepository.find({
      where: { submissionId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Create PC Discussion message
   */
  async createDiscussion(
    userId: number,
    submissionId: number,
    message: string,
  ): Promise<PcDiscussion> {
    const discussion = this.pcDiscussionRepository.create({
      userId,
      submissionId,
      message,
    });

    return this.pcDiscussionRepository.save(discussion);
  }

  /**
   * Get PC Discussion for a submission
   */
  async getDiscussionsBySubmission(
    submissionId: number,
  ): Promise<PcDiscussion[]> {
    return this.pcDiscussionRepository.find({
      where: { submissionId },
      order: { createdAt: 'ASC' },
    });
  }
}
