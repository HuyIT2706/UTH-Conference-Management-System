import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Track } from './track.entity';

@Entity({ name: 'track_members' })
export class TrackMember {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  trackId: number;

  @Column({ type: 'int' })
  userId: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => Track, (track) => track.members, {
    onDelete: 'CASCADE',
  })
  track: Track;
}





