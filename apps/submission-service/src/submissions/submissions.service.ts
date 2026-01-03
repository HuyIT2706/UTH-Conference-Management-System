import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
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
      [SubmissionStatus.DRAFT]: [SubmissionStatus.SUBMITTED],
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
    const isDraft = createDto.isDraft ?? false;

    // Nếu là draft, file có thể optional hoặc vẫn cần file
    // Nhưng để đơn giản, vẫn yêu cầu file ngay cả khi draft
    if (!file) {
      throw new BadRequestException('File là bắt buộc (PDF, DOCX hoặc ZIP)');
    }

    // Chỉ check deadline khi nộp bài (không phải draft)
    if (!isDraft) {
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
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Upload file lên Supabase
      const fileUrl = await this.uploadFile(file);

      // 2. Tạo submission mới với status = DRAFT hoặc SUBMITTED
      const submission = this.submissionRepository.create({
        title: createDto.title,
        abstract: createDto.abstract,
        keywords: createDto.keywords || null,
        fileUrl,
        status: isDraft ? SubmissionStatus.DRAFT : SubmissionStatus.SUBMITTED,
        authorId,
        authorName: authorName || null, // Lưu tên từ JWT token
        trackId: createDto.trackId,
        conferenceId: createDto.conferenceId,
        coAuthors: null, // Không dùng coAuthors nữa, chỉ dùng authorId từ token
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

      Object.assign(submission, {
        title: updateDto.title ?? submission.title,
        abstract: updateDto.abstract ?? submission.abstract,
        keywords: updateDto.keywords ?? submission.keywords,
        trackId: updateDto.trackId ?? submission.trackId,
        fileUrl: newFileUrl,
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
// Update status submission
  async updateStatus(
    id: string,
    updateStatusDto: UpdateStatusDto,
    userId: number,
    userRoles: string[],
  ): Promise<Submission> {
    const submission = await this.submissionRepository.findOne({
      where: { id },
    });

    if (!submission) {
      throw new NotFoundException(`Submission với ID ${id} không tồn tại`);
    }
    if (!userRoles.includes('CHAIR') && !userRoles.includes('ADMIN')) {
      throw new ForbiddenException(
        'Chỉ Chair hoặc Admin mới được cập nhật trạng thái',
      );
    }

    // Validate status transition
    if (
      !this.validateStatusTransition(submission.status, updateStatusDto.status)
    ) {
      throw new BadRequestException(
        `Không thể chuyển từ ${submission.status} sang ${updateStatusDto.status}`,
      );
    }

    submission.status = updateStatusDto.status;
    return await this.submissionRepository.save(submission);
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

    // Validate deadline
    const deadlineCheck = await this.conferenceClient.checkDeadline(
      submission.conferenceId,
      'camera-ready',
    );
    if (!deadlineCheck.valid) {
      throw new BadRequestException(
        `Hạn nộp camera-ready đã qua: ${deadlineCheck.message}`,
      );
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
  ): Promise<{
    data: Submission[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = queryDto.page || 1;
    const limit = queryDto.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder =
      this.submissionRepository.createQueryBuilder('submission');
    if (!userRoles.includes('CHAIR') && !userRoles.includes('ADMIN')) {
      queryBuilder.where('submission.authorId = :userId', { userId });
    }
    if (queryDto.trackId) {
      queryBuilder.andWhere('submission.trackId = :trackId', {
        trackId: queryDto.trackId,
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
    const total = await queryBuilder.getCount();

    // Pagination and ordering
    const submissions = await queryBuilder
      .leftJoinAndSelect('submission.versions', 'versions')
      .orderBy('submission.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getMany();

    return {
      data: submissions,
      total,
      page,
      limit,
    };
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
    if (isReviewer && assignmentIds && assignmentIds.length > 0) {
      if (submission.versions) {
        submission.versions.sort((a, b) => b.versionNumber - a.versionNumber);
      }
      return submission;
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




