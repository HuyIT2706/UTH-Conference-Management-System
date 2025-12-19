import { IsString, IsOptional, IsInt, MaxLength } from 'class-validator';

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

  @IsInt()
  @IsOptional()
  trackId?: number;
}
