import { IsString, IsOptional, IsInt, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateSubmissionDto {
  @IsString()
  @IsOptional()
  @MaxLength(500)
  title?: string;

  @IsString()
  @IsOptional()
  abstract?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  keywords?: string;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  trackId?: number;
}


