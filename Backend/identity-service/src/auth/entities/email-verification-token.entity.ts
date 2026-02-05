import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'email_verification_tokens' })
@Unique(['token'])
export class EmailVerificationToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'token', type: 'varchar', length: 255 })
  token: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ name: 'email_verification_token_user_id', type: 'int' })
  userId: number;

  @Column({ name: 'email_verification_token_expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @Column({ name: 'used', default: false })
  used: boolean;

  @CreateDateColumn({ name: 'email_verification_token_created_at', type: 'timestamptz' })
  createdAt: Date;
}
