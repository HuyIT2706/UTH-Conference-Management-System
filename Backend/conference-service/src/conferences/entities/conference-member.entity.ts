import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Conference } from './conference.entity';

export enum ConferenceMemberRole {
  CHAIR = 'CHAIR',
  PC_MEMBER = 'PC_MEMBER',
  REVIEWER = 'REVIEWER',
}

@Entity({ name: 'conference_members' })
export class ConferenceMember {
  @PrimaryGeneratedColumn({name: 'conference_member_id'})
  id: number;

  @Column({ name: 'conference_id', type: 'int' })
  conferenceId: number;

  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @Column({ name: 'role', type: 'enum', enum: ConferenceMemberRole })
  role: ConferenceMemberRole;

  @ManyToOne(() => Conference, (conference) => conference.members, {
    onDelete: 'CASCADE',
  })
  conference: Conference;
}
