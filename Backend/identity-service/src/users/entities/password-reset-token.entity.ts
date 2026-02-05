import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'password_reset_tokens' })
@Unique(['token'])
export class PasswordResetToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'token', type: 'varchar', length: 255 })
  token: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @Column({ name: 'password_reset_token_expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @Column({ name: 'used', default: false })
  used: boolean;

  @CreateDateColumn({ name: 'password_reset_token_created_at', type: 'timestamptz' })
  createdAt: Date;
}
