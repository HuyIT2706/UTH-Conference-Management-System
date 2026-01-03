import { IsInt, IsNotEmpty, IsDateString, IsOptional } from 'class-validator';
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
    description: 'ID của submission',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  submissionId: number;

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











