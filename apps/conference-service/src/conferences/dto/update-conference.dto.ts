import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateConferenceDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  venue?: string;
}



