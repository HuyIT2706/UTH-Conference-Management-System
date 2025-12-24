import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsOptional,
  MaxLength,
  IsArray,
  ValidateNested,
  IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CoAuthorDto {
  @ApiProperty({
    description: 'Tên đồng tác giả',
    example: 'Nguyễn Văn B',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Email đồng tác giả',
    example: 'coauthor@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Tổ chức/đơn vị của đồng tác giả',
    example: 'University of Technology',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  affiliation?: string;
}

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



