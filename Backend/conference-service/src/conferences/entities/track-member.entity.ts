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
  @PrimaryGeneratedColumn({name: 'track_member_id'})
  id: number;

  @Column({ name: 'track_id', type: 'int' })
  trackId: number;

  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @Column({
    name: 'track_member_status',
    type: 'enum',
    enum: ['PENDING', 'ACCEPTED', 'REJECTED'],
    default: 'PENDING',
  })
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';

  @CreateDateColumn({ name: 'track_member_created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'track_member_updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => Track, (track) => track.members, {
    onDelete: 'CASCADE',
  })
  track: Track;
}
