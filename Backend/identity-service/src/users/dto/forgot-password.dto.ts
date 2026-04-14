import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Email của người dùng cần đặt lại mật khẩu',
    example: 'user@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(150)
  email: string;
}
