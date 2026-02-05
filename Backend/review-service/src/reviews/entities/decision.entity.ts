import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

export enum FinalDecision {
  ACCEPT = 'ACCEPT',
  REJECT = 'REJECT',
  BORDERLINE = 'BORDERLINE',
}

@Entity({ name: 'decisions' })
@Unique(['submissionId'])
export class Decision {
  @PrimaryGeneratedColumn({name: 'decision_id'})
  id: number;

  @Column({ type: 'uuid', name: 'decision_submission_id' })
  submissionId: string;

  @Column({ type: 'int', nullable: true, name: 'decision_conference_id' })
  conferenceId: number | null;

  @Column({
    type: 'enum',
    enum: FinalDecision,
    name: 'decision_value'
  })
  decision: FinalDecision;

  @Column({ type: 'int', name: 'decision_decided_by' })
  decidedBy: number;

  @Column({ type: 'text', nullable: true, name: 'decision_note' })
  note: string | null;

  @CreateDateColumn({ name: 'decision_decided_at', type: 'timestamptz' })
  decidedAt: Date;
}
