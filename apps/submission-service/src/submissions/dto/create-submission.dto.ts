import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubmissionDto {
  @ApiProperty({
    description: 'Tiêu đề bài báo',
    example: 'Machine Learning in Healthcare',
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  title: string;

  @ApiProperty({
    description: 'Tóm tắt bài báo',
    example: 'This paper presents a novel approach to...',
  })
  @IsString()
  @IsNotEmpty()
  abstract: string;

  @ApiProperty({
    description: 'Từ khóa (tùy chọn)',
    example: 'machine learning, healthcare, AI',
    maxLength: 500,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  keywords?: string;

  @ApiProperty({
    description: 'ID của track',
    example: 1,
  })
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  trackId: number;

  @ApiProperty({
    description: 'ID của conference',
    example: 1,
  })
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  conferenceId: number;
}



