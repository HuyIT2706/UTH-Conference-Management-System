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
    description: 'Họ và tên (từ 10 đến  50 ký tự)',
    example: 'Nguyễn Văn A',
    minLength: 10,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(50)
  fullName: string;
}
