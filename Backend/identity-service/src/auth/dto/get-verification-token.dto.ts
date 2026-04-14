import { IsEmail, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetVerificationTokenDto {
  @ApiProperty({
    description: 'Email của người dùng cần lấy lại mã',
    example: 'user@example.com',
  })
  @IsEmail()
  @MaxLength(150)
  email: string;
}
