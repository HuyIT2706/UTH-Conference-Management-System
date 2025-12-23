import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { FinalDecision } from '../entities/decision.entity';

export class CreateDecisionDto {
  @IsInt()
  @IsNotEmpty()
  submissionId: number;

  @IsEnum(FinalDecision)
  @IsNotEmpty()
  decision: FinalDecision;

  @IsString()
  @IsOptional()
  note?: string;
}



