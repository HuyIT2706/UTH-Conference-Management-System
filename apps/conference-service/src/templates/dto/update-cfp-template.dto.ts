import { IsString, IsOptional, IsObject } from 'class-validator';

export class UpdateCfpTemplateDto {
  @IsOptional()
  @IsString()
  htmlContent?: string;

  @IsOptional()
  @IsObject()
  customStyles?: Record<string, any>;
}
