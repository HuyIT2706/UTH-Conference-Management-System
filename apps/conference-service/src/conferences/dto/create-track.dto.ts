import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateTrackDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;
}



