import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Conference } from './conference.entity';

@Entity({ name: 'tracks' })
export class Track {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'int' })
  conferenceId: number;

  @ManyToOne(() => Conference, (conference) => conference.tracks, {
    onDelete: 'CASCADE',
  })
  conference: Conference;
}
