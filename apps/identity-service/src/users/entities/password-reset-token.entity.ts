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

  // Mã reset (hoặc token) lưu dạng plain để đơn giản,
  // nếu muốn an toàn hơn có thể đổi sang hash + salt
  @Column()
  token: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @Column({ name: 'used', default: false })
  used: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}



