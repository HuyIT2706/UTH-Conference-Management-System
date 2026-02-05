import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SummarizeDto {
  @ApiProperty({
    description: 'Submission ID to summarize',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  submissionId: number;

  @ApiProperty({
    description: 'Title of the submission',
    example: 'Machine Learning Approach for Climate Change Prediction',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Abstract of the submission',
    example: 'This paper presents a novel machine learning approach...',
  })
  @IsString()
  @IsNotEmpty()
  abstract: string;

  @ApiProperty({
    description: 'Full content/body of the submission (optional)',
    required: false,
  })
  @IsString()
  @IsOptional()
  content?: string;
}

export class SummaryResponse {
  @ApiProperty({ description: 'Submission ID' })
  submissionId: number;

  @ApiProperty({ description: 'Full summary text' })
  summary: string;

  @ApiProperty({ description: 'Problem/Issue addressed' })
  problem: string;

  @ApiProperty({ description: 'Proposed solution/method' })
  solution: string;

  @ApiProperty({ description: 'Results/Conclusion' })
  result: string;

  @ApiProperty({ description: 'Keywords extracted' })
  keywords: string[];

  @ApiProperty({ description: 'Timestamp when created' })
  createdAt: Date;
}
