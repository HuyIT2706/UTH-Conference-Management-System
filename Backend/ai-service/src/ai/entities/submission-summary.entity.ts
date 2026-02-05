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
  @PrimaryGeneratedColumn({name: 'ai_id'})
  id: number;

  @Index({ unique: true})
  @Column({ name: 'submission_id', type: 'int' })
  submissionId: number;

  @Column({name: 'ai_summary', type: 'text'})
  summary: string;

  @Column({name: 'ai_problem', type: 'text'})
  problem: string;

  @Column({name: 'ai_solution', type: 'text'})
  solution: string;

  @Column({name: 'ai_result', type: 'text'})
  result: string;

  @Column({ name: 'ai_keywords', type: 'simple-array', nullable: true })
  keywords: string[];

  @CreateDateColumn({name: 'ai_created_at'})
  createdAt: Date;

  @UpdateDateColumn({name: 'ai_updated_at'})
  updatedAt: Date;
}
