import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsOptional,
  MaxLength,
  IsArray,
  ValidateNested,
  IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CoAuthorDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  affiliation?: string;
}

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

  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  trackId: number;

  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  conferenceId: number;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CoAuthorDto)
  coAuthors?: CoAuthorDto[];
}



