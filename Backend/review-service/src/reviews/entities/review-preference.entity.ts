import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PreferenceType {
  INTERESTED = 'INTERESTED',
  MAYBE = 'MAYBE',
  CONFLICT = 'CONFLICT',
  NOT_INTERESTED = 'NOT_INTERESTED',
}

@Entity({ name: 'review_preferences' })
@Unique(['reviewerId', 'submissionId'])
export class ReviewPreference {
  @PrimaryGeneratedColumn({name: 'review_preference_id'})
  id: number;

  @Column({ type: 'int', name: 'review_preference_reviewer_id' })
  reviewerId: number;

  @Column({ type: 'uuid', name: 'review_preference_submission_id' })
  submissionId: string;

  @Column({ type: 'int', nullable: true, name: 'review_preference_conference_id' })
  conferenceId: number | null;

  @Column({
    type: 'enum',
    enum: PreferenceType,
    default: PreferenceType.MAYBE,
  })
  preference: PreferenceType;

  @CreateDateColumn({ name: 'review_preference_created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'review_preference_updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
