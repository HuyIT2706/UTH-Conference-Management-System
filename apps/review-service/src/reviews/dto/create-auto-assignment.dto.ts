import { IsArray, IsInt, IsNotEmpty, ArrayNotEmpty } from 'class-validator';

export class CreateAutoAssignmentDto {
  @IsInt()
  @IsNotEmpty()
  submissionId: number;

  @IsInt()
  @IsNotEmpty()
  conferenceId: number;

  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  reviewerIds: number[];
}



