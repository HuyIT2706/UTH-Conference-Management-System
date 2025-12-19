import { IsString, IsNotEmpty, IsInt, IsOptional, MaxLength } from 'class-validator';

export class CreateSubmissionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  title: string;

  @IsString()
  @IsNotEmpty()
  abstract: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  keywords?: string;

  @IsInt()
  @IsNotEmpty()
  trackId: number;
}
