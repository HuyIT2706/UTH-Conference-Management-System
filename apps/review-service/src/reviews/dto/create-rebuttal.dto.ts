import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateRebuttalDto {
  @IsInt()
  @IsNotEmpty()
  submissionId: number;

  @IsInt()
  @IsOptional()
  conferenceId?: number;

  @IsString()
  @IsNotEmpty()
  message: string;
}


