import { IsEmail, IsString, MinLength, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'Email đăng ký',
    example: 'string@gmail.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Mật khẩu (tối thiểu 6 ký tự, tối đa 255 ký tự)',
    example: 'string',
    minLength: 6,
    maxLength: 255,
  })
  @IsString()
  @MinLength(6)
  @MaxLength(255)
  password: string;

  @ApiProperty({
    description: 'Họ và tên',
    example: 'string',
  })
  @IsString()
  @IsNotEmpty()
  fullName: string;
}
