import {
  IsArray,
  IsInt,
  IsNotEmpty,
  ArrayNotEmpty,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAutoAssignmentDto {
  @ApiProperty({
    description: 'ID của submission (UUID)',
    example: '8ccd4365-3258-4b87-8903-c48d06189ed1',
  })
  @IsUUID()
  @IsNotEmpty()
  submissionId: string;

  @ApiProperty({
    description: 'ID của conference',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  conferenceId: number;

  @ApiProperty({
    description: 'Danh sách ID của reviewers',
    example: [2, 3, 4],
    type: [Number],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  reviewerIds: number[];
}
