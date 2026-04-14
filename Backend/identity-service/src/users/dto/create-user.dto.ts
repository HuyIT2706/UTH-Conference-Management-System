import { IsEmail, IsEnum, IsString, MinLength, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RoleName } from '../entities/role.entity';

export class CreateUserDto {
  @ApiProperty({
    description: 'Email của user',
    example: 'reviewer@example.com',
  })
  @IsNotEmpty()
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
    description: 'Họ và tên đầy đủ (từ 10 đến 50 ký tự)',
    example: 'Nguyễn Văn Reviewer',
    minLength: 10,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(50)
  fullName: string;

  @ApiProperty({
    description: 'Role của user',
    enum: RoleName,
    example: RoleName.REVIEWER,
  })
  @IsNotEmpty()
  @IsEnum(RoleName)
  role: RoleName;
}
