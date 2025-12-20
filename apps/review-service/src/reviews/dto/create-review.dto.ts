import {
  IsInt,
  IsNotEmpty,
  IsEnum,
  IsString,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import {
  ConfidenceLevel,
  RecommendationType,
} from '../entities/review.entity';

export class CreateReviewDto {
  @IsInt()
  @IsNotEmpty()
  assignmentId: number;

  @IsInt()
  @IsNotEmpty()
  @Min(0)
  @Max(100)
  score: number;

  @IsEnum(ConfidenceLevel)
  @IsNotEmpty()
  confidence: ConfidenceLevel;

  @IsString()
  @IsOptional()
  commentForAuthor?: string;

  @IsString()
  @IsOptional()
  commentForPC?: string;

  @IsEnum(RecommendationType)
  @IsNotEmpty()
  recommendation: RecommendationType;
}

