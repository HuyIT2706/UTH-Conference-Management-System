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
import { ConferenceClientService } from '../integrations/conference-client.service';
import { SubmissionClientService, Submission } from '../integrations/submission-client.service';

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
    private readonly conferenceClient: ConferenceClientService,
    private readonly submissionClient: SubmissionClientService,
  ) {}

  /**
   * Bidding Logic: Reviewer submit preference for a submission
   */
  async submitBid(reviewerId: number, dto: CreateBidDto): Promise<ReviewPreference> {
    // Check if bid already exists
    const existingBid = await this.reviewPreferenceRepository.findOne({
      where: {
        reviewerId,
        submissionId: String(dto.submissionId),
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
      submissionId: String(dto.submissionId),
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
    submissionId: string | number,
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
   * Reviewer self-assigns a submission for review
   * This is allowed when reviewer has accepted the track assignment
   */
  async selfAssignSubmission(
    reviewerId: number,
    submissionId: string, // UUID from submission-service
    conferenceId: number,
  ): Promise<Assignment> {
    // Check for Conflict of Interest
    const hasConflict = await this.checkConflictOfInterest(
      reviewerId,
      submissionId,
      conferenceId,
    );

    if (hasConflict) {
      throw new BadRequestException(
        'Không thể tự phân công bài này vì bạn đã báo cáo xung đột lợi ích (CONFLICT)',
      );
    }

    // Check if assignment already exists
    const existingAssignment = await this.assignmentRepository.findOne({
      where: {
        reviewerId,
        submissionId,
        conferenceId,
      },
    });

    if (existingAssignment) {
      // If exists and is ACCEPTED, return it
      if (existingAssignment.status === AssignmentStatus.ACCEPTED) {
        return existingAssignment;
      }
      // If exists but not ACCEPTED, accept it
      existingAssignment.status = AssignmentStatus.ACCEPTED;
      return this.assignmentRepository.save(existingAssignment);
    }

    // Create assignment with ACCEPTED status (reviewer already accepted track)
    const assignment = this.assignmentRepository.create({
      reviewerId,
      submissionId,
      conferenceId,
      assignedBy: reviewerId, // Self-assigned
      status: AssignmentStatus.ACCEPTED, // Auto-accept since reviewer accepted track
      dueDate: null,
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
    submissionId: string | number,
    page = 1,
    limit = 10,
  ): Promise<Review[]> {
    // Find all assignments for this submission
    const assignments = await this.assignmentRepository.find({
      where: { submissionId: String(submissionId) },
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
    submissionId: string | number,
    page = 1,
    limit = 10,
  ): Promise<ReviewPreference[]> {
    const skip = (page - 1) * limit;

    return this.reviewPreferenceRepository.find({
      where: { submissionId: String(submissionId) },
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
    submissionId: string | number,
    message: string,
  ): Promise<PcDiscussion> {
    const discussion = this.pcDiscussionRepository.create({
      userId,
      submissionId: String(submissionId),
      message,
    });

    return this.pcDiscussionRepository.save(discussion);
  }

  /**
   * Get PC Discussion for a submission
   */
  async getDiscussionsBySubmission(
    submissionId: string | number,
    page = 1,
    limit = 20,
  ): Promise<PcDiscussion[]> {
    const skip = (page - 1) * limit;

    return this.pcDiscussionRepository.find({
      where: { submissionId: String(submissionId) },
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
    submissionId: string | number,
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
          submissionId: String(submissionId),
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
    submissionId: string | number,
    conferenceId: number | null,
    message: string,
  ): Promise<Rebuttal> {
    const rebuttal = this.rebuttalRepository.create({
      submissionId: String(submissionId),
      authorId,
      conferenceId,
      message,
    });

    return this.rebuttalRepository.save(rebuttal);
  }

  async getRebuttalsBySubmission(submissionId: string | number): Promise<Rebuttal[]> {
    return this.rebuttalRepository.find({
      where: { submissionId: String(submissionId) },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Anonymized reviews for authors (single-blind)
   */
  async getAnonymizedReviewsBySubmission(submissionId: string | number): Promise<
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
  async getSubmissionProgress(submissionId: string | number): Promise<{
    submissionId: string | number;
    totalAssignments: number;
    completedAssignments: number;
    pendingAssignments: number;
    reviewsSubmitted: number;
    lastReviewAt: Date | null;
  }> {
    const assignments = await this.assignmentRepository.find({
      where: { submissionId: String(submissionId) },
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
  async getDecisionSummaryBySubmission(submissionId: string | number): Promise<{
    submissionId: string | number;
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
      where: { submissionId: String(submissionId) },
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
      where: { submissionId: String(submissionId) },
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
    submissionId: string | number,
    decidedBy: number,
    decisionValue: FinalDecision,
    note?: string,
  ): Promise<Decision> {
    let decision = await this.decisionRepository.findOne({
      where: { submissionId: String(submissionId) },
    });

    if (!decision) {
      decision = this.decisionRepository.create({
        submissionId: String(submissionId),
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

  /**
   * Get submissions for reviewer in accepted tracks
   * This endpoint aggregates data from conference-service and submission-service
   */
  async getSubmissionsForReviewer(
    reviewerId: number,
    authToken: string,
    status?: string[],
  ): Promise<Submission[]> {
    console.log('[ReviewsService] getSubmissionsForReviewer called:', {
      reviewerId,
      status,
      hasAuthToken: !!authToken,
    });

    // 1. Get accepted track assignments from conference-service
    let acceptedTracks: any[] = [];
    try {
      console.log('[ReviewsService] Calling conferenceClient.getMyTrackAssignments...');
      const trackAssignments = await this.conferenceClient.getMyTrackAssignments(authToken);
      
      console.log('[ReviewsService] Got track assignments from conference-service:', {
        count: trackAssignments.length,
        assignments: trackAssignments.map(a => ({
          id: a.id,
          trackId: a.trackId,
          status: a.status,
          trackName: a.track?.name,
        })),
      });
      
      // Filter only ACCEPTED tracks
      acceptedTracks = trackAssignments.filter(
        (assignment) => assignment.status === 'ACCEPTED',
      );

      console.log('[ReviewsService] Accepted tracks for reviewer:', {
        reviewerId,
        totalAssignments: trackAssignments.length,
        acceptedTracksCount: acceptedTracks.length,
        trackIds: acceptedTracks.map((t) => t.trackId),
        trackNames: acceptedTracks.map((t) => t.track?.name),
      });
    } catch (error) {
      console.error('[ReviewsService] Error getting track assignments:', {
        error: error instanceof Error ? error.message : error,
        reviewerId,
        errorStack: error instanceof Error ? error.stack : undefined,
      });
      // If conference-service is down or error, return empty array
      return [];
    }

    if (acceptedTracks.length === 0) {
      console.log('[ReviewsService] No accepted tracks for reviewer');
      return [];
    }

    // 2. Get submissions for each accepted track
    const allSubmissions: Submission[] = [];
    
    console.log('[ReviewsService] Starting to fetch submissions for accepted tracks:', {
      acceptedTracksCount: acceptedTracks.length,
      trackIds: acceptedTracks.map(t => t.trackId),
    });
    
    for (const trackAssignment of acceptedTracks) {
      try {
        console.log('[ReviewsService] Fetching submissions for track:', {
          trackId: trackAssignment.trackId,
          trackName: trackAssignment.track?.name,
        });
        
        // Get submissions - if status filter provided, use it; otherwise get all and filter later
        // Note: submission-service only supports single status, so we'll get all and filter
        const submissions = await this.submissionClient.getSubmissionsByTrack(
          trackAssignment.trackId,
          authToken,
          undefined, // Don't pass status - get all submissions, filter in this service
        );
        
        console.log('[ReviewsService] Got submissions for track (before filter):', {
          trackId: trackAssignment.trackId,
          trackName: trackAssignment.track?.name,
          count: submissions.length,
          statuses: submissions.map(s => s.status),
          submissionIds: submissions.map(s => s.id),
        });
        
        // Filter by status if provided, otherwise filter out DRAFT and WITHDRAWN
        let filteredSubmissions = submissions;
        if (status && status.length > 0) {
          // Ensure status is an array (handle case where it might be a string)
          const statusArray = Array.isArray(status) ? status : [status];
          filteredSubmissions = submissions.filter((s) => statusArray.includes(s.status));
          console.log('[ReviewsService] After status filter:', {
            before: submissions.length,
            after: filteredSubmissions.length,
            filterStatus: statusArray,
            submissionStatuses: submissions.map(s => s.status),
          });
        } else {
          // Default: exclude DRAFT and WITHDRAWN
          filteredSubmissions = submissions.filter(
            (s) => s.status !== 'DRAFT' && s.status !== 'WITHDRAWN'
          );
          console.log('[ReviewsService] After filtering out DRAFT/WITHDRAWN:', {
            before: submissions.length,
            after: filteredSubmissions.length,
          });
        }
        
        allSubmissions.push(...filteredSubmissions);
      } catch (error) {
        console.error('[ReviewsService] Error getting submissions for track:', {
          trackId: trackAssignment.trackId,
          error: error instanceof Error ? error.message : error,
        });
        // Continue with other tracks even if one fails
      }
    }

    // Remove duplicates (in case same submission appears in multiple tracks - shouldn't happen but just in case)
    const uniqueSubmissions = Array.from(
      new Map(allSubmissions.map((s) => [s.id, s])).values(),
    );

    console.log('[ReviewsService] Total unique submissions for reviewer:', {
      reviewerId,
      total: uniqueSubmissions.length,
    });

    return uniqueSubmissions;
  }
}











