import { IsEnum, IsInt, IsNotEmpty, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ConferenceMemberRole } from '../entities/conference-member.entity';
import { Type } from 'class-transformer';

export class AddConferenceMemberDto {
  @ApiProperty({
    description: 'ID của người dùng cần thêm vào hội nghị',
    example: 5,
  })
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  userId: number;

  @ApiProperty({
    description: 'Vai trò của thành viên trong hội nghị',
    enum: ConferenceMemberRole,
    example: ConferenceMemberRole.PC_MEMBER,
  })
  @IsEnum(ConferenceMemberRole)
  @IsNotEmpty()
  role: ConferenceMemberRole;
}
