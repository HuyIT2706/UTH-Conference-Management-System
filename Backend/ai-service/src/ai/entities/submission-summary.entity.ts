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
  @Column({ name: 'submission_id', type: 'varchar', length: 255 })
  submissionId: string;

  @Column({name: 'ai_summary', type: 'text'})
  summary: string;

  @Column({name: 'ai_problem', type: 'text', nullable: true})
  problem: string;

  @Column({name: 'ai_solution', type: 'text', nullable: true})
  solution: string;

  @Column({name: 'ai_result', type: 'text', nullable: true})
  result: string;

  @Column({ name: 'ai_keywords', type: 'simple-array', nullable: true })
  keywords: string[];

  @CreateDateColumn({name: 'ai_created_at'})
  createdAt: Date;

  @UpdateDateColumn({name: 'ai_updated_at'})
  updatedAt: Date;
}
