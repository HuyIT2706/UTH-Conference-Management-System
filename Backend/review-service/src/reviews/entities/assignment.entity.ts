import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  OneToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Review } from './review.entity';

export enum AssignmentStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
}

@Entity({ name: 'assignments' })
export class Assignment {
  @PrimaryGeneratedColumn({name: 'assignment_id'})
  id: number;

  @Column({ type: 'int', name: 'assignment_reviewer_id'})
  reviewerId: number;

  @Column({ type: 'uuid', name: 'assignment_submission_id' })
  submissionId: string;

  @Column({ type: 'int', nullable: true, name: 'assignment_conference_id' })
  conferenceId: number | null;

  @Column({
    name: 'assignment_status',
    type: 'enum',
    enum: AssignmentStatus,
    default: AssignmentStatus.PENDING,
  })
  status: AssignmentStatus;

  @Column({ name: 'assignment_assigned_by', type: 'int' })
  assignedBy: number;

  @Column({ name: 'assignment_due_date', type: 'timestamptz', nullable: true })
  dueDate: Date | null;

  @CreateDateColumn({ name: 'assignment_created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'assignment_updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToOne(() => Review, (review) => review.assignment)
  review: Review | null;
}
