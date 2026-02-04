import {
  Column,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Track } from './track.entity';
import { ConferenceMember } from './conference-member.entity';
import { CfpSetting } from '../../cfp/entities/cfp-setting.entity';

@Entity({ name: 'conferences' })
export class Conference {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'timestamptz' })
  startDate: Date;

  @Column({ type: 'timestamptz' })
  endDate: Date;

  @Column({ type: 'varchar', length: 255 })
  venue: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    name: 'short_description',
  })
  shortDescription: string | null;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'contact_email',
  })
  contactEmail: string | null;

  @Column({ type: 'int' })
  organizerId: number;

  @Column({ type: 'timestamptz', nullable: true, name: 'deleted_at' })
  deletedAt: Date | null;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @OneToMany(() => Track, (track) => track.conference)
  tracks: Track[];

  @OneToMany(
    () => ConferenceMember,
    (conferenceMember) => conferenceMember.conference,
  )
  members: ConferenceMember[];

  @OneToOne(() => CfpSetting, (cfp) => cfp.conference)
  cfpSetting: CfpSetting | null;
}
