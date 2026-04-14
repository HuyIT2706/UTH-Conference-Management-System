import { IsEmail, IsNotEmpty, IsNumberString, Length, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyResetCodeDto {
  @ApiProperty({
    description: 'Email người dùng',
    example: 'user@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(150)
  email: string;

  @ApiProperty({
    description: 'Mã xác minh gồm 6 số',
    example: '123456',
  })
  @IsNotEmpty()
  @IsNumberString()
  @Length(6, 6)
  code: string;
}
