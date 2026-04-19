import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Review } from './entities/review.entity';
import { Assignment, AssignmentStatus } from './entities/assignment.entity';
import {
  PreferenceType,
  ReviewPreference,
} from './entities/review-preference.entity';
import { Decision, FinalDecision } from './entities/decision.entity';
import { PcDiscussion } from './entities/pc-discussion.entity';
import { Rebuttal } from './entities/rebuttal.entity';
import { ConfidenceLevel, RecommendationType } from './entities/review.entity';
import { ReviewsService } from './reviews.service';

const createRepositoryMock = <T = any>() =>
  ({
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
  }) as any as Record<keyof any, jest.Mock> & T;

describe('ReviewsService', () => {
  let service: ReviewsService;

  const reviewPreferenceRepository = createRepositoryMock<ReviewPreference>();
  const assignmentRepository = createRepositoryMock<Assignment>();
  const reviewRepository = createRepositoryMock<Review>();
  const pcDiscussionRepository = createRepositoryMock<PcDiscussion>();
  const decisionRepository = createRepositoryMock<Decision>();
  const rebuttalRepository = createRepositoryMock<Rebuttal>();

  const conferenceClient = {
    getMyTrackAssignments: jest.fn(),
  };

  const submissionClient = {
    getSubmissionById: jest.fn(),
    updateSubmissionStatus: jest.fn(),
    getSubmissionsByTrack: jest.fn(),
  };

  const identityClient = {
    getUsersByIds: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new ReviewsService(
      reviewPreferenceRepository as any,
      assignmentRepository as any,
      reviewRepository as any,
      pcDiscussionRepository as any,
      decisionRepository as any,
      rebuttalRepository as any,
      conferenceClient as any,
      submissionClient as any,
      identityClient as any,
    );
  });

  describe('submitBid', () => {
    it('updates existing bid', async () => {
      const existingBid = {
        id: 1,
        reviewerId: 3,
        submissionId: 'sub-1',
        conferenceId: 7,
        preference: PreferenceType.MAYBE,
      };

      reviewPreferenceRepository.findOne.mockResolvedValue(existingBid);
      reviewPreferenceRepository.save.mockResolvedValue({
        ...existingBid,
        preference: PreferenceType.INTERESTED,
      });

      const result = await service.submitBid(3, {
        submissionId: 'sub-1',
        conferenceId: 7,
        preference: PreferenceType.INTERESTED,
      });

      expect(reviewPreferenceRepository.findOne).toHaveBeenCalledWith({
        where: { reviewerId: 3, submissionId: 'sub-1' },
      });
      expect(reviewPreferenceRepository.save).toHaveBeenCalledWith(existingBid);
      expect(result.preference).toBe(PreferenceType.INTERESTED);
    });

    it('creates new bid when none exists', async () => {
      reviewPreferenceRepository.findOne.mockResolvedValue(null);
      reviewPreferenceRepository.create.mockReturnValue({
        reviewerId: 4,
        submissionId: 'sub-2',
        conferenceId: 11,
        preference: PreferenceType.CONFLICT,
      });
      reviewPreferenceRepository.save.mockResolvedValue({
        id: 9,
        reviewerId: 4,
        submissionId: 'sub-2',
        conferenceId: 11,
        preference: PreferenceType.CONFLICT,
      });

      const result = await service.submitBid(4, {
        submissionId: 'sub-2',
        conferenceId: 11,
        preference: PreferenceType.CONFLICT,
      });

      expect(reviewPreferenceRepository.create).toHaveBeenCalledWith({
        reviewerId: 4,
        submissionId: 'sub-2',
        conferenceId: 11,
        preference: PreferenceType.CONFLICT,
      });
      expect(result.id).toBe(9);
    });
  });

  describe('checkConflictOfInterest', () => {
    it('returns true for conflict preference', async () => {
      reviewPreferenceRepository.findOne.mockResolvedValue({
        preference: PreferenceType.CONFLICT,
      });

      await expect(
        service.checkConflictOfInterest(5, 'sub-3', 12),
      ).resolves.toBe(true);
    });

    it('returns false when no conflict exists', async () => {
      reviewPreferenceRepository.findOne.mockResolvedValue({
        preference: PreferenceType.INTERESTED,
      });

      await expect(service.checkConflictOfInterest(5, 33, 12)).resolves.toBe(
        false,
      );
    });
  });

  describe('selfAssignSubmission', () => {
    it('rejects self assignment when conflict exists', async () => {
      jest.spyOn(service, 'checkConflictOfInterest').mockResolvedValue(true);

      await expect(
        service.selfAssignSubmission(1, 'sub-4', 2),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('returns existing accepted assignment unchanged', async () => {
      jest.spyOn(service, 'checkConflictOfInterest').mockResolvedValue(false);
      const assignment = {
        id: 20,
        reviewerId: 1,
        submissionId: 'sub-5',
        conferenceId: 8,
        status: AssignmentStatus.ACCEPTED,
      } as Assignment;

      assignmentRepository.findOne.mockResolvedValue(assignment);

      const result = await service.selfAssignSubmission(1, 'sub-5', 8);

      expect(result).toBe(assignment);
      expect(assignmentRepository.save).not.toHaveBeenCalled();
    });

    it('updates existing pending assignment to accepted', async () => {
      jest.spyOn(service, 'checkConflictOfInterest').mockResolvedValue(false);
      const assignment = {
        id: 21,
        reviewerId: 1,
        submissionId: 'sub-6',
        conferenceId: 8,
        status: AssignmentStatus.PENDING,
      } as Assignment;

      assignmentRepository.findOne.mockResolvedValue(assignment);
      assignmentRepository.save.mockResolvedValue({
        ...assignment,
        status: AssignmentStatus.ACCEPTED,
      });

      const result = await service.selfAssignSubmission(1, 'sub-6', 8);

      expect(assignment.status).toBe(AssignmentStatus.ACCEPTED);
      expect(assignmentRepository.save).toHaveBeenCalledWith(assignment);
      expect(result.status).toBe(AssignmentStatus.ACCEPTED);
    });

    it('creates a new accepted assignment', async () => {
      jest.spyOn(service, 'checkConflictOfInterest').mockResolvedValue(false);
      assignmentRepository.findOne.mockResolvedValue(null);
      assignmentRepository.create.mockReturnValue({
        id: 22,
        reviewerId: 2,
        submissionId: 'sub-7',
        conferenceId: 9,
        assignedBy: 2,
        status: AssignmentStatus.ACCEPTED,
        dueDate: null,
      });
      assignmentRepository.save.mockResolvedValue({
        id: 22,
        reviewerId: 2,
        submissionId: 'sub-7',
        conferenceId: 9,
        assignedBy: 2,
        status: AssignmentStatus.ACCEPTED,
        dueDate: null,
      });

      const result = await service.selfAssignSubmission(2, 'sub-7', 9);

      expect(assignmentRepository.create).toHaveBeenCalledWith({
        reviewerId: 2,
        submissionId: 'sub-7',
        conferenceId: 9,
        assignedBy: 2,
        status: AssignmentStatus.ACCEPTED,
        dueDate: null,
      });
      expect(result.status).toBe(AssignmentStatus.ACCEPTED);
    });
  });

  describe('submitReview', () => {
    it('throws when assignment does not exist', async () => {
      assignmentRepository.findOne.mockResolvedValue(null);

      await expect(
        service.submitReview(1, {
          assignmentId: 100,
          score: 8,
          confidence: ConfidenceLevel.HIGH,
          recommendation: RecommendationType.ACCEPT,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws when reviewer does not own assignment', async () => {
      assignmentRepository.findOne.mockResolvedValue({
        id: 1,
        reviewerId: 2,
        conferenceId: 3,
        status: AssignmentStatus.ACCEPTED,
      });

      await expect(
        service.submitReview(1, {
          assignmentId: 1,
          score: 8,
          confidence: ConfidenceLevel.HIGH,
          recommendation: RecommendationType.ACCEPT,
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('creates a review for accepted assignment and updates submission status', async () => {
      const assignment = {
        id: 10,
        reviewerId: 1,
        conferenceId: 4,
        submissionId: 'submission-10',
        status: AssignmentStatus.ACCEPTED,
        dueDate: null,
      } as Assignment;

      assignmentRepository.findOne.mockResolvedValue(assignment);
      reviewRepository.findOne.mockResolvedValue(null);
      reviewRepository.create.mockReturnValue({
        id: 77,
        assignmentId: 10,
        conferenceId: 4,
        score: 0,
        confidence: ConfidenceLevel.LOW,
        commentForAuthor: null,
        commentForPC: null,
        recommendation: RecommendationType.REJECT,
      });
      reviewRepository.save.mockResolvedValue({
        id: 77,
        assignmentId: 10,
        conferenceId: 4,
        score: 9,
        confidence: ConfidenceLevel.HIGH,
        commentForAuthor: 'Good work',
        commentForPC: null,
        recommendation: RecommendationType.ACCEPT,
      });
      submissionClient.getSubmissionById.mockResolvedValue({
        id: 'submission-10',
        status: 'SUBMITTED',
      });
      submissionClient.updateSubmissionStatus.mockResolvedValue({
        id: 'submission-10',
        status: 'REVIEWING',
      });

      const result = await service.submitReview(
        1,
        {
          assignmentId: 10,
          score: 9,
          confidence: ConfidenceLevel.HIGH,
          commentForAuthor: 'Good work',
          commentForPC: 'Internal note',
          recommendation: RecommendationType.ACCEPT,
        },
        'token-1',
      );

      expect(reviewRepository.create).toHaveBeenCalledWith({
        assignmentId: 10,
        conferenceId: 4,
        score: 9,
        confidence: ConfidenceLevel.HIGH,
        commentForAuthor: 'Good work',
        commentForPC: 'Internal note',
        recommendation: RecommendationType.ACCEPT,
      });
      expect(assignment.status).toBe(AssignmentStatus.COMPLETED);
      expect(submissionClient.updateSubmissionStatus).toHaveBeenCalledWith(
        'submission-10',
        'REVIEWING',
        'token-1',
      );
      expect(result.id).toBe(77);
    });

    it('updates existing review when assignment is completed and deadline has not passed', async () => {
      const futureDueDate = new Date(Date.now() + 60_000);
      const assignment = {
        id: 11,
        reviewerId: 1,
        conferenceId: 4,
        submissionId: 'submission-11',
        status: AssignmentStatus.COMPLETED,
        dueDate: futureDueDate,
      } as Assignment;

      const existingReview = {
        id: 88,
        assignmentId: 11,
        score: 6,
        confidence: ConfidenceLevel.MEDIUM,
        commentForAuthor: 'Old',
        commentForPC: 'Old PC',
        recommendation: RecommendationType.WEAK_ACCEPT,
      } as Review;

      assignmentRepository.findOne.mockResolvedValue(assignment);
      reviewRepository.findOne.mockResolvedValue(existingReview);
      reviewRepository.save.mockResolvedValue({
        ...existingReview,
        score: 10,
        confidence: ConfidenceLevel.HIGH,
        commentForAuthor: 'Updated',
        commentForPC: null,
        recommendation: RecommendationType.ACCEPT,
      });
      submissionClient.getSubmissionById.mockResolvedValue({
        id: 'submission-11',
        status: 'SUBMITTED',
      });

      const result = await service.submitReview(
        1,
        {
          assignmentId: 11,
          score: 10,
          confidence: ConfidenceLevel.HIGH,
          commentForAuthor: 'Updated',
          recommendation: RecommendationType.ACCEPT,
        },
        'token-2',
      );

      expect(reviewRepository.save).toHaveBeenCalledWith(existingReview);
      expect(result.score).toBe(10);
    });

    it('throws when completed assignment is past deadline', async () => {
      const pastDueDate = new Date(Date.now() - 60_000);
      const assignment = {
        id: 12,
        reviewerId: 1,
        conferenceId: 4,
        submissionId: 'submission-12',
        status: AssignmentStatus.COMPLETED,
        dueDate: pastDueDate,
      } as Assignment;

      assignmentRepository.findOne.mockResolvedValue(assignment);
      reviewRepository.findOne.mockResolvedValue({ id: 99 } as Review);

      await expect(
        service.submitReview(
          1,
          {
            assignmentId: 12,
            score: 7,
            confidence: ConfidenceLevel.MEDIUM,
            recommendation: RecommendationType.WEAK_ACCEPT,
          },
          'token-3',
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws when duplicate review is submitted for active assignment', async () => {
      assignmentRepository.findOne.mockResolvedValue({
        id: 13,
        reviewerId: 1,
        conferenceId: 4,
        submissionId: 'submission-13',
        status: AssignmentStatus.ACCEPTED,
        dueDate: null,
      });
      reviewRepository.findOne.mockResolvedValue({ id: 101 } as Review);

      await expect(
        service.submitReview(1, {
          assignmentId: 13,
          score: 8,
          confidence: ConfidenceLevel.HIGH,
          recommendation: RecommendationType.ACCEPT,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws when completed assignment has no existing review record', async () => {
      assignmentRepository.findOne.mockResolvedValue({
        id: 14,
        reviewerId: 1,
        conferenceId: 4,
        submissionId: 'submission-14',
        status: AssignmentStatus.COMPLETED,
        dueDate: null,
      });
      reviewRepository.findOne.mockResolvedValue(null);

      await expect(
        service.submitReview(1, {
          assignmentId: 14,
          score: 8,
          confidence: ConfidenceLevel.HIGH,
          recommendation: RecommendationType.ACCEPT,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('does not call submission client when auth token is missing', async () => {
      const assignment = {
        id: 15,
        reviewerId: 1,
        conferenceId: 4,
        submissionId: 'submission-15',
        status: AssignmentStatus.ACCEPTED,
        dueDate: null,
      } as Assignment;

      assignmentRepository.findOne.mockResolvedValue(assignment);
      reviewRepository.findOne.mockResolvedValue(null);
      reviewRepository.create.mockReturnValue({
        assignmentId: 15,
        conferenceId: 4,
        score: 7,
        confidence: ConfidenceLevel.MEDIUM,
        commentForAuthor: null,
        commentForPC: null,
        recommendation: RecommendationType.WEAK_ACCEPT,
      });
      reviewRepository.save.mockResolvedValue({
        id: 201,
        assignmentId: 15,
        conferenceId: 4,
        score: 7,
        confidence: ConfidenceLevel.MEDIUM,
        commentForAuthor: null,
        commentForPC: null,
        recommendation: RecommendationType.WEAK_ACCEPT,
      });
      assignmentRepository.save.mockResolvedValue({
        ...assignment,
        status: AssignmentStatus.COMPLETED,
      });

      await service.submitReview(1, {
        assignmentId: 15,
        score: 7,
        confidence: ConfidenceLevel.MEDIUM,
        recommendation: RecommendationType.WEAK_ACCEPT,
      });

      expect(submissionClient.getSubmissionById).not.toHaveBeenCalled();
      expect(submissionClient.updateSubmissionStatus).not.toHaveBeenCalled();
    });

    it('does not update submission when status is not SUBMITTED', async () => {
      const assignment = {
        id: 16,
        reviewerId: 1,
        conferenceId: 4,
        submissionId: 'submission-16',
        status: AssignmentStatus.ACCEPTED,
        dueDate: null,
      } as Assignment;

      assignmentRepository.findOne.mockResolvedValue(assignment);
      reviewRepository.findOne.mockResolvedValue(null);
      reviewRepository.create.mockReturnValue({
        assignmentId: 16,
        conferenceId: 4,
        score: 9,
        confidence: ConfidenceLevel.HIGH,
        commentForAuthor: null,
        commentForPC: null,
        recommendation: RecommendationType.ACCEPT,
      });
      reviewRepository.save.mockResolvedValue({
        id: 202,
        assignmentId: 16,
        conferenceId: 4,
        score: 9,
        confidence: ConfidenceLevel.HIGH,
        commentForAuthor: null,
        commentForPC: null,
        recommendation: RecommendationType.ACCEPT,
      });
      assignmentRepository.save.mockResolvedValue({
        ...assignment,
        status: AssignmentStatus.COMPLETED,
      });
      submissionClient.getSubmissionById.mockResolvedValue({
        id: 'submission-16',
        status: 'REVIEWING',
      });

      await service.submitReview(
        1,
        {
          assignmentId: 16,
          score: 9,
          confidence: ConfidenceLevel.HIGH,
          recommendation: RecommendationType.ACCEPT,
        },
        'token-7',
      );

      expect(submissionClient.getSubmissionById).toHaveBeenCalledWith(
        'submission-16',
        'token-7',
      );
      expect(submissionClient.updateSubmissionStatus).not.toHaveBeenCalled();
    });
  });

  describe('getReviewsBySubmission', () => {
    it('returns enriched reviews with reviewer names', async () => {
      assignmentRepository.find.mockResolvedValue([
        { id: 1, reviewerId: 10 },
        { id: 2, reviewerId: 11 },
      ]);
      reviewRepository.find.mockResolvedValue([
        {
          id: 1,
          score: 8,
          commentForAuthor: 'A',
          recommendation: RecommendationType.ACCEPT,
          createdAt: new Date('2026-01-01T00:00:00Z'),
          assignment: { reviewerId: 10 },
        },
        {
          id: 2,
          score: 6,
          commentForAuthor: 'B',
          recommendation: RecommendationType.REJECT,
          createdAt: new Date('2026-01-02T00:00:00Z'),
          assignment: { reviewerId: 11 },
        },
      ]);
      identityClient.getUsersByIds.mockResolvedValue(
        new Map([
          [10, { id: 10, email: 'r10@example.com', fullName: 'Reviewer 10' }],
          [11, { id: 11, email: 'r11@example.com', fullName: 'Reviewer 11' }],
        ]),
      );

      const result = await service.getReviewsBySubmission(
        'submission-14',
        1,
        10,
        'token-4',
      );

      expect(result[0].reviewerName).toBe('Reviewer 10');
      expect(result[1].reviewerName).toBe('Reviewer 11');
    });

    it('falls back to reviewer number when identity service fails', async () => {
      assignmentRepository.find.mockResolvedValue([{ id: 1, reviewerId: 20 }]);
      reviewRepository.find.mockResolvedValue([
        {
          id: 3,
          score: 7,
          commentForAuthor: 'C',
          recommendation: RecommendationType.WEAK_ACCEPT,
          createdAt: new Date('2026-01-03T00:00:00Z'),
          assignment: { reviewerId: 20 },
        },
      ]);
      identityClient.getUsersByIds.mockRejectedValue(new Error('boom'));

      const result = await service.getReviewsBySubmission(
        'submission-15',
        1,
        10,
        'token-5',
      );

      expect(result[0].reviewerName).toBe('Reviewer #20');
    });

    it('returns empty array when there are no assignments', async () => {
      assignmentRepository.find.mockResolvedValue([]);

      await expect(
        service.getReviewsBySubmission('submission-16'),
      ).resolves.toEqual([]);
    });
  });

  describe('getDecisionSummaryBySubmission', () => {
    it('calculates statistics and returns decision', async () => {
      assignmentRepository.find.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      reviewRepository.find.mockResolvedValue([
        {
          score: 8,
          recommendation: RecommendationType.ACCEPT,
        },
        {
          score: 6,
          recommendation: RecommendationType.REJECT,
        },
      ]);
      decisionRepository.findOne.mockResolvedValue({
        id: 44,
        submissionId: 'submission-17',
        decision: FinalDecision.ACCEPT,
      });

      const result =
        await service.getDecisionSummaryBySubmission('submission-17');

      expect(result.stats.reviewCount).toBe(2);
      expect(result.stats.averageScore).toBe(7);
      expect(result.stats.minScore).toBe(6);
      expect(result.stats.maxScore).toBe(8);
      expect(result.stats.recommendationCounts).toEqual({
        ACCEPT: 1,
        REJECT: 1,
      });
      expect(result.decision?.decision).toBe(FinalDecision.ACCEPT);
    });
  });

  describe('upsertDecisionForSubmission', () => {
    it('creates new decision when none exists', async () => {
      decisionRepository.findOne.mockResolvedValue(null);
      decisionRepository.create.mockReturnValue({
        id: 50,
        submissionId: 'submission-18',
        decision: FinalDecision.REJECT,
        decidedBy: 7,
        note: 'note',
      });
      decisionRepository.save.mockResolvedValue({
        id: 50,
        submissionId: 'submission-18',
        decision: FinalDecision.REJECT,
        decidedBy: 7,
        note: 'note',
      });

      const result = await service.upsertDecisionForSubmission(
        'submission-18',
        7,
        FinalDecision.REJECT,
        'note',
      );

      expect(decisionRepository.create).toHaveBeenCalledWith({
        submissionId: 'submission-18',
        decision: FinalDecision.REJECT,
        decidedBy: 7,
        note: 'note',
      });
      expect(result.id).toBe(50);
    });
  });

  describe('getSubmissionsForReviewer', () => {
    it('filters submissions by accepted tracks and deduplicates them', async () => {
      conferenceClient.getMyTrackAssignments.mockResolvedValue([
        { trackId: 1, status: 'ACCEPTED' },
        { trackId: 2, status: 'PENDING' },
        { trackId: 3, status: 'ACCEPTED' },
      ]);
      submissionClient.getSubmissionsByTrack
        .mockResolvedValueOnce([
          { id: 'a', status: 'SUBMITTED' },
          { id: 'b', status: 'DRAFT' },
        ])
        .mockResolvedValueOnce([
          { id: 'a', status: 'SUBMITTED' },
          { id: 'c', status: 'REVIEWING' },
          { id: 'd', status: 'WITHDRAWN' },
        ]);

      const result = await service.getSubmissionsForReviewer(1, 'token-6');

      expect(result.map((item) => item.id)).toEqual(['a', 'c']);
    });

    it('returns empty array when conference service fails', async () => {
      conferenceClient.getMyTrackAssignments.mockRejectedValue(
        new Error('conference unavailable'),
      );

      const result = await service.getSubmissionsForReviewer(1, 'token-8');

      expect(result).toEqual([]);
      expect(submissionClient.getSubmissionsByTrack).not.toHaveBeenCalled();
    });

    it('applies status filter when provided', async () => {
      conferenceClient.getMyTrackAssignments.mockResolvedValue([
        { trackId: 10, status: 'ACCEPTED' },
      ]);
      submissionClient.getSubmissionsByTrack.mockResolvedValue([
        { id: 's-1', status: 'SUBMITTED' },
        { id: 's-2', status: 'REVIEWING' },
        { id: 's-3', status: 'WITHDRAWN' },
      ]);

      const result = await service.getSubmissionsForReviewer(1, 'token-9', [
        'REVIEWING',
      ]);

      expect(result).toEqual([{ id: 's-2', status: 'REVIEWING' }]);
    });
  });

  describe('getReviewerActivityStats', () => {
    it('returns reviewer activity metrics', async () => {
      assignmentRepository.find.mockResolvedValue([
        { id: 1, status: AssignmentStatus.PENDING },
        { id: 2, status: AssignmentStatus.REJECTED },
        { id: 3, status: AssignmentStatus.ACCEPTED },
      ]);
      reviewRepository.find.mockResolvedValue([{ id: 11 }, { id: 12 }]);

      const result = await service.getReviewerActivityStats(99);

      expect(result).toEqual({
        assignmentCount: 3,
        reviewCount: 2,
        hasActiveAssignments: true,
        completedReviews: 2,
      });
    });
  });

  describe('getSubmissionProgress', () => {
    it('summarizes submission progress metrics', async () => {
      assignmentRepository.find.mockResolvedValue([
        { id: 1, status: AssignmentStatus.COMPLETED },
        { id: 2, status: AssignmentStatus.PENDING },
      ]);
      reviewRepository.find.mockResolvedValue([
        { createdAt: new Date('2026-02-01T00:00:00Z') },
        { createdAt: new Date('2026-03-01T00:00:00Z') },
      ]);

      const result = await service.getSubmissionProgress('submission-19');

      expect(result).toEqual({
        submissionId: 'submission-19',
        totalAssignments: 2,
        completedAssignments: 1,
        pendingAssignments: 1,
        reviewsSubmitted: 2,
        lastReviewAt: new Date('2026-03-01T00:00:00Z'),
      });
    });
  });

  describe('getConferenceProgress', () => {
    it('summarizes conference progress metrics', async () => {
      assignmentRepository.find.mockResolvedValue([
        { id: 1, status: AssignmentStatus.COMPLETED },
        { id: 2, status: AssignmentStatus.PENDING },
      ]);
      reviewRepository.count.mockResolvedValue(2);

      const result = await service.getConferenceProgress(15);

      expect(result).toEqual({
        conferenceId: 15,
        totalAssignments: 2,
        completedAssignments: 1,
        pendingAssignments: 1,
        reviewsSubmitted: 2,
      });
    });
  });
});
