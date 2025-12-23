import { IsEnum, IsOptional, IsString } from 'class-validator';
import { SubmissionStatus } from '../../entities/submission.entity';

export class UpdateStatusDto {
  @IsEnum(SubmissionStatus)
  status: SubmissionStatus;

  @IsString()
  @IsOptional()
  decisionNote?: string;
}
