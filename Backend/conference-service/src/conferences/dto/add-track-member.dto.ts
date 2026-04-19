import { IsInt, IsNotEmpty, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class AddTrackMemberDto {
  @ApiProperty({
    description: 'ID của người dùng cần thêm vào track',
    example: 5,
  })
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  userId: number;
}
