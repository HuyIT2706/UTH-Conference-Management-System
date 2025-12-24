import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { Role, RoleName } from './entities/role.entity';
import { ChangePasswordDto } from './dto/change-password.dto';
import { PasswordResetToken } from './entities/password-reset-token.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(PasswordResetToken)
    private readonly passwordResetTokenRepository: Repository<PasswordResetToken>,
    private readonly dataSource: DataSource,
  ) {}

  // Cho phép các service khác (vd: AuthService) cập nhật user an toàn
  async markEmailVerified(userId: number): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.isVerified = true;
    return this.usersRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
      relations: ['roles'],
    });
  }

  async findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id },
      relations: ['roles'],
    });
  }

  async createUser(params: {
    email: string;
    password: string;
    fullName: string;
    roles?: Role[];
  }): Promise<User> {
    console.log('[createUser] Creating user with roles:', params.roles?.map(r => `${r.name} (ID: ${r.id})`));
    
    // Đảm bảo roles được load đầy đủ với ID
    const rolesToAssign = params.roles || [];
    if (rolesToAssign.length > 0) {
      // Verify roles có ID hợp lệ và reload từ database để đảm bảo
      const verifiedRoles: Role[] = [];
      for (const role of rolesToAssign) {
        if (!role.id) {
          throw new Error(`Role ${role.name} does not have an ID. Please ensure roles are loaded from database.`);
        }
        // Reload role từ database để đảm bảo nó tồn tại
        const dbRole = await this.roleRepository.findOne({ where: { id: role.id } });
        if (!dbRole) {
          throw new Error(`Role ${role.name} with ID ${role.id} not found in database`);
        }
        verifiedRoles.push(dbRole);
      }
      
      // Tạo user với roles được gán trực tiếp
      const user = this.usersRepository.create({
        email: params.email,
        password: params.password,
        fullName: params.fullName,
        isVerified: false,
        roles: verifiedRoles,
      });
      
      const savedUser = await this.usersRepository.save(user);
      console.log('[createUser] User saved with ID:', savedUser.id);
      
      // Reload user với relations để đảm bảo roles được load
      const userWithRoles = await this.usersRepository.findOne({
        where: { id: savedUser.id },
        relations: ['roles'],
      });
      
      if (!userWithRoles) {
        throw new Error('Failed to reload user with roles');
      }
      
      console.log('[createUser] User reloaded with roles:', userWithRoles.roles?.map(r => `${r.name} (ID: ${r.id})`));
      return userWithRoles;
    } else {
      // Không có roles, tạo user bình thường
      const user = this.usersRepository.create({
        email: params.email,
        password: params.password,
        fullName: params.fullName,
        isVerified: false,
      });
      
      const savedUser = await this.usersRepository.save(user);
      console.log('[createUser] User saved with ID:', savedUser.id);
      
      // Reload user với relations
      const userWithRoles = await this.usersRepository.findOne({
        where: { id: savedUser.id },
        relations: ['roles'],
      });
      
      if (!userWithRoles) {
        throw new Error('Failed to reload user');
      }
      
      return userWithRoles;
    }
  }

  async findRoleByName(name: string): Promise<Role | null> {
    const role = await this.roleRepository.findOne({ 
      where: { name: name as RoleName } 
    });
    if (role) {
      console.log(`[findRoleByName] Found role: ${role.name} (ID: ${role.id}) for search: ${name}`);
    } else {
      console.log(`[findRoleByName] Role not found for: ${name}`);
    }
    return role;
  }

  async createUserWithRole(params: {
    email: string;
    password: string;
    fullName: string;
    roleName: string;
  }): Promise<User> {
    const existing = await this.findByEmail(params.email);
    if (existing) {
      throw new BadRequestException('Email already exists');
    }

    const role = await this.findRoleByName(params.roleName);
    if (!role) {
      throw new BadRequestException(`Role ${params.roleName} not found`);
    }

    const user = this.usersRepository.create({
      email: params.email,
      password: params.password,
      fullName: params.fullName,
      isVerified: false,
      roles: [role],
    });

    return this.usersRepository.save(user);
  }

  async updateUserRoles(userId: number, roleName: string): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const role = await this.findRoleByName(roleName);
    if (!role) {
      throw new BadRequestException(`Role ${roleName} not found`);
    }

    // Ghi đè toàn bộ roles, chỉ giữ 1 role duy nhất
    user.roles = [role];
    return this.usersRepository.save(user);
  }

  async getProfile(userId: number): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async changePassword(
    userId: number,
    dto: ChangePasswordDto,
  ): Promise<void> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isOldPasswordValid = await bcrypt.compare(
      dto.oldPassword,
      user.password,
    );
    if (!isOldPasswordValid) {
      throw new UnauthorizedException('Old password is incorrect');
    }

    const hashed = await bcrypt.hash(dto.newPassword, 10);
    user.password = hashed;
    await this.usersRepository.save(user);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.findByEmail(email);
    if (!user) {
      // Không tiết lộ thông tin tồn tại của email cho client
      return;
    }

    // Tạo mã 6 chữ số
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 phút

    const resetToken = this.passwordResetTokenRepository.create({
      token: code,
      userId: user.id,
      expiresAt,
      used: false,
    });
    await this.passwordResetTokenRepository.save(resetToken);

    // TODO: Tích hợp SMTP / notification-service để gửi email
    // Tạm thời log ra server để dev test
    // eslint-disable-next-line no-console
    console.log(
      `[ForgotPassword] Sent reset code ${code} to email ${user.email} (expires at ${expiresAt.toISOString()})`,
    );
  }

  async resetPassword(
    email: string,
    code: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const token = await this.passwordResetTokenRepository.findOne({
      where: {
        userId: user.id,
        token: code,
        used: false,
      },
      order: { createdAt: 'DESC' },
    });

    if (!token) {
      throw new UnauthorizedException('Mã reset mật khẩu không hợp lệ');
    }

    if (token.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Mã reset mật khẩu đã hết hạn');
    }

    token.used = true;
    await this.passwordResetTokenRepository.save(token);

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await this.usersRepository.save(user);
  }

  async deleteUser(userId: number): Promise<void> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.usersRepository.remove(user);
  }
}

