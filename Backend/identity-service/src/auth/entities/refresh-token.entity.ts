import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'refresh_tokens' })
@Unique(['token'])
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'token', type: 'varchar', length: 255 })
  token: string;

  @Column({ name: 'refresh_token_expiry_date', type: 'timestamptz' })
  expiryDate: Date;

  @ManyToOne(() => User, (user) => user.refreshTokens, {
    onDelete: 'CASCADE',
  })
  user: User;

  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @CreateDateColumn({ name: 'refresh_token_created_at', type: 'timestamptz' })
  createdAt: Date;
}
