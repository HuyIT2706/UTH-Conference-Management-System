import {
  IsOptional,
  IsInt,
  IsString,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SubmissionStatus } from '../../entities/submission.entity';

export class QuerySubmissionsDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  trackId?: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  conferenceId?: number;

  @IsEnum(SubmissionStatus)
  @IsOptional()
  status?: SubmissionStatus;

  @IsString()
  @IsOptional()
  search?: string; // Search in title, abstract, keywords

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  authorId?: number;
}
