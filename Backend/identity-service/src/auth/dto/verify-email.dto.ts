import { IsNumberString, Length, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @ApiProperty({
    description: 'Mã xác minh OTP gồm 6 chữ số',
    example: '123456',
  })
  @IsNotEmpty()
  @IsNumberString({}, { message: 'Mã xác minh phải là một dãy số' })
  @Length(6, 6, { message: 'Mã xác minh phải bao gồm chính xác 6 ký tự' })
  token: string;
}
