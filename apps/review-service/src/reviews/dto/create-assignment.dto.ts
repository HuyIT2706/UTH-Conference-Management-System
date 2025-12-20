import { IsInt, IsNotEmpty, IsDateString, IsOptional } from 'class-validator';

export class CreateAssignmentDto {
  @IsInt()
  @IsNotEmpty()
  reviewerId: number;

  @IsInt()
  @IsNotEmpty()
  submissionId: number;

  @IsDateString()
  @IsOptional()
  dueDate?: string;
}

