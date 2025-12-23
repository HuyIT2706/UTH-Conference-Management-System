import { IsEnum, IsInt, IsNotEmpty } from 'class-validator';
import { ConferenceMemberRole } from '../entities/conference-member.entity';
import { Type } from 'class-transformer';

export class AddConferenceMemberDto {
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  userId: number;

  @IsEnum(ConferenceMemberRole)
  @IsNotEmpty()
  role: ConferenceMemberRole;
}

