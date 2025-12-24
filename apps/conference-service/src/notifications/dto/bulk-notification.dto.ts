import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsObject,
  IsInt,
  Min,
} from 'class-validator';

export enum RecipientType {
  PC_MEMBERS = 'PC_MEMBERS',
  AUTHORS = 'AUTHORS',
  REVIEWERS = 'REVIEWERS',
  CHAIRS = 'CHAIRS',
}

export class BulkNotificationDto {
  @IsEnum(RecipientType)
  recipientType: RecipientType;

  @IsOptional()
  @IsInt()
  @Min(1)
  templateId?: number;

  @IsOptional()
  @IsObject()
  variables?: Record<string, string>;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  subject?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  body?: string;
}



