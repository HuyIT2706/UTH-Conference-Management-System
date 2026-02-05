import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { SubmissionVersion } from './submission-version.entity';

export enum SubmissionStatus {
  SUBMITTED = 'SUBMITTED',
  REVIEWING = 'REVIEWING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
  CAMERA_READY = 'CAMERA_READY',
}

@Entity({ name: 'submissions' })
export class Submission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'submission_title', type: 'varchar', length: 500 })
  title: string;

  @Column({ name: 'submission_abstract', type: 'text' })
  abstract: string;

  @Column({ name: 'submission_keywords', type: 'varchar', length: 500, nullable: true })
  keywords: string | null;

  @Column({ name: 'submission_file_url', type: 'text' })
  fileUrl: string;

  @Column({
    name: 'submission_status',
    type: 'enum',
    enum: SubmissionStatus,
    default: SubmissionStatus.SUBMITTED,
  })
  status: SubmissionStatus;

  @Column({ name: 'submission_author_id', type: 'int' })
  authorId: number;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'submission_author_name' })
  authorName: string | null;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'submission_author_affiliation',
  })
  authorAffiliation: string | null;

  @Column({ name: 'submission_track_id', type: 'int' })
  trackId: number;

  @Column({ name: 'submission_conference_id', type: 'int' })
  conferenceId: number;

  @Column({ name: 'submission_co_authors', type: 'jsonb', nullable: true })
  coAuthors: Array<{
    name: string;
    email: string;
    affiliation?: string;
  }> | null;

  @Column({ name: 'submission_camera_ready_file_url', type: 'text', nullable: true })
  cameraReadyFileUrl: string | null;

  @CreateDateColumn({ name: 'submission_created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'submission_updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'submission_submitted_at' })
  submittedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'submission_deleted_at' })
  deletedAt: Date | null;

  @Column({ type: 'boolean', default: true, name: 'submission_is_active' })
  isActive: boolean;

  @OneToMany(() => SubmissionVersion, (version) => version.submission, {
    cascade: true,
  })
  versions: SubmissionVersion[];
}
