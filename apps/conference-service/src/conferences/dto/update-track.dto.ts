import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateTrackDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;
}
