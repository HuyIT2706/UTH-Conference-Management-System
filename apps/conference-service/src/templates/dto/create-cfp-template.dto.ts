import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class CreateCfpTemplateDto {
  @IsString()
  @IsNotEmpty()
  htmlContent: string;

  @IsOptional()
  @IsObject()
  customStyles?: Record<string, any>;
}

