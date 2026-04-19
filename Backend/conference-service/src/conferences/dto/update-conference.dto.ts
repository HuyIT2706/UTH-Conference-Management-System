import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateConferenceDto {
  @ApiProperty({
    description: 'Tên hội nghị',
    example: 'International UTH Conference 2025 Updated',
    maxLength: 255,
    required: false,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @MaxLength(255)
  name?: string;

  @ApiProperty({
    description: 'Ngày bắt đầu của hội nghị (ISO 8601)',
    example: '2025-06-01T09:00:00Z',
    required: false,
    format: 'date-time',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({
    description: 'Ngày kết thúc của hội nghị (ISO 8601)',
    example: '2025-06-03T18:00:00Z',
    required: false,
    format: 'date-time',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({
    description: 'Địa điểm tổ chức hội nghị',
    example: 'HCMC University of Transport - Main Campus',
    maxLength: 255,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  venue?: string;

  @ApiProperty({
    description: 'Mô tả chi tiết hiển thị trên trang hội nghị',
    example: 'Hội nghị quốc tế về giao thông và logistics do UTH tổ chức.',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Mô tả ngắn hiển thị trên CFP và danh sách hội nghị (tối đa 500 ký tự)',
    example: 'Hội nghị thường niên về nghiên cứu giao thông, logistics và công nghệ ứng dụng.',
    maxLength: 500,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  shortDescription?: string;

  @ApiProperty({
    description: 'Email liên hệ của ban tổ chức hội nghị',
    example: 'conference@uth.edu.vn',
    format: 'email',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  @MaxLength(255)
  contactEmail?: string;
}
