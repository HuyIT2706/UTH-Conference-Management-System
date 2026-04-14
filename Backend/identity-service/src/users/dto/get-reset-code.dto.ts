import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetResetCodeDto {
  @ApiProperty({
    description: 'Email của người dùng cần lấy lại mã reset',
    example: 'user@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(150)
  email: string;
}
