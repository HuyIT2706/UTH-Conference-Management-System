import { IsDateString, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateConferenceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  venue: string;
}
