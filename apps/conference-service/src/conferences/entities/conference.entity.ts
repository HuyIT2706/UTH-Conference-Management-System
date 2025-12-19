import { Column, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
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

  @Column({ type: 'int' })
  organizerId: number;

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
