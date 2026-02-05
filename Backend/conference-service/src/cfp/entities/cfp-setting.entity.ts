import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Conference } from '../../conferences/entities/conference.entity';

@Entity({ name: 'cfp_settings' })
export class CfpSetting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'submission_deadline', type: 'timestamptz' })
  submissionDeadline: Date;

  @Column({ name: 'review_deadline', type: 'timestamptz' })
  reviewDeadline: Date;

  @Column({ name: 'notification_date', type: 'timestamptz' })
  notificationDate: Date;

  @Column({ name: 'camera_ready_deadline', type: 'timestamptz' })
  cameraReadyDeadline: Date;

  @Column({ name: 'conference_id', type: 'int', unique: true })
  conferenceId: number;

  @OneToOne(() => Conference, (conference) => conference.cfpSetting, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conference_id' })
  conference: Conference;
}
