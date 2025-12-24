import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { FinalDecision } from '../entities/decision.entity';

export class CreateDecisionDto {
  @ApiProperty({
    description: 'ID của submission',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  submissionId: number;

  @ApiProperty({
    description: 'Quyết định cuối cùng',
    enum: FinalDecision,
    example: FinalDecision.ACCEPT,
  })
  @IsEnum(FinalDecision)
  @IsNotEmpty()
  decision: FinalDecision;

  @ApiProperty({
    description: 'Ghi chú về quyết định',
    example: 'Điểm trung bình cao, đồng thuận tốt giữa các reviewers.',
    required: false,
  })
  @IsString()
  @IsOptional()
  note?: string;
}





