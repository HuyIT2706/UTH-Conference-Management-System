import {
  IsString,
  IsOptional,
  IsInt,
  MaxLength,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CoAuthorDto } from './create-submission.dto';

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

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CoAuthorDto)
  coAuthors?: CoAuthorDto[];
}



