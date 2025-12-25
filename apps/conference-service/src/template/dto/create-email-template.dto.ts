import {
  IsString,
  IsNotEmpty,
  IsEnum,
  MaxLength,
  IsOptional,
  IsObject,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EmailTemplateType } from '../entities/email-template.entity';

export class CreateEmailTemplateDto {
  @ApiProperty({
    description: 'Tên của email template',
    example: 'Decision Accepted Email',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Loại email template',
    enum: EmailTemplateType,
    example: EmailTemplateType.DECISION_ACCEPTED,
  })
  @IsEnum(EmailTemplateType)
  type: EmailTemplateType;

  @ApiProperty({
    description: 'Tiêu đề email',
    example: 'Congratulations! Your submission has been accepted',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  subject: string;

  @ApiProperty({
    description: 'Nội dung email (có thể dùng variables như {{authorName}}, {{deadline}})',
    example: 'Dear {{authorName}},\n\nYour submission "{{submissionTitle}}" has been accepted for {{conferenceName}}.\n\nBest regards,\n{{conferenceName}} Committee',
  })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiProperty({
    description: 'Danh sách các biến có thể sử dụng trong template (optional)',
    example: {
      authorName: 'Tên tác giả',
      submissionTitle: 'Tiêu đề bài nộp',
      conferenceName: 'Tên hội nghị',
    },
    required: false,
  })
  @IsOptional()
  @IsObject()
  variables?: Record<string, string>;
}





