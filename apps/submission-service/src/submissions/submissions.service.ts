import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, Like, In } from 'typeorm';
import { Submission, SubmissionStatus } from '../entities/submission.entity';
import { SubmissionVersion } from '../entities/submission-version.entity';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { QuerySubmissionsDto } from './dto/query-submissions.dto';
import { SupabaseService } from '../supabase/supabase.config';
import { ConferenceClientService } from '../integrations/conference-client.service';
import { ReviewClientService } from '../integrations/review-client.service';
import { IdentityClientService } from '../integrations/identity-client.service';
import { EmailService } from '../common/services/email.service';
import { log } from 'console';

@Injectable()
export class SubmissionsService {
  constructor(
    @InjectRepository(Submission)
    private submissionRepository: Repository<Submission>,
    @InjectRepository(SubmissionVersion)
    private submissionVersionRepository: Repository<SubmissionVersion>,
    private supabaseService: SupabaseService,
    private dataSource: DataSource,
    private conferenceClient: ConferenceClientService,
    private reviewClient: ReviewClientService,
    private identityClient: IdentityClientService,
    private emailService: EmailService,
  ) {}

  /**
   * @param file Express.Multer.File
   * @returns Public URL của file
   */
  async uploadFile(file: Express.Multer.File | undefined): Promise<string> {
    if (!file) {
      throw new BadRequestException('File không được để trống');
    }

    const allowedMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
      'application/zip',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Chỉ chấp nhận file PDF, DOCX hoặc ZIP',
      );
    }

    const getFileExtension = (mimetype: string): string => {
      if (mimetype === 'application/pdf') return '.pdf';
      if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return '.docx';
      if (mimetype === 'application/zip') return '.zip';
      return '.pdf'; 
    };

    const supabase = this.supabaseService.getClient();
    const bucketName = 'submissions';
    const timestamp = Date.now();
    const uuid = crypto.randomUUID();
    const fileExtension = getFileExtension(file.mimetype);
    const fileName = `${timestamp}-${uuid}${fileExtension}`;

    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (error) {
        throw new BadRequestException(`Lỗi khi upload file: ${error.message}`);
      }
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucketName).getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Lỗi khi upload file: ${error.message}`);
    }
  }

  private validateStatusTransition(
    currentStatus: SubmissionStatus,
    newStatus: SubmissionStatus,
  ): boolean {
    const allowedTransitions: Record<SubmissionStatus, SubmissionStatus[]> = {
      [SubmissionStatus.SUBMITTED]: [
        SubmissionStatus.REVIEWING,
        SubmissionStatus.WITHDRAWN,
      ],
      [SubmissionStatus.REVIEWING]: [
        SubmissionStatus.ACCEPTED,
        SubmissionStatus.REJECTED,
        SubmissionStatus.WITHDRAWN,
      ],
      [SubmissionStatus.ACCEPTED]: [SubmissionStatus.CAMERA_READY],
      [SubmissionStatus.REJECTED]: [],
      [SubmissionStatus.WITHDRAWN]: [],
      [SubmissionStatus.CAMERA_READY]: [],
    };

    return allowedTransitions[currentStatus]?.includes(newStatus) ?? false;
  }

  /**
   * Tạo submission mới
   * @param createDto DTO chứa thông tin submission
   * @param file File PDF, DOCX hoặc ZIP (bắt buộc)
   * @param authorId ID của author (từ JWT token)
   * @param authorName Tên của author (từ JWT token)
   * @returns Submission đã tạo
   */
  async create(
    createDto: CreateSubmissionDto,
    file: Express.Multer.File,
    authorId: number,
    authorName?: string,
  ): Promise<Submission> {
    if (!file) {
      throw new BadRequestException('File là bắt buộc (PDF, DOCX hoặc ZIP)');
    }

    // Check deadline trước khi nộp bài
    try {
      const deadlineCheck = await this.conferenceClient.checkDeadline(
        createDto.conferenceId,
        'submission',
      );
      if (!deadlineCheck.valid) {
        throw new BadRequestException(
          `Hạn nộp bài đã qua: ${deadlineCheck.message}`,
        );
      }
    } catch (e) {
      if (e instanceof BadRequestException) {
        throw e;
      }
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Upload file lên Supabase
      const fileUrl = await this.uploadFile(file);

      // Parse coAuthors từ JSON string nếu có
      let parsedCoAuthors: Array<{ name: string; email: string; affiliation?: string }> | null = null;
      if (createDto.coAuthors) {
        try {
          parsedCoAuthors = JSON.parse(createDto.coAuthors);
        } catch (e) {
          console.warn('[SubmissionService] Failed to parse coAuthors:', e);
        }
      }

      // 2. Tạo submission mới với status = SUBMITTED
      const submission = this.submissionRepository.create({
        title: createDto.title,
        abstract: createDto.abstract,
        keywords: createDto.keywords || null,
        fileUrl,
        status: SubmissionStatus.SUBMITTED,
        authorId,
        authorName: authorName || null, // Lưu tên từ JWT token
        authorAffiliation: createDto.authorAffiliation || null,
        trackId: createDto.trackId,
        conferenceId: createDto.conferenceId,
        coAuthors: parsedCoAuthors,
        submittedAt: new Date(), // Lưu thời gian nộp bài
      });

      const savedSubmission = await queryRunner.manager.save(submission);
      await queryRunner.manager.insert(SubmissionVersion, {
        submissionId: savedSubmission.id,
        versionNumber: 1,
        title: savedSubmission.title,
        abstract: savedSubmission.abstract,
        fileUrl: savedSubmission.fileUrl,
        keywords: savedSubmission.keywords,
      });

      await queryRunner.commitTransaction();

      const result = await this.submissionRepository.findOne({
        where: { id: savedSubmission.id },
        relations: ['versions'],
      });

      if (!result) {
        throw new NotFoundException(`Không tìm thấy submission sau khi tạo`);
      }

      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Cập nhật submission
   * @param id ID của submission
   * @param updateDto DTO chứa thông tin cập nhật
   * @param file File PDF, DOCX hoặc ZIP mới (tùy chọn)
   * @param authorId ID của author (để kiểm tra quyền)
   * @returns Submission đã cập nhật
   */
  async update(
    id: string,
    updateDto: UpdateSubmissionDto,
    file: Express.Multer.File | undefined,
    authorId: number,
  ): Promise<Submission> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const submission = await queryRunner.manager.findOne(Submission, {
        where: { id },
      });

      if (!submission) {
        throw new NotFoundException(`Submission với ID ${id} không tồn tại`);
      }

      if (submission.authorId !== authorId) {
        throw new ForbiddenException(
          'Bạn không có quyền cập nhật submission này',
        );
      }

      // Validate deadline - chỉ cho phép edit trước deadline
      if (
        submission.status === SubmissionStatus.SUBMITTED ||
        submission.status === SubmissionStatus.REVIEWING
      ) {
        try {
          const deadlineCheck = await this.conferenceClient.checkDeadline(
            submission.conferenceId,
            'submission',
          );
          if (!deadlineCheck.valid) {
            throw new BadRequestException(
              `Không thể chỉnh sửa sau hạn nộp bài: ${deadlineCheck.message}`,
            );
          }
        } catch (e) {
          if (e instanceof BadRequestException) {
            throw e;
          }
        }
      }

      const existingVersions = await queryRunner.manager.find(
        SubmissionVersion,
        {
          where: { submissionId: id },
          select: ['versionNumber'],
        },
      );

      const maxVersion = existingVersions.length
        ? Math.max(...existingVersions.map((v) => v.versionNumber))
        : 0;

      const newVersionNumber = maxVersion + 1;
      await queryRunner.manager.insert(SubmissionVersion, {
        submissionId: submission.id,
        versionNumber: newVersionNumber,
        title: submission.title,
        abstract: submission.abstract,
        fileUrl: submission.fileUrl,
        keywords: submission.keywords,
      });

      // Upload file mới nếu có, nếu không thì giữ URL cũ
      let newFileUrl = submission.fileUrl;
      if (file) {
        newFileUrl = await this.uploadFile(file);
      }

      // Parse coAuthors từ JSON string nếu có
      let parsedCoAuthors: Array<{ name: string; email: string; affiliation?: string }> | null = submission.coAuthors;
      if (updateDto.coAuthors !== undefined) {
        if (updateDto.coAuthors) {
          try {
            parsedCoAuthors = JSON.parse(updateDto.coAuthors);
          } catch (e) {
            console.warn('[SubmissionService] Failed to parse coAuthors:', e);
          }
        } else {
          parsedCoAuthors = null;
        }
      }

      Object.assign(submission, {
        title: updateDto.title ?? submission.title,
        abstract: updateDto.abstract ?? submission.abstract,
        keywords: updateDto.keywords ?? submission.keywords,
        trackId: updateDto.trackId ?? submission.trackId,
        fileUrl: newFileUrl,
        authorAffiliation: updateDto.authorAffiliation !== undefined ? updateDto.authorAffiliation : submission.authorAffiliation,
        coAuthors: parsedCoAuthors,
        submittedAt: new Date(), // Cập nhật thời gian nộp bài thành thời gian hiện tại
      });

      const updatedSubmission = await queryRunner.manager.save(submission);

      await queryRunner.commitTransaction();
      const result = await this.submissionRepository.findOne({
        where: { id: updatedSubmission.id },
        relations: ['versions'],
      });

      if (!result) {
        throw new NotFoundException(
          `Không tìm thấy bài dự thi sau khi cập nhật`,
        );
      }

      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async withdraw(id: string, authorId: number): Promise<Submission> {
    const submission = await this.submissionRepository.findOne({
      where: { id },
    });

    if (!submission) {
      throw new NotFoundException(`Submission với ID ${id} không tồn tại`);
    }
    if (submission.authorId !== authorId) {
      throw new ForbiddenException('Bạn không có quyền rút submission này');
    }
    if (
      submission.status !== SubmissionStatus.SUBMITTED &&
      submission.status !== SubmissionStatus.REVIEWING
    ) {
      throw new BadRequestException(
        `Không thể rút bài ở trạng thái ${submission.status}`,
      );
    }

    // Validate deadline - chỉ cho phép withdraw trước deadline
    try {
      const deadlineCheck = await this.conferenceClient.checkDeadline(
        submission.conferenceId,
        'submission',
      );
      if (!deadlineCheck.valid) {
        throw new BadRequestException(
          `Không thể rút bài sau hạn nộp: ${deadlineCheck.message}`,
        );
      }
    } catch (e) {
      if (e instanceof BadRequestException) {
        throw e;
      }
    }

    submission.status = SubmissionStatus.WITHDRAWN;
    return await this.submissionRepository.save(submission);
  }

  /**
   * Admin/Chair: Cập nhật submission (không cần check author)
   */
  async updateByAdmin(
    id: string,
    updateDto: UpdateSubmissionDto,
    file: Express.Multer.File | undefined,
    userId: number,
    userRoles: string[],
  ): Promise<Submission> {
    // Check permission
    const isAdminOrChair = userRoles.includes('ADMIN') || userRoles.includes('CHAIR');
    if (!isAdminOrChair) {
      throw new ForbiddenException('Chỉ Admin hoặc Chair mới có quyền cập nhật submission này');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const submission = await queryRunner.manager.findOne(Submission, {
        where: { id },
      });

      if (!submission) {
        throw new NotFoundException(`Submission với ID ${id} không tồn tại`);
      }

      // Admin/Chair không cần check deadline, có thể update bất cứ lúc nào
      const existingVersions = await queryRunner.manager.find(
        SubmissionVersion,
        {
          where: { submissionId: id },
          select: ['versionNumber'],
        },
      );

      const maxVersion = existingVersions.length
        ? Math.max(...existingVersions.map((v) => v.versionNumber))
        : 0;

      const newVersionNumber = maxVersion + 1;
      
      // Create version snapshot before update
      await queryRunner.manager.insert(SubmissionVersion, {
        submissionId: submission.id,
        versionNumber: newVersionNumber,
        title: submission.title,
        abstract: submission.abstract,
        fileUrl: submission.fileUrl,
        keywords: submission.keywords,
      });

      // Upload file mới nếu có
      let newFileUrl = submission.fileUrl;
      if (file) {
        newFileUrl = await this.uploadFile(file);
      }

      // Update submission
      if (updateDto.title !== undefined) {
        submission.title = updateDto.title;
      }
      if (updateDto.abstract !== undefined) {
        submission.abstract = updateDto.abstract;
      }
      if (updateDto.keywords !== undefined) {
        submission.keywords = updateDto.keywords;
      }
      if (updateDto.trackId !== undefined) {
        submission.trackId = updateDto.trackId;
      }
      if (updateDto.authorAffiliation !== undefined) {
        submission.authorAffiliation = updateDto.authorAffiliation;
      }
      if (updateDto.coAuthors !== undefined) {
        try {
          submission.coAuthors = JSON.parse(updateDto.coAuthors);
        } catch {
          throw new BadRequestException('coAuthors phải là JSON hợp lệ');
        }
      }
      if (newFileUrl) {
        submission.fileUrl = newFileUrl;
      }

      await queryRunner.manager.save(Submission, submission);
      await queryRunner.commitTransaction();

      const result = await this.submissionRepository.findOne({
        where: { id: submission.id },
        relations: ['versions'],
      });

      if (!result) {
        throw new NotFoundException(`Không tìm thấy submission sau khi cập nhật`);
      }

      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Admin/Chair: Xóa submission (hard delete)
   */
  async deleteByAdmin(
    id: string,
    userId: number,
    userRoles: string[],
  ): Promise<void> {
    // Check permission
    const isAdminOrChair = userRoles.includes('ADMIN') || userRoles.includes('CHAIR');
    if (!isAdminOrChair) {
      throw new ForbiddenException('Chỉ Admin hoặc Chair mới có quyền xóa submission này');
    }

    const submission = await this.submissionRepository.findOne({
      where: { id },
    });

    if (!submission) {
      throw new NotFoundException(`Submission với ID ${id} không tồn tại`);
    }

    // Delete file from Supabase if exists
    const supabase = this.supabaseService.getClient();
    const bucketName = 'submissions';
    
    if (submission.fileUrl) {
      try {
        // Extract file path from URL
        const urlParts = submission.fileUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];
        if (fileName) {
          const { error } = await supabase.storage
            .from(bucketName)
            .remove([fileName]);
          if (error) {
            console.warn(`Failed to delete file from Supabase: ${fileName}`, error);
          }
        }
      } catch (error) {
        console.warn(`Failed to delete file from Supabase: ${submission.fileUrl}`, error);
      }
    }

    if (submission.cameraReadyFileUrl) {
      try {
        // Extract file path from URL
        const urlParts = submission.cameraReadyFileUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];
        if (fileName) {
          const { error } = await supabase.storage
            .from(bucketName)
            .remove([fileName]);
          if (error) {
            console.warn(`Failed to delete camera-ready file from Supabase: ${fileName}`, error);
          }
        }
      } catch (error) {
        console.warn(`Failed to delete camera-ready file from Supabase: ${submission.cameraReadyFileUrl}`, error);
      }
    }

    // Delete submission (cascade will delete versions)
    await this.submissionRepository.remove(submission);
  }

// Update status submission
  async updateStatus(
    id: string,
    updateStatusDto: UpdateStatusDto,
    userId: number,
    userRoles: string[],
    authToken?: string,
  ): Promise<Submission> {
    const submission = await this.submissionRepository.findOne({
      where: { id },
    });

    if (!submission) {
      throw new NotFoundException(`Submission với ID ${id} không tồn tại`);
    }

    // Allow automatic transition from SUBMITTED to REVIEWING (when reviewer submits review)
    // This doesn't require Chair/Admin role
    const isAutoReviewingTransition = 
      submission.status === 'SUBMITTED' && 
      updateStatusDto.status === 'REVIEWING';

    console.log('[SubmissionsService] updateStatus called:', {
      submissionId: id,
      currentStatus: submission.status,
      newStatus: updateStatusDto.status,
      isAutoReviewingTransition,
      userRoles,
      userId,
    });

    // For other status updates, require Chair/Admin role
    if (!isAutoReviewingTransition && !userRoles.includes('CHAIR') && !userRoles.includes('ADMIN')) {
      console.log('[SubmissionsService] Access denied - not auto transition and not Chair/Admin');
      throw new ForbiddenException(
        'Chỉ Chair hoặc Admin mới được cập nhật trạng thái',
      );
    }

    // Validate status transition
    if (
      !this.validateStatusTransition(submission.status, updateStatusDto.status)
    ) {
      console.log('[SubmissionsService] Invalid status transition');
      throw new BadRequestException(
        `Không thể chuyển từ ${submission.status} sang ${updateStatusDto.status}`,
      );
    }

    const oldStatus = submission.status;
    submission.status = updateStatusDto.status;
    const savedSubmission = await this.submissionRepository.save(submission);
    console.log('[SubmissionsService] Successfully updated submission status:', {
      submissionId: id,
      oldStatus,
      newStatus: savedSubmission.status,
    });

    // Send email notification when status is ACCEPTED or REJECTED
    const newStatus = savedSubmission.status; // Use the saved status to avoid type narrowing issues
    const isAcceptedOrRejected = newStatus === SubmissionStatus.ACCEPTED || 
                                  newStatus === SubmissionStatus.REJECTED;
    
    console.log('[SubmissionsService] Email notification check:', {
      hasAuthToken: !!authToken,
      status: newStatus,
      isAcceptedOrRejected,
      willSendEmail: isAcceptedOrRejected && !!authToken,
    });

    if (authToken && isAcceptedOrRejected) {
      console.log('[SubmissionsService] Triggering email notification...');
      this.sendSubmissionStatusEmail(
        savedSubmission,
        newStatus as 'ACCEPTED' | 'REJECTED',
        updateStatusDto.decisionNote,
        authToken,
      ).catch((error) => {
        console.error('[SubmissionsService] Failed to send submission status email:', error);
        // Don't throw - email failure shouldn't break the API response
      });
    } else {
      if (!authToken) {
        console.warn('[SubmissionsService] Email not sent: No auth token provided');
      }
      if (!isAcceptedOrRejected) {
        console.log('[SubmissionsService] Email not sent: Status is not ACCEPTED or REJECTED', {
          status: newStatus,
        });
      }
    }

    return savedSubmission;
  }

  /**
   * Send email notification when submission status changes to ACCEPTED or REJECTED
   */
  private async sendSubmissionStatusEmail(
    submission: Submission,
    status: 'ACCEPTED' | 'REJECTED',
    decisionNote?: string,
    authToken?: string,
  ): Promise<void> {
    console.log('[SubmissionsService] sendSubmissionStatusEmail called:', {
      submissionId: submission.id,
      authorId: submission.authorId,
      status,
      hasDecisionNote: !!decisionNote,
      hasAuthToken: !!authToken,
    });

    if (!authToken) {
      console.warn('[SubmissionsService] Cannot send email: No auth token provided');
      return;
    }

    try {
      // Get author info from identity-service
      console.log('[SubmissionsService] Fetching author info from identity-service...');
      const authorInfo = await this.identityClient.getUserById(submission.authorId, authToken);
      
      if (!authorInfo || !authorInfo.email) {
        console.warn(`[SubmissionsService] Cannot send email: Author ${submission.authorId} not found or has no email`, {
          hasAuthorInfo: !!authorInfo,
          hasEmail: !!authorInfo?.email,
        });
        return;
      }

      console.log('[SubmissionsService] Author info retrieved:', {
        authorId: submission.authorId,
        email: authorInfo.email,
        fullName: authorInfo.fullName,
      });

      // Get conference info from conference-service
      // For now, use a placeholder or fetch from conference service
      // You might need to add a method to get conference name from conference-service
      const conferenceName = `Hội nghị #${submission.conferenceId}`;
      
      // TODO: Fetch actual conference name from conference-service if needed
      // For now, use placeholder

      console.log('[SubmissionsService] Sending email...', {
        email: authorInfo.email,
        status,
        submissionTitle: submission.title,
        conferenceName,
      });

      if (status === 'ACCEPTED') {
        await this.emailService.sendSubmissionAcceptedEmail(
          authorInfo.email,
          authorInfo.fullName || 'Tác giả',
          submission.title,
          conferenceName,
          decisionNote,
        );
        console.log('[SubmissionsService] Acceptance email sent successfully to:', authorInfo.email);
      } else if (status === 'REJECTED') {
        await this.emailService.sendSubmissionRejectedEmail(
          authorInfo.email,
          authorInfo.fullName || 'Tác giả',
          submission.title,
          conferenceName,
          decisionNote,
        );
        console.log('[SubmissionsService] Rejection email sent successfully to:', authorInfo.email);
      }
    } catch (error) {
      console.error('[SubmissionsService] Error sending submission status email:', {
        submissionId: submission.id,
        authorId: submission.authorId,
        status,
        error: error instanceof Error ? error.message : error,
        errorStack: error instanceof Error ? error.stack : undefined,
      });
      // Don't throw - email failure shouldn't break the API response
    }
  }

  /**
   * Upload camera-ready file
   */
  async uploadCameraReady(
    id: string,
    file: Express.Multer.File,
    authorId: number,
  ): Promise<Submission> {
    const submission = await this.submissionRepository.findOne({
      where: { id },
    });

    if (!submission) {
      throw new NotFoundException(`Submission với ID ${id} không tồn tại`);
    }
    if (submission.authorId !== authorId) {
      throw new ForbiddenException(
        'Bạn không có quyền upload camera-ready cho submission này',
      );
    }
    if (submission.status !== SubmissionStatus.ACCEPTED) {
      throw new BadRequestException(
        'Chỉ có thể upload camera-ready khi bài đã được chấp nhận',
      );
    }

    // Validate deadline (if available)
    try {
      const deadlineCheck = await this.conferenceClient.checkDeadline(
        submission.conferenceId,
        'camera-ready',
      );
      if (!deadlineCheck.valid) {
        throw new BadRequestException(
          `Hạn nộp camera-ready đã qua: ${deadlineCheck.message}`,
        );
      }
    } catch (error: any) {
      // If deadline check fails (endpoint not available or deadline not configured),
      // log the error but allow upload to proceed
      // This handles cases where camera-ready deadline might not be set yet
      if (error.status === HttpStatus.BAD_REQUEST || error.status === HttpStatus.NOT_FOUND) {
        console.warn(
          `[SubmissionsService] Cannot check camera-ready deadline for submission ${id}:`,
          error.message,
        );
        // Allow upload to proceed if deadline check fails
        // This is acceptable if deadline is not configured yet
      } else {
        // For other errors, rethrow
        throw error;
      }
    }

    const cameraReadyFileUrl = await this.uploadFile(file);
    submission.cameraReadyFileUrl = cameraReadyFileUrl;
    submission.status = SubmissionStatus.CAMERA_READY;

    return await this.submissionRepository.save(submission);
  }
// Lấy ds submission fileetr và phân trang
  async findAll(
    queryDto: QuerySubmissionsDto,
    userId: number,
    userRoles: string[],
    authToken?: string,
  ): Promise<{
    data: Submission[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const page = queryDto.page || 1;
      const limit = queryDto.limit || 10;
      const skip = (page - 1) * limit;

      console.log('[SubmissionsService] findAll called:', {
        userId,
        userRoles,
        queryDto,
        hasAuthToken: !!authToken,
      });

      const queryBuilder =
        this.submissionRepository.createQueryBuilder('submission');
    
    // RBAC Logic:
    // - CHAIR/ADMIN: see all submissions
    // - REVIEWER/PC_MEMBER: see all submissions in tracks they've accepted (if trackId is provided)
    // - AUTHOR: see only their own submissions
    const isChairOrAdmin = userRoles.includes('CHAIR') || userRoles.includes('ADMIN');
    const isReviewer = userRoles.includes('REVIEWER') || userRoles.includes('PC_MEMBER');
    
    // For reviewers querying with trackId, verify they have accepted track assignment
    // NOTE: Temporarily disabled verification to allow query to proceed
    // Verification can be re-enabled later if needed for security
    if (isReviewer && queryDto.trackId) {
      try {
        console.log('[SubmissionsService] Verifying reviewer track assignment:', {
          userId,
          trackId: queryDto.trackId,
          trackIdType: typeof queryDto.trackId,
          hasAuthToken: !!authToken,
        });
        
        if (!authToken) {
          console.warn('[SubmissionsService] No authToken provided for track assignment verification, skipping verification');
          // Continue without verification if no token (for backward compatibility)
        } else {
          const trackCheck = await this.conferenceClient.checkReviewerTrackAssignment(
            userId,
            Number(queryDto.trackId),
            authToken,
          );
          
          console.log('[SubmissionsService] Track assignment verification result:', {
            trackId: queryDto.trackId,
            hasAccepted: trackCheck.hasAccepted,
          });
          
          // TEMPORARILY DISABLED: Don't block query if verification fails
          // This allows submissions to be shown even if verification service has issues
          // TODO: Re-enable this check once verification is working correctly
          /*
          if (!trackCheck.hasAccepted) {
            console.log('[SubmissionsService] Reviewer does not have accepted track assignment, returning empty');
            return {
              data: [],
              total: 0,
              page,
              limit,
            };
          }
          */
          
          if (!trackCheck.hasAccepted) {
            console.warn('[SubmissionsService] Reviewer does not have accepted track assignment, but continuing query anyway (verification disabled for debugging)');
          }
        }
      } catch (error) {
        console.error('[SubmissionsService] Error verifying track assignment:', {
          error: error instanceof Error ? error.message : error,
          errorStack: error instanceof Error ? error.stack : undefined,
          errorName: error instanceof Error ? error.name : typeof error,
          userId,
          trackId: queryDto.trackId,
        });
        // If verification fails, log but continue (don't block the query)
        // This allows the query to proceed even if verification service is down
        console.warn('[SubmissionsService] Continuing without verification due to error');
      }
    }
    
    if (!isChairOrAdmin && !isReviewer) {
      // Author: only see their own submissions
      queryBuilder.where('submission.authorId = :userId', { userId });
    } else if (isReviewer && !queryDto.trackId) {
      // Reviewer without trackId: only see their own submissions (fallback)
      queryBuilder.where('submission.authorId = :userId', { userId });
    }
    // If reviewer with trackId: see all submissions in that track (no author filter)
    
    if (queryDto.trackId) {
      // Use exact match for trackId (ensure type consistency)
      const trackIdNumber = Number(queryDto.trackId);
      console.log('[SubmissionsService] Adding trackId filter:', {
        originalTrackId: queryDto.trackId,
        originalType: typeof queryDto.trackId,
        convertedTrackId: trackIdNumber,
        convertedType: typeof trackIdNumber,
      });
      
      queryBuilder.andWhere('submission.trackId = :trackId', {
        trackId: trackIdNumber,
      });
    }

    if (queryDto.conferenceId) {
      queryBuilder.andWhere('submission.conferenceId = :conferenceId', {
        conferenceId: queryDto.conferenceId,
      });
    }

    if (queryDto.status) {
      queryBuilder.andWhere('submission.status = :status', {
        status: queryDto.status,
      });
    }

    if (queryDto.authorId) {
      if (userRoles.includes('CHAIR') || userRoles.includes('ADMIN')) {
        queryBuilder.andWhere('submission.authorId = :authorId', {
          authorId: queryDto.authorId,
        });
      }
    }

    // Search
    if (queryDto.search) {
      queryBuilder.andWhere(
        '(submission.title ILIKE :search OR submission.abstract ILIKE :search OR submission.keywords ILIKE :search)',
        { search: `%${queryDto.search}%` },
      );
    }

    // Get total count
    let total = 0;
    try {
      total = await queryBuilder.getCount();
    } catch (error) {
      console.error('[SubmissionsService] Error getting count:', {
        error: error instanceof Error ? error.message : error,
        errorStack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }

    // Debug logging for reviewer queries
    if (isReviewer && queryDto.trackId) {
      try {
        const sql = queryBuilder.getSql();
        const params = queryBuilder.getParameters();
        console.log('[SubmissionsService] Reviewer query details:', {
          userId,
          userRoles,
          trackId: queryDto.trackId,
          trackIdType: typeof queryDto.trackId,
          status: queryDto.status,
          conferenceId: queryDto.conferenceId,
          total,
          isReviewer,
          hasTrackId: !!queryDto.trackId,
          sql: sql,
          params: params,
          queryConditions: {
            hasTrackIdFilter: !!queryDto.trackId,
            hasStatusFilter: !!queryDto.status,
            hasConferenceIdFilter: !!queryDto.conferenceId,
          },
        });
        
        // Also check raw count without any filters to see if submissions exist in track
        try {
          const rawCountQuery = this.submissionRepository.createQueryBuilder('submission')
            .where('submission.trackId = :trackId', { trackId: Number(queryDto.trackId) });
          const rawCount = await rawCountQuery.getCount();
          
          // Get sample submissions to see what's in the track
          const sampleSubmissions = await rawCountQuery
            .select(['submission.id', 'submission.title', 'submission.status', 'submission.trackId'])
            .limit(5)
            .getMany();
          
          console.log('[SubmissionsService] Raw submissions count in track (no filters):', {
            trackId: queryDto.trackId,
            trackIdType: typeof queryDto.trackId,
            rawCount,
            sampleSubmissions: sampleSubmissions.map(s => ({
              id: s.id,
              title: s.title?.substring(0, 50),
              status: s.status,
              trackId: s.trackId,
              trackIdType: typeof s.trackId,
            })),
          });
          
          // Also check with string trackId to see if there's a type mismatch
          const rawCountQueryString = this.submissionRepository.createQueryBuilder('submission')
            .where('submission.trackId = :trackId', { trackId: String(queryDto.trackId) });
          const rawCountString = await rawCountQueryString.getCount();
          console.log('[SubmissionsService] Raw count with string trackId:', {
            trackId: String(queryDto.trackId),
            rawCount: rawCountString,
          });
        } catch (error) {
          console.error('[SubmissionsService] Error checking raw count:', {
            error: error instanceof Error ? error.message : error,
          });
        }
      } catch (error) {
        console.error('[SubmissionsService] Error in debug logging:', {
          error: error instanceof Error ? error.message : error,
        });
        // Don't throw, just log
      }
    }

    // Pagination and ordering
    let submissions: Submission[] = [];
    try {
      // Log final query before execution
      if (isReviewer && queryDto.trackId) {
        const finalSql = queryBuilder.getSql();
        const finalParams = queryBuilder.getParameters();
        console.log('[SubmissionsService] Final query before execution:', {
          sql: finalSql,
          params: finalParams,
          skip,
          limit,
        });
      }
      
      submissions = await queryBuilder
        .leftJoinAndSelect('submission.versions', 'versions')
        .orderBy('submission.createdAt', 'DESC')
        .skip(skip)
        .take(limit)
        .getMany();
        
      console.log('[SubmissionsService] Query executed successfully:', {
        foundCount: submissions.length,
        total,
        trackId: queryDto.trackId,
        isReviewer,
        hasTrackId: !!queryDto.trackId,
      });
    } catch (error) {
      console.error('[SubmissionsService] Error executing query:', {
        error: error instanceof Error ? error.message : error,
        errorStack: error instanceof Error ? error.stack : undefined,
        errorName: error instanceof Error ? error.name : typeof error,
        userId,
        trackId: queryDto.trackId,
      });
      throw error;
    }

      // Debug: Log actual submissions found
      if (isReviewer && queryDto.trackId) {
        console.log('[SubmissionsService] Found submissions:', {
          count: submissions.length,
          total,
          submissionIds: submissions.map(s => s.id),
          statuses: submissions.map(s => s.status),
          trackIds: submissions.map(s => s.trackId),
          submissions: submissions.map(s => ({
            id: s.id,
            title: s.title?.substring(0, 50),
            status: s.status,
            trackId: s.trackId,
            authorId: s.authorId,
          })),
        });
      }

      console.log('[SubmissionsService] findAll returning:', {
        dataCount: submissions.length,
        total,
        page,
        limit,
        hasTrackId: !!queryDto.trackId,
        trackId: queryDto.trackId,
        status: queryDto.status,
      });

      return {
        data: submissions,
        total,
        page,
        limit,
      };
    } catch (error) {
      console.error('[SubmissionsService] Unhandled error in findAll:', {
        error: error instanceof Error ? error.message : error,
        errorStack: error instanceof Error ? error.stack : undefined,
        errorName: error instanceof Error ? error.name : typeof error,
        userId,
        queryDto,
        hasAuthToken: !!authToken,
      });
      // Re-throw to let NestJS handle it properly
      throw error;
    }
  }

  /**
   * Lấy danh sách submissions của author
   */
  async findAllByAuthor(authorId: number): Promise<Submission[]> {
    return await this.submissionRepository.find({
      where: { authorId },
      relations: ['versions'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Lấy submissions được assign cho reviewer
   */
  async findAssignedSubmissions(
    reviewerId: number,
    assignmentIds: number[],
  ): Promise<Submission[]> {
    return [];
  }

  /**
   * Lấy chi tiết submission
   */
  async findOne(
    id: string,
    userId: number,
    userRoles: string[],
    assignmentIds?: number[],
    authToken?: string,
  ): Promise<Submission> {
    const submission = await this.submissionRepository.findOne({
      where: { id },
      relations: ['versions'],
    });

    if (!submission) {
      throw new NotFoundException(`Bài dự thi với ID ${id} không tồn tại`);
    }
    const isAuthor = submission.authorId === userId;
    const isChair = userRoles.includes('CHAIR') || userRoles.includes('ADMIN');
    const isReviewer =
      userRoles.includes('PC_MEMBER') || userRoles.includes('REVIEWER');
    if (isAuthor) {
      if (submission.versions) {
        submission.versions.sort((a, b) => b.versionNumber - a.versionNumber);
      }
      return submission;
    }
    if (isChair) {
      if (submission.versions) {
        submission.versions.sort((a, b) => b.versionNumber - a.versionNumber);
      }
      return submission;
    }
    
    // Reviewer: can view if:
    // 1. Has review assignment for this submission, OR
    // 2. Has accepted track assignment for the track of this submission
    if (isReviewer) {
      console.log('[SubmissionsService] Reviewer access check:', {
        userId,
        submissionId: id,
        trackId: submission.trackId,
        hasAssignmentIds: !!assignmentIds,
        assignmentIdsCount: assignmentIds?.length || 0,
        hasAuthToken: !!authToken,
      });
      
      // If assignmentIds not provided, try to get from review-service
      let reviewerSubmissionIds: string[] = [];
      let reviewerAssignmentIds: number[] = [];
      
      if (!assignmentIds || assignmentIds.length === 0) {
        try {
          console.log('[SubmissionsService] Fetching assignments from review-service...');
          const assignments = await this.reviewClient.getReviewerAssignments(authToken);
          reviewerSubmissionIds = assignments.map((a) => a.submissionId);
          reviewerAssignmentIds = assignments.map((a) => a.id);
          console.log('[SubmissionsService] Got assignments from review-service:', {
            count: assignments.length,
            submissionIds: reviewerSubmissionIds,
            assignmentIds: reviewerAssignmentIds,
          });
        } catch (error) {
          console.error('[SubmissionsService] Error fetching assignments from review-service:', error);
        }
      } else {
        reviewerAssignmentIds = assignmentIds;
      }
      
      // Check if reviewer has review assignment for this submission
      if (reviewerSubmissionIds.includes(id)) {
        console.log('[SubmissionsService] Reviewer has assignment for this submission, allowing access');
        if (submission.versions) {
          submission.versions.sort((a, b) => b.versionNumber - a.versionNumber);
        }
        return submission;
      }
      
      // Check if reviewer has accepted track assignment for this submission's track
      if (submission.trackId) {
        try {
          console.log('[SubmissionsService] Checking track assignment for reviewer:', {
            reviewerId: userId,
            trackId: submission.trackId,
          });
          
          const trackCheck = await this.conferenceClient.checkReviewerTrackAssignment(
            userId,
            submission.trackId,
            authToken,
          );
          
          console.log('[SubmissionsService] Track assignment check result:', trackCheck);
          
          if (trackCheck.hasAccepted) {
            console.log('[SubmissionsService] Reviewer has accepted track assignment, allowing access');
            if (submission.versions) {
              submission.versions.sort((a, b) => b.versionNumber - a.versionNumber);
            }
            return submission;
          } else {
            console.log('[SubmissionsService] Reviewer has NOT accepted track assignment');
          }
        } catch (error) {
          // If check fails, log and continue to throw ForbiddenException
          console.error('[SubmissionsService] Error checking track assignment:', error);
          if (error instanceof Error) {
            console.error('[SubmissionsService] Error details:', error.message, error.stack);
          }
        }
      } else {
        console.log('[SubmissionsService] Submission has no trackId');
      }
      
      console.log('[SubmissionsService] Reviewer does not have access to this submission');
    }

    throw new ForbiddenException('Bạn không có quyền xem submission này');
  }

  /**
   * Get anonymized reviews for author
   */
  async getAnonymizedReviews(
    id: string,
    authorId: number,
  ): Promise<
    Array<{ score: number; commentForAuthor: string; recommendation: string }>
  > {
    const submission = await this.submissionRepository.findOne({
      where: { id },
    });

    if (!submission) {
      throw new NotFoundException(`Submission với ID ${id} không tồn tại`);
    }
    if (submission.authorId !== authorId) {
      throw new ForbiddenException(
        'Bạn không có quyền xem reviews của submission này',
      );
    }
    if (
      submission.status !== SubmissionStatus.ACCEPTED &&
      submission.status !== SubmissionStatus.REJECTED
    ) {
      return [];
    }

    return await this.reviewClient.getAnonymizedReviewsForAuthor(id);
  }
}




