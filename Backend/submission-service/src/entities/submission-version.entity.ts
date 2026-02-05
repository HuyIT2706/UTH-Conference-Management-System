import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Submission } from './submission.entity';

@Entity({ name: 'submission_versions' })
export class SubmissionVersion {
  @PrimaryGeneratedColumn({name: 'submission_version_id'})
  id: number;

  @Column({ type: 'uuid', name: 'submission_version_submission_id' })
  submissionId: string;

  @Column({ type: 'int', name: 'submission_version_number' })
  versionNumber: number;

  @Column({ type: 'varchar', length: 500, name: 'submission_version_title' })
  title: string;

  @Column({ type: 'text', name: 'submission_version_abstract' })
  abstract: string;

  @Column({ type: 'text', name: 'submission_version_file_url' })
  fileUrl: string;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'submission_version_keywords' })
  keywords: string | null;

  @CreateDateColumn({ name: 'submission_version_created_at', type: 'timestamptz' })
  createdAt: Date; // Ngày backup

  @ManyToOne(() => Submission, (submission) => submission.versions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'submissionId' })
  submission: Submission;
}
