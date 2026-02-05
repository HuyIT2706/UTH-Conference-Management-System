import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('submission_summaries')
export class SubmissionSummary {
  @PrimaryGeneratedColumn()
  aiId: number;

  @Index({ unique: true })
  @Column()
  submissionId: number;

  @Column('text')
  aiSummary: string;

  @Column('text')
  aiProblem: string;

  @Column('text')
  aiSolution: string;

  @Column('text')
  aiResult: string;

  @Column('simple-array', { nullable: true })
  aiKeywords: string[];

  @CreateDateColumn()
  aiCreatedAt: Date;

  @UpdateDateColumn()
  aiUpdatedAt: Date;
}
