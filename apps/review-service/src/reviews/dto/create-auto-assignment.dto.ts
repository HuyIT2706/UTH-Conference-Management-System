import { IsArray, IsInt, IsNotEmpty, ArrayNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAutoAssignmentDto {
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
    description: 'Danh sách ID của reviewers',
    example: [2, 3, 4],
    type: [Number],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  reviewerIds: number[];
}






