import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Conference } from './conference.entity';
import { TrackMember } from './track-member.entity';

@Entity({ name: 'tracks' })
export class Track {
  @PrimaryGeneratedColumn({name: 'track_id'})
  id: number;

  @Column({ name: 'track_name', type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'track_conference_id', type: 'int' })
  conferenceId: number;

  @Column({ name: 'track_description', type: 'text', nullable: true })
  description: string | null;

  @CreateDateColumn({ name: 'track_created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'track_updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'track_deleted_at' })
  deletedAt: Date | null;

  @Column({ type: 'boolean', default: true, name: 'track_is_active' })
  isActive: boolean;

  @ManyToOne(() => Conference, (conference) => conference.tracks, {
    onDelete: 'CASCADE',
  })
  conference: Conference;

  @OneToMany(() => TrackMember, (member) => member.track)
  members: TrackMember[];
}
