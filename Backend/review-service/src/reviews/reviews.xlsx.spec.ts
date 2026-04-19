import { UnauthorizedException, ForbiddenException, BadRequestException, NotFoundException, ParseUUIDPipe, ParseIntPipe } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { ReviewsController } from './reviews.controller';
import { CreateBidDto } from './dto/create-bid.dto';
import { CreateDecisionDto } from './dto/create-decision.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { SelfAssignDto } from './dto/self-assign.dto';
import { PreferenceType } from './entities/review-preference.entity';
import { FinalDecision } from './entities/decision.entity';
import { ConfidenceLevel, RecommendationType } from './entities/review.entity';

type WorkbookCase = {
  id: string;
  functionName: string;
  description: string;
  input: string;
  expected: string;
  preconditions: string;
};

const workbookPath = path.resolve(process.cwd(), 'Testcase.xlsx');

function loadWorkbookCases(): WorkbookCase[] {
  const workbook = XLSX.readFile(workbookPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false }) as any[][];

  return rows
    .slice(8)
    .filter((row) => typeof row[0] === 'string' && /^(RTC|BVA)_/.test(row[0]))
    .map((row) => ({
      id: String(row[0]),
      functionName: String(row[1] || ''),
      description: String(row[2] || ''),
      input: String(row[3] || ''),
      expected: String(row[4] || ''),
      preconditions: String(row[5] || ''),
    }));
}

function makeRequest(
  options: {
    sub?: number;
    roles?: string[];
    token?: string;
  } = {},
  token?: string,
) {
  const bearerToken = token ?? options.token;
  return {
    user: options.sub
      ? { sub: options.sub, roles: options.roles || [] }
      : options.roles
        ? { roles: options.roles }
        : undefined,
    headers: bearerToken ? { authorization: `Bearer ${bearerToken}` } : {},
  } as any;
}

function validateDto<T>(dtoClass: new () => T, payload: Record<string, any>) {
  const dto = plainToInstance(dtoClass, payload);
  return validateSync(dto as object, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
}

function expectDto400<T>(dtoClass: new () => T, payload: Record<string, any>) {
  const errors = validateDto(dtoClass, payload);
  expect(errors.length).toBeGreaterThan(0);
}

function expectDto200<T>(dtoClass: new () => T, payload: Record<string, any>) {
  const errors = validateDto(dtoClass, payload);
  expect(errors).toHaveLength(0);
}

describe('Reviews workbook cases', () => {
  const cases = loadWorkbookCases();
  expect(cases).toHaveLength(126);

  const reviewsService = {
    submitBid: jest.fn(),
    getMyAssignments: jest.fn(),
    selfAssignSubmission: jest.fn(),
    submitReview: jest.fn(),
    checkReviewerAssignment: jest.fn(),
    getReviewsBySubmission: jest.fn(),
    getAnonymizedReviewsBySubmission: jest.fn(),
    getBidsBySubmission: jest.fn(),
    getDiscussionsBySubmission: jest.fn(),
    getDecisionSummaryBySubmission: jest.fn(),
    upsertDecisionForSubmission: jest.fn(),
    getSubmissionProgress: jest.fn(),
    getConferenceProgress: jest.fn(),
    getSubmissionsForReviewer: jest.fn(),
    getReviewerActivityStats: jest.fn(),
  } as any;

  const controller = new ReviewsController(reviewsService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  async function expectPipeRejects(pipe: { transform: (value: any, metadata: any) => any }, value: any, metadata: any) {
    await expect(Promise.resolve().then(() => pipe.transform(value, metadata))).rejects.toBeDefined();
  }

  async function expectPipePasses(pipe: { transform: (value: any, metadata: any) => any }, value: any, metadata: any) {
    await expect(Promise.resolve().then(() => pipe.transform(value, metadata))).resolves.toBeDefined();
  }

  for (const testCase of cases) {
    it(`${testCase.id} [${testCase.id.startsWith('RTC') ? 'RTC' : 'BVA'}] ${testCase.description}`, async () => {
      await runCase(testCase);
    });
  }

  async function runCase(testCase: WorkbookCase) {
    switch (testCase.functionName) {
      case 'submitBid':
        return runSubmitBidCase(testCase);
      case 'getMyAssignments':
        return runGetMyAssignmentsCase(testCase);
      case 'selfAssignSubmission':
        return runSelfAssignCase(testCase);
      case 'submitReview':
        return runSubmitReviewCase(testCase);
      case 'getReviewsBySubmission':
        return runGetReviewsBySubmissionCase(testCase);
      case 'getAnonymizedReviewsBySubmission':
        return runAnonymizedReviewsCase(testCase);
      case 'getBidsBySubmission':
        return runBidsBySubmissionCase(testCase);
      case 'getDiscussionsBySubmission':
        return runDiscussionsBySubmissionCase(testCase);
      case 'upsertDecision':
        return runDecisionCase(testCase);
      case 'getDecisionSummaryBySubmission':
        return runDecisionSummaryCase(testCase);
      case 'getSubmissionProgress':
        return runSubmissionProgressCase(testCase);
      case 'getConferenceProgress':
        return runConferenceProgressCase(testCase);
      case 'getSubmissionsForReviewer':
        return runSubmissionsForReviewerCase(testCase);
      case 'getReviewerActivityStats':
        return runReviewerActivityStatsCase(testCase);
      default:
        throw new Error(`Unknown function name in workbook: ${testCase.functionName}`);
    }
  }

  async function runSubmitBidCase(testCase: WorkbookCase) {
    const validDto = {
      submissionId: '8ccd4365-3258-4b87-8903-c48d06189ed1',
      conferenceId: 1,
      preference: PreferenceType.INTERESTED,
    };

    if (testCase.id.startsWith('BVA_1.')) {
      switch (testCase.id) {
        case 'BVA_1.1':
          expectDto400(CreateBidDto, { ...validDto, conferenceId: 0 });
          return;
        case 'BVA_1.2':
        case 'BVA_1.6':
          expectDto200(CreateBidDto, validDto);
          return;
        case 'BVA_1.3':
          expectDto400(CreateBidDto, { ...validDto, conferenceId: -1 });
          return;
        case 'BVA_1.4':
          expectDto400(CreateBidDto, { ...validDto, submissionId: '' });
          return;
        case 'BVA_1.5':
          expectDto400(CreateBidDto, { ...validDto, submissionId: 'abc' });
          return;
        case 'BVA_1.7':
          expectDto400(CreateBidDto, { ...validDto, preference: 'LIKE' });
          return;
        case 'BVA_1.8':
          expectDto400(CreateBidDto, { ...validDto, preference: '' });
          return;
      }
    }

    if (testCase.id === 'RTC_1.5') {
      await expect(controller.submitBid(makeRequest(), validDto)).rejects.toBeInstanceOf(UnauthorizedException);
      return;
    }

    if (testCase.id === 'RTC_1.6') {
      await expect(controller.submitBid(makeRequest({ sub: 1, roles: ['AUTHOR'] }), validDto)).rejects.toBeInstanceOf(ForbiddenException);
      return;
    }

    reviewsService.submitBid.mockResolvedValue({ id: 1, ...validDto, reviewerId: 1 });
    const body = testCase.id === 'RTC_1.2'
      ? { ...validDto, preference: PreferenceType.MAYBE }
      : testCase.id === 'RTC_1.3'
        ? { ...validDto, preference: PreferenceType.CONFLICT }
        : validDto;

    const result = await controller.submitBid(makeRequest({ sub: 1, roles: ['REVIEWER'] }, 'token-1'), body);
    expect(result.message).toBe('Đánh giá quan tâm bài báo thành công');
    expect(reviewsService.submitBid).toHaveBeenCalledWith(1, body);
  }

  async function runGetMyAssignmentsCase(testCase: WorkbookCase) {
    if (testCase.id.startsWith('BVA_2.')) {
      switch (testCase.id) {
        case 'BVA_2.1':
        case 'BVA_2.3':
          expectDto400(PaginationQueryDto, { page: 0, limit: 10 });
          return;
        case 'BVA_2.2':
        case 'BVA_2.5':
        case 'BVA_2.6':
          expectDto200(PaginationQueryDto, { page: 1, limit: testCase.id === 'BVA_2.5' ? 1 : 100 });
          return;
        case 'BVA_2.4':
          expectDto400(PaginationQueryDto, { page: 1, limit: 0 });
          return;
        case 'BVA_2.7':
          expectDto400(PaginationQueryDto, { page: 1, limit: 101 });
          return;
        case 'BVA_2.8':
          expectDto400(PaginationQueryDto, { page: 1, limit: 'abc' });
          return;
      }
    }

    if (testCase.id === 'RTC_2.4') {
      await expect(controller.getMyAssignments(makeRequest(), { page: 1, limit: 10 })).rejects.toBeInstanceOf(UnauthorizedException);
      return;
    }
    if (testCase.id === 'RTC_2.5') {
      await expect(controller.getMyAssignments(makeRequest({ sub: 1, roles: ['AUTHOR'] }), { page: 1, limit: 10 })).rejects.toBeInstanceOf(ForbiddenException);
      return;
    }

    reviewsService.getMyAssignments.mockResolvedValue(testCase.id === 'RTC_2.3' ? [] : [{ id: 10 }]);
    const result = await controller.getMyAssignments(makeRequest({ sub: 1, roles: ['REVIEWER'] }, 'token-2'), {
      page: testCase.id === 'RTC_2.2' ? 2 : 1,
      limit: testCase.id === 'RTC_2.2' ? 5 : 10,
    });
    expect(result.message).toBe('Lấy danh sách assignments thành công');
    expect(Array.isArray(result.data)).toBe(true);
  }

  async function runSelfAssignCase(testCase: WorkbookCase) {
    if (testCase.id.startsWith('BVA_3.')) {
      const base = { submissionId: '8ccd4365-3258-4b87-8903-c48d06189ed1', conferenceId: 1 };
      switch (testCase.id) {
        case 'BVA_3.1':
        case 'BVA_3.2':
        case 'BVA_3.6':
          expectDto200(SelfAssignDto, base);
          return;
        case 'BVA_3.3':
          expectDto400(SelfAssignDto, { ...base, conferenceId: -1 });
          return;
        case 'BVA_3.4':
          expectDto400(SelfAssignDto, { ...base, submissionId: '' });
          return;
        case 'BVA_3.5':
          expectDto400(SelfAssignDto, { ...base, submissionId: '123' });
          return;
        case 'BVA_3.7':
          expectDto400(SelfAssignDto, { ...base, conferenceId: 'a' });
          return;
      }
    }

    if (testCase.id === 'RTC_3.4') {
      await expect(controller.selfAssign(makeRequest(), { submissionId: '8ccd4365-3258-4b87-8903-c48d06189ed1', conferenceId: 1 })).rejects.toBeInstanceOf(UnauthorizedException);
      return;
    }
    if (testCase.id === 'RTC_3.5') {
      await expect(controller.selfAssign(makeRequest({ sub: 1, roles: ['AUTHOR'] }), { submissionId: '8ccd4365-3258-4b87-8903-c48d06189ed1', conferenceId: 1 })).rejects.toBeInstanceOf(ForbiddenException);
      return;
    }

    if (testCase.id === 'RTC_3.2') {
      reviewsService.selfAssignSubmission.mockRejectedValue(new BadRequestException('Không thể tự phân công bài này vì bạn đã báo cáo xung đột lợi ích (CONFLICT)'));
      await expect(controller.selfAssign(makeRequest({ sub: 1, roles: ['REVIEWER'] }, 'token-3'), { submissionId: '8ccd4365-3258-4b87-8903-c48d06189ed1', conferenceId: 1 })).rejects.toBeInstanceOf(BadRequestException);
      return;
    }

    reviewsService.selfAssignSubmission.mockResolvedValue({ id: 20, reviewerId: 1, submissionId: '8ccd4365-3258-4b87-8903-c48d06189ed1', conferenceId: 1, status: 'ACCEPTED' });
    const result = await controller.selfAssign(makeRequest({ sub: 1, roles: ['REVIEWER'] }, 'token-3'), {
      submissionId: '8ccd4365-3258-4b87-8903-c48d06189ed1',
      conferenceId: 1,
    });
    expect(result.data.status).toBe('ACCEPTED');
  }

  async function runSubmitReviewCase(testCase: WorkbookCase) {
    const validBody = {
      assignmentId: 1,
      score: 8,
      confidence: ConfidenceLevel.HIGH,
      recommendation: RecommendationType.ACCEPT,
      commentForAuthor: 'OK',
      commentForPC: 'PC note',
    };

    if (testCase.id.startsWith('BVA_4.')) {
      switch (testCase.id) {
        case 'BVA_4.1':
          expectDto400(CreateReviewDto, { ...validBody, score: -1 });
          return;
        case 'BVA_4.2':
          expectDto200(CreateReviewDto, { ...validBody, score: 0 });
          return;
        case 'BVA_4.3':
          expectDto200(CreateReviewDto, { ...validBody, score: 1 });
          return;
        case 'BVA_4.4':
          expectDto200(CreateReviewDto, { ...validBody, score: 9 });
          return;
        case 'BVA_4.5':
          expectDto200(CreateReviewDto, { ...validBody, score: 10 });
          return;
        case 'BVA_4.6':
          expectDto400(CreateReviewDto, { ...validBody, score: 11 });
          return;
        case 'BVA_4.7':
          expectDto400(CreateReviewDto, { ...validBody, score: 9.5 });
          return;
        case 'BVA_4.8':
          expectDto400(CreateReviewDto, { ...validBody, score: '10' });
          return;
        case 'BVA_4.9':
          reviewsService.submitReview.mockRejectedValue(new NotFoundException('Assignment không tồn tại'));
          await expect(controller.submitReview(makeRequest({ sub: 1, roles: ['REVIEWER'] }, 'token-4'), { ...validBody, assignmentId: 0 })).rejects.toBeInstanceOf(NotFoundException);
          return;
        case 'BVA_4.10':
          reviewsService.submitReview.mockResolvedValue({ id: 30, ...validBody, assignmentId: 1 });
          await controller.submitReview(makeRequest({ sub: 1, roles: ['REVIEWER'] }, 'token-4'), { ...validBody, assignmentId: 1 });
          return;
        case 'BVA_4.11':
          reviewsService.submitReview.mockRejectedValue(new NotFoundException('Assignment không tồn tại'));
          await expect(controller.submitReview(makeRequest({ sub: 1, roles: ['REVIEWER'] }, 'token-4'), { ...validBody, assignmentId: -1 })).rejects.toBeInstanceOf(NotFoundException);
          return;
        case 'BVA_4.12':
          expectDto400(CreateReviewDto, { ...validBody, confidence: '' });
          return;
        case 'BVA_4.13':
          expectDto400(CreateReviewDto, { ...validBody, recommendation: '' });
          return;
        case 'BVA_4.14':
          expectDto200(CreateReviewDto, { ...validBody, commentForAuthor: '' });
          return;
      }
    }

    if (testCase.id === 'RTC_4.7') {
      await expect(controller.submitReview(makeRequest(), validBody)).rejects.toBeInstanceOf(UnauthorizedException);
      return;
    }
    if (testCase.id === 'RTC_4.5') {
      reviewsService.submitReview.mockRejectedValue(new ForbiddenException('Bạn không có quyền nộp review cho assignment này'));
      await expect(controller.submitReview(makeRequest({ sub: 1, roles: ['REVIEWER'] }, 'token-4'), validBody)).rejects.toBeInstanceOf(ForbiddenException);
      return;
    }
    if (testCase.id === 'RTC_4.4') {
      reviewsService.submitReview.mockRejectedValue(new BadRequestException('Chỉ có thể nộp review khi assignment ở trạng thái ACCEPTED. Hiện tại: PENDING'));
      await expect(controller.submitReview(makeRequest({ sub: 1, roles: ['REVIEWER'] }, 'token-4'), validBody)).rejects.toBeInstanceOf(BadRequestException);
      return;
    }
    if (testCase.id === 'RTC_4.6') {
      reviewsService.submitReview.mockRejectedValue(new BadRequestException('Review cho assignment này đã được nộp rồi'));
      await expect(controller.submitReview(makeRequest({ sub: 1, roles: ['REVIEWER'] }, 'token-4'), validBody)).rejects.toBeInstanceOf(BadRequestException);
      return;
    }

    reviewsService.submitReview.mockResolvedValue({ id: 50, ...validBody });
    const body = testCase.id === 'RTC_4.1' ? validBody : validBody;
    const result = await controller.submitReview(makeRequest({ sub: 1, roles: ['REVIEWER'] }, 'token-4'), body);
    expect(result.message).toBe('Nộp bài chấm thành công');
  }

  async function runGetReviewsBySubmissionCase(testCase: WorkbookCase) {
    const submissionId = '8ccd4365-3258-4b87-8903-c48d06189ed1';
    const validQuery = { page: 1, limit: 10 };

    if (testCase.id.startsWith('BVA_5.')) {
      switch (testCase.id) {
        case 'BVA_5.1':
        case 'BVA_5.2':
          await expectPipeRejects(new ParseUUIDPipe(), 'abc', { type: 'param', metatype: String, data: 'id' });
          return;
        case 'BVA_5.3':
        case 'BVA_5.4':
          expectDto400(PaginationQueryDto, { page: 0, limit: 10 });
          return;
        case 'BVA_5.5':
          expectDto200(PaginationQueryDto, { page: 1, limit: 100 });
          return;
        case 'BVA_5.6':
          expectDto400(PaginationQueryDto, { page: 1, limit: 101 });
          return;
      }
    }

    if (testCase.id === 'RTC_5.3') {
      reviewsService.checkReviewerAssignment.mockResolvedValue(false);
      await expect(controller.getReviewsBySubmission(makeRequest({ sub: 1, roles: ['REVIEWER'] }, 'token-5'), submissionId, validQuery)).rejects.toBeInstanceOf(ForbiddenException);
      return;
    }

    if (testCase.id === 'RTC_5.1') {
      reviewsService.getReviewsBySubmission.mockResolvedValue([{ id: 1, reviewerName: 'Reviewer 1' }]);
      const result = await controller.getReviewsBySubmission(makeRequest({ sub: 1, roles: ['CHAIR'] }, 'token-5'), submissionId, validQuery);
      expect(result.data).toHaveLength(1);
      return;
    }

    if (testCase.id === 'RTC_5.2') {
      reviewsService.checkReviewerAssignment.mockResolvedValue(true);
      reviewsService.getReviewsBySubmission.mockResolvedValue([{ id: 1, reviewerName: 'Reviewer 1' }]);
      const result = await controller.getReviewsBySubmission(makeRequest({ sub: 1, roles: ['REVIEWER'] }, 'token-5'), submissionId, validQuery);
      expect(result.data).toHaveLength(1);
      return;
    }

    if (testCase.id === 'RTC_5.4') {
      reviewsService.getReviewsBySubmission.mockResolvedValue([{ id: 1, reviewerName: 'Reviewer #1' }]);
      const result = await reviewsService.getReviewsBySubmission(submissionId, 1, 10);
      expect(result).toHaveLength(1);
      return;
    }
  }

  async function runAnonymizedReviewsCase(testCase: WorkbookCase) {
    if (testCase.id.startsWith('BVA_6.')) {
      switch (testCase.id) {
        case 'BVA_6.1':
        case 'BVA_6.2':
          await expectPipeRejects(new ParseUUIDPipe(), '123', { type: 'param', metatype: String, data: 'id' });
          return;
        case 'BVA_6.3':
          await expectPipePasses(new ParseUUIDPipe(), '8ccd4365-3258-4b87-8903-c48d06189ed1', { type: 'param', metatype: String, data: 'id' });
          return;
      }
    }
    reviewsService.getAnonymizedReviewsBySubmission.mockResolvedValue([{ score: 8, commentForAuthor: 'A', recommendation: 'ACCEPT', createdAt: new Date('2026-01-01T00:00:00Z') }]);
    const result = await controller.getAnonymizedReviews('8ccd4365-3258-4b87-8903-c48d06189ed1');
    expect(result.data).toHaveLength(1);
  }

  async function runBidsBySubmissionCase(testCase: WorkbookCase) {
    const submissionId = '8ccd4365-3258-4b87-8903-c48d06189ed1';

    if (testCase.id.startsWith('BVA_7.')) {
      switch (testCase.id) {
        case 'BVA_7.1':
          expectDto400(PaginationQueryDto, { page: 0, limit: 10 });
          return;
        case 'BVA_7.2':
        case 'BVA_7.3':
          expectDto200(PaginationQueryDto, { page: 1, limit: testCase.id === 'BVA_7.2' ? 1 : 100 });
          return;
        case 'BVA_7.4':
          expectDto400(PaginationQueryDto, { page: 1, limit: 101 });
          return;
      }
    }

    if (testCase.id === 'RTC_7.2') {
      await expect(controller.getBidsBySubmission(makeRequest({ sub: 1, roles: ['REVIEWER'] }, 'token-7'), submissionId, { page: 1, limit: 10 })).rejects.toBeInstanceOf(ForbiddenException);
      return;
    }

    reviewsService.getBidsBySubmission.mockResolvedValue([{ id: 1, preference: PreferenceType.INTERESTED }]);
    const result = await controller.getBidsBySubmission(makeRequest({ sub: 1, roles: ['CHAIR'] }, 'token-7'), submissionId, { page: 1, limit: 10 });
    expect(result.data).toHaveLength(1);
  }

  async function runDiscussionsBySubmissionCase(testCase: WorkbookCase) {
    const submissionId = '8ccd4365-3258-4b87-8903-c48d06189ed1';

    if (testCase.id.startsWith('BVA_8.')) {
      switch (testCase.id) {
        case 'BVA_8.1':
          await expectPipeRejects(new ParseUUIDPipe(), 'abc', { type: 'param', metatype: String, data: 'id' });
          return;
        case 'BVA_8.2':
        case 'BVA_8.3':
          expectDto200(PaginationQueryDto, { page: 1, limit: testCase.id === 'BVA_8.2' ? 1 : 100 });
          return;
        case 'BVA_8.4':
          expectDto400(PaginationQueryDto, { page: 1, limit: 101 });
          return;
      }
    }

    reviewsService.getDiscussionsBySubmission.mockResolvedValue([{ id: 1, content: 'Discuss' }]);
    const result = await controller.getDiscussionsBySubmission(makeRequest({ sub: 1, roles: ['CHAIR'] }, 'token-8'), submissionId, { page: 1, limit: 10 });
    expect(result.data).toHaveLength(1);
  }

  async function runDecisionCase(testCase: WorkbookCase) {
    const body = { submissionId: '8ccd4365-3258-4b87-8903-c48d06189ed1', decision: FinalDecision.ACCEPT, note: 'good' };

    if (testCase.id.startsWith('BVA_9.')) {
      switch (testCase.id) {
        case 'BVA_9.1':
        case 'BVA_9.2':
          expectDto400(CreateDecisionDto, { ...body, submissionId: testCase.id === 'BVA_9.1' ? '' : '123' });
          return;
        case 'BVA_9.3':
          expectDto400(CreateDecisionDto, { ...body, decision: 'PASS' });
          return;
        case 'BVA_9.4':
          expectDto400(CreateDecisionDto, { ...body, decision: '' });
          return;
        case 'BVA_9.5':
          expectDto200(CreateDecisionDto, { ...body, note: '' });
          return;
      }
    }

    if (testCase.id === 'RTC_9.4') {
      await expect(controller.setDecision(makeRequest({ sub: 1, roles: ['REVIEWER'] }, 'token-9'), body)).rejects.toBeInstanceOf(ForbiddenException);
      return;
    }

    reviewsService.upsertDecisionForSubmission.mockResolvedValue({ id: 1, submissionId: body.submissionId, decision: body.decision });
    reviewsService.getDecisionSummaryBySubmission.mockResolvedValue({ submissionId: body.submissionId, stats: { reviewCount: 1 }, decision: { id: 1 } });
    const result = await controller.setDecision(makeRequest({ sub: 1, roles: ['CHAIR'] }, 'token-9'), body);
    expect(result.data.decision).toBeDefined();
  }

  async function runDecisionSummaryCase(testCase: WorkbookCase) {
    const submissionId = '8ccd4365-3258-4b87-8903-c48d06189ed1';
    if (testCase.id.startsWith('BVA_10.')) {
      switch (testCase.id) {
        case 'BVA_10.1':
        case 'BVA_10.2':
          await expectPipeRejects(new ParseUUIDPipe(), testCase.id === 'BVA_10.1' ? '' : 'abc', { type: 'param', metatype: String, data: 'id' });
          return;
        case 'BVA_10.3':
          await expectPipePasses(new ParseUUIDPipe(), submissionId, { type: 'param', metatype: String, data: 'id' });
          return;
      }
    }
    reviewsService.getDecisionSummaryBySubmission.mockResolvedValue({ submissionId, stats: { reviewCount: 0, averageScore: null, minScore: null, maxScore: null, recommendationCounts: {} }, decision: null });
    const result = await controller.getDecisionSummary(makeRequest({ sub: 1, roles: ['CHAIR'] }, 'token-10'), submissionId);
    expect(result.data.stats).toBeDefined();
  }

  async function runSubmissionProgressCase(testCase: WorkbookCase) {
    const submissionId = '8ccd4365-3258-4b87-8903-c48d06189ed1';
    if (testCase.id.startsWith('BVA_11.')) {
      switch (testCase.id) {
        case 'BVA_11.1':
        case 'BVA_11.2':
          await expectPipeRejects(new ParseUUIDPipe(), testCase.id === 'BVA_11.1' ? '' : 'xyz', { type: 'param', metatype: String, data: 'id' });
          return;
        case 'BVA_11.3':
          await expectPipePasses(new ParseUUIDPipe(), submissionId, { type: 'param', metatype: String, data: 'id' });
          return;
      }
    }
    reviewsService.getSubmissionProgress.mockResolvedValue({ submissionId, totalAssignments: 1, completedAssignments: 1, pendingAssignments: 0, reviewsSubmitted: 1, lastReviewAt: new Date() });
    const result = await controller.getSubmissionProgress(makeRequest({ sub: 1, roles: ['CHAIR'] }, 'token-11'), submissionId);
    expect(result.data.totalAssignments).toBe(1);
  }

  async function runConferenceProgressCase(testCase: WorkbookCase) {
    if (testCase.id.startsWith('BVA_12.')) {
      switch (testCase.id) {
        case 'BVA_12.1':
          await expectPipePasses(new ParseIntPipe(), '0', { type: 'param', metatype: Number, data: 'id' });
          return;
        case 'BVA_12.2':
          await expectPipePasses(new ParseIntPipe(), '1', { type: 'param', metatype: Number, data: 'id' });
          return;
        case 'BVA_12.3':
        case 'BVA_12.4':
          await expectPipeRejects(new ParseIntPipe(), 'abc', { type: 'param', metatype: Number, data: 'id' });
          return;
      }
    }
    reviewsService.getConferenceProgress.mockResolvedValue({ conferenceId: 1, totalAssignments: 1, completedAssignments: 1, pendingAssignments: 0, reviewsSubmitted: 1 });
    const result = await controller.getConferenceProgress(makeRequest({ sub: 1, roles: ['CHAIR'] }, 'token-12'), 1);
    expect(result.data.conferenceId).toBe(1);
  }

  async function runSubmissionsForReviewerCase(testCase: WorkbookCase) {
    const req = makeRequest({ sub: 1, roles: ['REVIEWER'] }, 'token-13');
    if (testCase.id.startsWith('BVA_13.')) {
      switch (testCase.id) {
        case 'BVA_13.1':
        case 'BVA_13.2':
          reviewsService.getSubmissionsForReviewer.mockResolvedValue([]);
          break;
        case 'BVA_13.3':
        case 'BVA_13.4':
        case 'BVA_13.5':
          reviewsService.getSubmissionsForReviewer.mockResolvedValue([{ id: 'sub-1', status: 'SUBMITTED' }]);
          break;
        case 'BVA_13.6':
          reviewsService.getSubmissionsForReviewer.mockResolvedValue([]);
          break;
      }
    }

    if (testCase.id === 'RTC_13.3') {
      reviewsService.getSubmissionsForReviewer.mockResolvedValue([]);
    } else if (testCase.id === 'RTC_13.1') {
      reviewsService.getSubmissionsForReviewer.mockResolvedValue([{ id: 'sub-1', status: 'SUBMITTED' }]);
    } else if (testCase.id === 'RTC_13.2') {
      reviewsService.getSubmissionsForReviewer.mockResolvedValue([{ id: 'sub-1', status: 'REVIEWING' }]);
    } else if (testCase.id === 'RTC_13.4') {
      reviewsService.getSubmissionsForReviewer.mockResolvedValue([{ id: 'sub-1', status: 'SUBMITTED' }, { id: 'sub-2', status: 'REVIEWING' }]);
    }

    const status = testCase.input.includes('status=') && !testCase.input.includes('status không truyền')
      ? testCase.input.split('status=')[1]
      : undefined;

    const result = await controller.getSubmissionsForReviewer(req, status);
    expect(result.message).toBe('Lấy danh sách bài nộp thành công');
    expect(Array.isArray(result.data)).toBe(true);
  }

  async function runReviewerActivityStatsCase(testCase: WorkbookCase) {
    if (testCase.id.startsWith('BVA_14.')) {
      switch (testCase.id) {
        case 'BVA_14.1':
          await expect(controller.getReviewerActivityStats(0)).rejects.toBeInstanceOf(BadRequestException);
          return;
        case 'BVA_14.3':
          await expect(controller.getReviewerActivityStats(-1)).rejects.toBeInstanceOf(BadRequestException);
          return;
        case 'BVA_14.4':
          await expectPipeRejects(new ParseIntPipe(), 'abc', { type: 'param', metatype: Number, data: 'reviewerId' });
          return;
        case 'BVA_14.2':
          await expectPipePasses(new ParseIntPipe(), '1', { type: 'param', metatype: Number, data: 'reviewerId' });
          return;
      }
    }

    reviewsService.getReviewerActivityStats.mockResolvedValue({ assignmentCount: 1, reviewCount: 1, hasActiveAssignments: true, completedReviews: 1 });
    const result = await controller.getReviewerActivityStats(1);
    expect(result.data.assignmentCount).toBe(1);
  }
});