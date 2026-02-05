import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RefreshToken } from '../../auth/entities/refresh-token.entity';
import { Role } from './role.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn({name: "user_id"})
  id: number;

  @Column({name: 'user_email', unique: true, type: 'varchar', length: 150})
  email: string;

  @Column({name: 'user_password', type: 'varchar', length: 30})
  password: string;

  @Column({ name: 'user_full_name', type: 'varchar', length: 50 })
  fullName: string;

  @Column({ default: false, name: 'user_is_verified', type: 'boolean' })
  isVerified: boolean;

  @ManyToMany(() => Role, (role) => role.users)
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Role[];

  @OneToMany(() => RefreshToken, (token) => token.user, { cascade: true })
  refreshTokens: RefreshToken[];

  @CreateDateColumn({ name: 'user_created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'user_updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'user_deleted_at' })
  deletedAt: Date | null;

  @Column({ type: 'boolean', default: true, name: 'user_is_active' })
  isActive: boolean;
}
