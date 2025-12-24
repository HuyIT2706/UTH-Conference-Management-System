import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { RoleName } from '../entities/role.entity';

export class UpdateUserRolesDto {
  @ApiProperty({
    description: 'Role mới của user (chỉ 1 role)',
    enum: RoleName,
    example: RoleName.CHAIR,
  })
  @IsEnum(RoleName)
  role: RoleName;
}

