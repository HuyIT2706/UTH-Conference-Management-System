import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'rebuttals' })
export class Rebuttal {
  @PrimaryGeneratedColumn({name: 'rebuttal_id'})
  id: number;

  @Column({ type: 'uuid', name: 'rebuttal_submission_id' })
  submissionId: string;

  @Column({ type: 'int', name: 'rebuttal_author_id' })
  authorId: number;

  @Column({ type: 'int', nullable: true, name: 'rebuttal_conference_id' })
  conferenceId: number | null;

  @Column({ type: 'text', name: 'rebuttal_message' })
  message: string;

  @CreateDateColumn({ name: 'rebuttal_created_at', type: 'timestamptz' })
  createdAt: Date;
}
