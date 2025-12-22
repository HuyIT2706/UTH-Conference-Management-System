import {
  IsString,
  IsNotEmpty,
  IsEnum,
  MaxLength,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FormTemplateType, FormField } from '../entities/form-template.entity';

export class FormFieldDto implements FormField {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  label: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsNotEmpty()
  required: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @IsOptional()
  validation?: Record<string, any>;
}

export class CreateFormTemplateDto {
  @IsEnum(FormTemplateType)
  type: FormTemplateType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FormFieldDto)
  fields: FormFieldDto[];

  @IsOptional()
  @IsString()
  description?: string;
}
