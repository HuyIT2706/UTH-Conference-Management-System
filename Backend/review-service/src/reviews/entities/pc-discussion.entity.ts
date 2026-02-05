import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity({ name: 'pc_discussions' })
export class PcDiscussion {
  @PrimaryGeneratedColumn({name: 'pc_discussion_id'})
  id: number;

  @Column({ type: 'uuid', name: 'pc_discussion_submission_id'})
  submissionId: string;

  @Column({ name: 'pc_discussion_conference_id', type: 'int', nullable: true })
  conferenceId: number | null;

  @Column({ name: 'pc_discussion_user_id', type: 'int' })
  userId: number;

  @Column({ type: 'text', name: 'pc_discussion_message' })
  message: string;

  @CreateDateColumn({ name: 'pc_discussion_created_at', type: 'timestamptz' })
  createdAt: Date;
}
