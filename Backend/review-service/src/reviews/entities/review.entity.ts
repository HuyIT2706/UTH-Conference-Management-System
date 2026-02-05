import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Assignment } from './assignment.entity';

export enum ConfidenceLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum RecommendationType {
  ACCEPT = 'ACCEPT',
  WEAK_ACCEPT = 'WEAK_ACCEPT',
  REJECT = 'REJECT',
  WEAK_REJECT = 'WEAK_REJECT',
}

@Entity({ name: 'reviews' })
export class Review {
  @PrimaryGeneratedColumn({name: 'review_id'})
  id: number;

  @Column({ type: 'int', unique: true, name: 'review_assignment_id' })
  assignmentId: number;

  @Column({ type: 'int', nullable: true, name: 'review_conference_id' })
  conferenceId: number | null;

  @Column({ type: 'int', name: 'review_score' })
  score: number;

  @Column({
    name: 'review_confidence',
    type: 'enum',
    enum: ConfidenceLevel,
    default: ConfidenceLevel.MEDIUM,
  })
  confidence: ConfidenceLevel;

  @Column({ type: 'text', nullable: true, name: 'review_comment_for_author' })
  commentForAuthor: string | null;

  @Column({ type: 'text', nullable: true, name: 'review_comment_for_pc' })
  commentForPC: string | null;

  @Column({
    type: 'enum',
    enum: RecommendationType,
    name: 'review_recommendation',  
  })
  recommendation: RecommendationType;

  @CreateDateColumn({ name: 'review_created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'review_updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToOne(() => Assignment, (assignment) => assignment.review)
  @JoinColumn({ name: 'assignmentId' })
  assignment: Assignment;
}
