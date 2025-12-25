import {
  IsString,
  IsOptional,
  IsEnum,
  MaxLength,
  IsObject,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EmailTemplateType } from '../entities/email-template.entity';

export class UpdateEmailTemplateDto {
  @ApiProperty({
    description: 'Tên của email template',
    example: 'Decision Accepted Email (Updated)',
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiProperty({
    description: 'Loại email template',
    enum: EmailTemplateType,
    example: EmailTemplateType.DECISION_ACCEPTED,
    required: false,
  })
  @IsOptional()
  @IsEnum(EmailTemplateType)
  type?: EmailTemplateType;

  @ApiProperty({
    description: 'Tiêu đề email',
    example: 'Congratulations! Your submission has been accepted',
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  subject?: string;

  @ApiProperty({
    description: 'Nội dung email',
    example: 'Dear {{authorName}},\n\nYour submission has been accepted...',
    required: false,
  })
  @IsOptional()
  @IsString()
  body?: string;

  @ApiProperty({
    description: 'Danh sách các biến có thể sử dụng trong template',
    example: {
      authorName: 'Tên tác giả',
      submissionTitle: 'Tiêu đề bài nộp',
    },
    required: false,
  })
  @IsOptional()
  @IsObject()
  variables?: Record<string, string>;
}





