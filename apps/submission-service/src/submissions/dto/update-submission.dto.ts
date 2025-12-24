import {
  IsString,
  IsOptional,
  IsInt,
  MaxLength,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CoAuthorDto } from './create-submission.dto';

export class UpdateSubmissionDto {
  @ApiProperty({
    description: 'Tiêu đề bài báo (tùy chọn)',
    example: 'Machine Learning in Healthcare - Updated',
    maxLength: 500,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  title?: string;

  @ApiProperty({
    description: 'Tóm tắt bài báo (tùy chọn)',
    example: 'This paper presents an updated approach...',
    required: false,
  })
  @IsString()
  @IsOptional()
  abstract?: string;

  @ApiProperty({
    description: 'Từ khóa (tùy chọn)',
    example: 'machine learning, healthcare, AI, updated',
    maxLength: 500,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  keywords?: string;

  @ApiProperty({
    description: 'ID của track mới (tùy chọn)',
    example: 2,
    required: false,
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  trackId?: number;

  @ApiProperty({
    description: 'Danh sách đồng tác giả (tùy chọn)',
    type: [CoAuthorDto],
    required: false,
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CoAuthorDto)
  coAuthors?: CoAuthorDto[];
}



