import {
  IsString,
  IsOptional,
  IsEnum,
  MaxLength,
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

export class UpdateFormTemplateDto {
  @IsOptional()
  @IsEnum(FormTemplateType)
  type?: FormTemplateType;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FormFieldDto)
  fields?: FormFieldDto[];

  @IsOptional()
  @IsString()
  description?: string;
}
