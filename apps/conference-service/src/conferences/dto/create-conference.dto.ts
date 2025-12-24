import { IsDateString, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateConferenceDto {
  @ApiProperty({
    description: 'Tên hội nghị',
    example: 'International UTH Conference 2025',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Ngày bắt đầu (ISO 8601)',
    example: '2025-06-01T09:00:00Z',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'Ngày kết thúc (ISO 8601)',
    example: '2025-06-03T18:00:00Z',
  })
  @IsDateString()
  endDate: string;

  @ApiProperty({
    description: 'Địa điểm tổ chức',
    example: 'HCMC University of Transport',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  venue: string;
}
