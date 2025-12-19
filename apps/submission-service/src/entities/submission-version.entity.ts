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
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid' })
  submissionId: string;

  @Column({ type: 'int' })
  versionNumber: number; // Tăng dần 1, 2, 3...

  @Column({ type: 'varchar', length: 500 })
  title: string; // Snapshot dữ liệu cũ

  @Column({ type: 'text' })
  abstract: string; // Snapshot dữ liệu cũ

  @Column({ type: 'text' })
  fileUrl: string; // Snapshot file URL cũ

  @Column({ type: 'varchar', length: 500, nullable: true })
  keywords: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date; // Ngày backup

  @ManyToOne(() => Submission, (submission) => submission.versions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'submissionId' })
  submission: Submission;
}
