import { IsEmail, IsEnum, IsString, MinLength, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RoleName } from '../entities/role.entity';

export class CreateUserDto {
  @ApiProperty({
    description: 'Email của user',
    example: 'reviewer@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Mật khẩu (tối thiểu 6 ký tự, tối đa 255 ký tự)',
    example: 'password123',
    minLength: 6,
    maxLength: 255,
  })
  @IsString()
  @MinLength(6)
  @MaxLength(255)
  password: string;

  @ApiProperty({
    description: 'Họ và tên đầy đủ',
    example: 'Nguyễn Văn Reviewer',
  })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({
    description: 'Role của user',
    enum: RoleName,
    example: RoleName.REVIEWER,
  })
  @IsEnum(RoleName)
  role: RoleName;
}
