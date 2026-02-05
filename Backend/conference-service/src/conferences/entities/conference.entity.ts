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
  @PrimaryGeneratedColumn({name: 'conference_id'})
  id: number;

  @Column({ name: 'conference_name', type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'conference_start_date', type: 'timestamptz' })
  startDate: Date;

  @Column({ name: 'conference_end_date', type: 'timestamptz' })
  endDate: Date;

  @Column({ name: 'conference_venue', type: 'varchar', length: 255 })
  venue: string;

  @Column({ name: 'conference_description', type: 'text', nullable: true })
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

  @Column({ name: 'organizer_id', type: 'int' })
  organizerId: number;

  @Column({ type: 'timestamptz', nullable: true, name: 'conference_deleted_at' })
  deletedAt: Date | null;

  @Column({ type: 'boolean', default: true, name: 'conference_is_active' })
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
