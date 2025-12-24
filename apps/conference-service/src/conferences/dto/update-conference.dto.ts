import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateConferenceDto {
  @ApiProperty({
    description: 'Tên hội nghị',
    example: 'International UTH Conference 2025 Updated',
    maxLength: 255,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @ApiProperty({
    description: 'Ngày bắt đầu (ISO 8601)',
    example: '2025-06-01T09:00:00Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({
    description: 'Ngày kết thúc (ISO 8601)',
    example: '2025-06-03T18:00:00Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({
    description: 'Địa điểm tổ chức',
    example: 'HCMC University of Transport - Main Campus',
    maxLength: 255,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  venue?: string;
}




