import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Submission, SubmissionStatus } from '../entities/submission.entity';
import { SubmissionVersion } from '../entities/submission-version.entity';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';
import { SupabaseService } from '../supabase/supabase.config';
import { Express } from 'express';

@Injectable()
export class SubmissionsService {
  constructor(
    @InjectRepository(Submission)
    private submissionRepository: Repository<Submission>,
    @InjectRepository(SubmissionVersion)
    private submissionVersionRepository: Repository<SubmissionVersion>,
    private supabaseService: SupabaseService,
    private dataSource: DataSource,
  ) {}

  /**
   * Upload file PDF lên Supabase Storage
   * @param file Express.Multer.File
   * @returns Public URL của file
   */
  async uploadFile(file: Express.Multer.File): Promise<string> {
    if (!file) {
      throw new BadRequestException('File không được để trống');
    }

    // Validate file phải là PDF
    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Chỉ chấp nhận file PDF');
    }

    const supabase = this.supabaseService.getClient();
    const bucketName = 'submissions';

    // Tạo tên file unique: timestamp-uuid.pdf
    const timestamp = Date.now();
    const uuid = crypto.randomUUID();
    const fileName = `${timestamp}-${uuid}.pdf`;

    try {
      // Upload file lên Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file.buffer, {
          contentType: 'application/pdf',
          upsert: false,
        });

      if (error) {
        throw new BadRequestException(
          `Lỗi khi upload file: ${error.message}`,
        );
      }

      // Lấy Public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucketName).getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Lỗi khi upload file: ${error.message}`,
      );
    }
  }

  /**
   * Tạo submission mới
   * @param createDto DTO chứa thông tin submission
   * @param file File PDF (bắt buộc)
   * @param authorId ID của author (từ JWT token)
   * @returns Submission đã tạo
   */
  async create(
    createDto: CreateSubmissionDto,
    file: Express.Multer.File,
    authorId: number,
  ): Promise<Submission> {
    if (!file) {
      throw new BadRequestException('File PDF là bắt buộc');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Upload file lên Supabase
      const fileUrl = await this.uploadFile(file);

      // 2. Tạo submission mới với status = SUBMITTED
      const submission = this.submissionRepository.create({
        title: createDto.title,
        abstract: createDto.abstract,
        keywords: createDto.keywords || null,
        fileUrl,
        status: SubmissionStatus.SUBMITTED,
        authorId,
        trackId: createDto.trackId,
      });

      const savedSubmission = await queryRunner.manager.save(submission);

      // 3. Tạo bản ghi đầu tiên vào SubmissionVersion (Version 1)
      const version = this.submissionVersionRepository.create({
        submissionId: savedSubmission.id,
        versionNumber: 1,
        title: savedSubmission.title,
        abstract: savedSubmission.abstract,
        fileUrl: savedSubmission.fileUrl,
        keywords: savedSubmission.keywords,
      });

      await queryRunner.manager.save(version);

      await queryRunner.commitTransaction();

      // Load lại với relations
      return await this.submissionRepository.findOne({
        where: { id: savedSubmission.id },
        relations: ['versions'],
      });
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
   * @param file File PDF mới (tùy chọn)
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
      // 1. Tìm submission hiện tại
      const submission = await queryRunner.manager.findOne(Submission, {
        where: { id },
        relations: ['versions'],
      });

      if (!submission) {
        throw new NotFoundException(`Submission với ID ${id} không tồn tại`);
      }

      // 2. Kiểm tra quyền: Chỉ author mới được sửa
      if (submission.authorId !== authorId) {
        throw new ForbiddenException(
          'Bạn không có quyền cập nhật submission này',
        );
      }

      // 3. Versioning: Copy dữ liệu hiện tại sang SubmissionVersion
      // Tìm version number cao nhất
      const maxVersion = submission.versions?.length
        ? Math.max(...submission.versions.map((v) => v.versionNumber))
        : 0;

      const newVersionNumber = maxVersion + 1;

      // Tạo version backup
      const version = this.submissionVersionRepository.create({
        submissionId: submission.id,
        versionNumber: newVersionNumber,
        title: submission.title,
        abstract: submission.abstract,
        fileUrl: submission.fileUrl,
        keywords: submission.keywords,
      });

      await queryRunner.manager.save(version);

      // 4. Upload file mới nếu có, nếu không thì giữ URL cũ
      let newFileUrl = submission.fileUrl;
      if (file) {
        newFileUrl = await this.uploadFile(file);
      }

      // 5. Cập nhật submission với dữ liệu mới
      Object.assign(submission, {
        title: updateDto.title ?? submission.title,
        abstract: updateDto.abstract ?? submission.abstract,
        keywords: updateDto.keywords ?? submission.keywords,
        trackId: updateDto.trackId ?? submission.trackId,
        fileUrl: newFileUrl,
      });

      const updatedSubmission = await queryRunner.manager.save(submission);

      await queryRunner.commitTransaction();

      // Load lại với relations
      return await this.submissionRepository.findOne({
        where: { id: updatedSubmission.id },
        relations: ['versions'],
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Lấy danh sách submissions của user
   * @param authorId ID của author
   * @returns Danh sách submissions
   */
  async findAllByAuthor(authorId: number): Promise<Submission[]> {
    return await this.submissionRepository.find({
      where: { authorId },
      relations: ['versions'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Lấy chi tiết submission theo ID (kèm lịch sử versions)
   * @param id ID của submission
   * @param authorId ID của author (để kiểm tra quyền)
   * @returns Submission với versions
   */
  async findOne(id: string, authorId: number): Promise<Submission> {
    const submission = await this.submissionRepository.findOne({
      where: { id },
      relations: ['versions'],
    });

    if (!submission) {
      throw new NotFoundException(`Submission với ID ${id} không tồn tại`);
    }

    // Kiểm tra quyền: Chỉ author mới được xem
    if (submission.authorId !== authorId) {
      throw new ForbiddenException(
        'Bạn không có quyền xem submission này',
      );
    }

    // Sắp xếp versions theo versionNumber giảm dần (mới nhất trước)
    if (submission.versions) {
      submission.versions.sort((a, b) => b.versionNumber - a.versionNumber);
    }

    return submission;
  }
}
