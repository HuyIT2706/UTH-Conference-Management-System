import { IsInt, IsNotEmpty, IsDateString, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAssignmentDto {
  @ApiProperty({
    description: 'ID của reviewer',
    example: 5,
  })
  @IsInt()
  @IsNotEmpty()
  reviewerId: number;

  @ApiProperty({
    description: 'ID của submission (UUID)',
    example: '8ccd4365-3258-4b87-8903-c48d06189ed1',
  })
  @IsString()
  @IsNotEmpty()
  submissionId: string; // UUID from submission-service

  @ApiProperty({
    description: 'ID của conference',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  conferenceId: number;

  @ApiProperty({
    description: 'Hạn nộp review (ISO 8601 format)',
    example: '2025-02-01T23:59:59.000Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  dueDate?: string;
}











