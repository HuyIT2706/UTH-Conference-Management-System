import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  ReviewPreference,
  PreferenceType,
} from './entities/review-preference.entity';
import {
  Assignment,
  AssignmentStatus,
} from './entities/assignment.entity';
import { Review } from './entities/review.entity';
import { PcDiscussion } from './entities/pc-discussion.entity';
import { Decision, FinalDecision } from './entities/decision.entity';
import { Rebuttal } from './entities/rebuttal.entity';
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
    @InjectRepository(Decision)
    private readonly decisionRepository: Repository<Decision>,
    @InjectRepository(Rebuttal)
    private readonly rebuttalRepository: Repository<Rebuttal>,
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
      conferenceId: dto.conferenceId,
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
    conferenceId?: number,
  ): Promise<boolean> {
    const where: Record<string, any> = {
      reviewerId,
      submissionId,
    };

    // Nếu truyền conferenceId thì filter theo conferenceId,
    // còn không thì bỏ field này ra khỏi điều kiện where
    if (typeof conferenceId === 'number') {
      where.conferenceId = conferenceId;
    }

    const preference = await this.reviewPreferenceRepository.findOne({
      where: where as any,
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
      dto.conferenceId,
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
        conferenceId: dto.conferenceId,
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
      conferenceId: dto.conferenceId,
      assignedBy: chairId,
      status: AssignmentStatus.PENDING,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
    });

    return this.assignmentRepository.save(assignment);
  }

  /**
   * Get assignments for a reviewer (with simple pagination)
   */
  async getMyAssignments(
    reviewerId: number,
    page = 1,
    limit = 10,
  ): Promise<Assignment[]> {
    const skip = (page - 1) * limit;

    return this.assignmentRepository.find({
      where: { reviewerId },
      order: { createdAt: 'DESC' },
      relations: ['review'],
      skip,
      take: limit,
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
      conferenceId: assignment.conferenceId ?? null,
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
  async getReviewsBySubmission(
    submissionId: number,
    page = 1,
    limit = 10,
  ): Promise<Review[]> {
    // Find all assignments for this submission
    const assignments = await this.assignmentRepository.find({
      where: { submissionId },
    });

    const assignmentIds = assignments.map((a) => a.id);
    if (assignmentIds.length === 0) {
      return [];
    }

    // Get all reviews for these assignments
    const skip = (page - 1) * limit;

    return this.reviewRepository.find({
      where: { assignmentId: In(assignmentIds) },
      relations: ['assignment'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });
  }

  /**
   * Get all bids for a submission (optional helper)
   */
  async getBidsBySubmission(
    submissionId: number,
    page = 1,
    limit = 10,
  ): Promise<ReviewPreference[]> {
    const skip = (page - 1) * limit;

    return this.reviewPreferenceRepository.find({
      where: { submissionId },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
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
    page = 1,
    limit = 20,
  ): Promise<PcDiscussion[]> {
    const skip = (page - 1) * limit;

    return this.pcDiscussionRepository.find({
      where: { submissionId },
      order: { createdAt: 'ASC' },
      skip,
      take: limit,
    });
  }

  /**
   * Auto-assign a submission to multiple reviewers (simple version)
   */
  async autoAssignSubmission(
    chairId: number,
    submissionId: number,
    conferenceId: number,
    reviewerIds: number[],
  ): Promise<{
    created: Assignment[];
    failed: Array<{ reviewerId: number; reason: string }>;
  }> {
    const created: Assignment[] = [];
    const failed: Array<{ reviewerId: number; reason: string }> = [];

    for (const reviewerId of reviewerIds) {
      try {
        const assignment = await this.createAssignment(chairId, {
          reviewerId,
          submissionId,
          conferenceId,
          // no dueDate in auto mode; chair can update later
        } as any);
        created.push(assignment);
      } catch (error: any) {
        failed.push({
          reviewerId,
          reason: error?.message || 'Unknown error',
        });
      }
    }

    return { created, failed };
  }

  /**
   * Rebuttal Logic: Author submits rebuttal for a submission
   */
  async createRebuttal(
    authorId: number,
    submissionId: number,
    conferenceId: number | null,
    message: string,
  ): Promise<Rebuttal> {
    const rebuttal = this.rebuttalRepository.create({
      submissionId,
      authorId,
      conferenceId,
      message,
    });

    return this.rebuttalRepository.save(rebuttal);
  }

  async getRebuttalsBySubmission(submissionId: number): Promise<Rebuttal[]> {
    return this.rebuttalRepository.find({
      where: { submissionId },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Anonymized reviews for authors (single-blind)
   */
  async getAnonymizedReviewsBySubmission(submissionId: number): Promise<
    Array<{
      score: number;
      commentForAuthor: string | null;
      recommendation: string;
      createdAt: Date;
    }>
  > {
    const reviews = await this.getReviewsBySubmission(submissionId, 1, 100);

    return reviews.map((r) => ({
      score: r.score,
      commentForAuthor: r.commentForAuthor,
      recommendation: r.recommendation,
      createdAt: r.createdAt,
    }));
  }

  /**
   * Basic progress tracking for a single submission
   */
  async getSubmissionProgress(submissionId: number): Promise<{
    submissionId: number;
    totalAssignments: number;
    completedAssignments: number;
    pendingAssignments: number;
    reviewsSubmitted: number;
    lastReviewAt: Date | null;
  }> {
    const assignments = await this.assignmentRepository.find({
      where: { submissionId },
    });

    const totalAssignments = assignments.length;
    const completedAssignments = assignments.filter(
      (a) => a.status === AssignmentStatus.COMPLETED,
    ).length;
    const pendingAssignments = assignments.filter(
      (a) => a.status === AssignmentStatus.PENDING,
    ).length;

    const reviews = await this.getReviewsBySubmission(submissionId, 1, 1000);
    const reviewsSubmitted = reviews.length;
    const lastReviewAt =
      reviews.length > 0
        ? reviews.reduce((latest, r) =>
            r.createdAt > latest ? r.createdAt : latest,
          reviews[0].createdAt)
        : null;

    return {
      submissionId,
      totalAssignments,
      completedAssignments,
      pendingAssignments,
      reviewsSubmitted,
      lastReviewAt,
    };
  }

  /**
   * Basic progress tracking for a conference
   */
  async getConferenceProgress(conferenceId: number): Promise<{
    conferenceId: number;
    totalAssignments: number;
    completedAssignments: number;
    pendingAssignments: number;
    reviewsSubmitted: number;
  }> {
    const assignments = await this.assignmentRepository.find({
      where: { conferenceId },
    });

    const totalAssignments = assignments.length;
    const completedAssignments = assignments.filter(
      (a) => a.status === AssignmentStatus.COMPLETED,
    ).length;
    const pendingAssignments = assignments.filter(
      (a) => a.status === AssignmentStatus.PENDING,
    ).length;

    const assignmentIds = assignments.map((a) => a.id);
    let reviewsSubmitted = 0;

    if (assignmentIds.length > 0) {
      reviewsSubmitted = await this.reviewRepository.count({
        where: { assignmentId: In(assignmentIds) },
      });
    }

    return {
      conferenceId,
      totalAssignments,
      completedAssignments,
      pendingAssignments,
      reviewsSubmitted,
    };
  }

  /**
   * Aggregate reviews for a submission (average score, counts)
   * and return together with current final decision (if any)
   */
  async getDecisionSummaryBySubmission(submissionId: number): Promise<{
    submissionId: number;
    stats: {
      reviewCount: number;
      averageScore: number | null;
      minScore: number | null;
      maxScore: number | null;
      recommendationCounts: Record<string, number>;
    };
    decision: Decision | null;
  }> {
    // Get all reviews for this submission
    const assignments = await this.assignmentRepository.find({
      where: { submissionId },
    });

    const assignmentIds = assignments.map((a) => a.id);
    let reviews: Review[] = [];

    if (assignmentIds.length > 0) {
      reviews = await this.reviewRepository.find({
        where: { assignmentId: In(assignmentIds) },
      });
    }

    const reviewCount = reviews.length;
    let averageScore: number | null = null;
    let minScore: number | null = null;
    let maxScore: number | null = null;
    const recommendationCounts: Record<string, number> = {};

    if (reviewCount > 0) {
      const scores = reviews.map((r) => r.score);
      const sum = scores.reduce((acc, v) => acc + v, 0);
      averageScore = sum / reviewCount;
      minScore = Math.min(...scores);
      maxScore = Math.max(...scores);

      for (const r of reviews) {
        const key = r.recommendation;
        recommendationCounts[key] = (recommendationCounts[key] || 0) + 1;
      }
    }

    const decision = await this.decisionRepository.findOne({
      where: { submissionId },
    });

    return {
      submissionId,
      stats: {
        reviewCount,
        averageScore,
        minScore,
        maxScore,
        recommendationCounts,
      },
      decision,
    };
  }

  /**
   * Create or update final decision for a submission (Chair/Admin)
   */
  async upsertDecisionForSubmission(
    submissionId: number,
    decidedBy: number,
    decisionValue: FinalDecision,
    note?: string,
  ): Promise<Decision> {
    let decision = await this.decisionRepository.findOne({
      where: { submissionId },
    });

    if (!decision) {
      decision = this.decisionRepository.create({
        submissionId,
        decision: decisionValue,
        decidedBy,
        note: note ?? null,
      });
    } else {
      decision.decision = decisionValue;
      decision.decidedBy = decidedBy;
      decision.note = note ?? null;
    }

    return this.decisionRepository.save(decision);
  }
}












