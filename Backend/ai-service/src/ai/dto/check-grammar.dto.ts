import { IsString, IsNotEmpty, IsIn, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckGrammarDto {
  @ApiProperty({
    description: 'Text to check for grammar and spelling errors',
    example: 'This is an exampel of bad grammer that need to be fix.',
  })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({
    description: 'Type of text being checked',
    enum: ['abstract', 'title', 'content'],
    example: 'abstract',
  })
  @IsString()
  @IsIn(['abstract', 'title', 'content'])
  type: 'abstract' | 'title' | 'content';

  @ApiProperty({
    description: 'Language of the text (default: auto-detect)',
    example: 'en',
    required: false,
  })
  @IsString()
  @IsOptional()
  language?: string;
}

export class GrammarCheckResponse {
  @ApiProperty({ description: 'Original text' })
  original: string;

  @ApiProperty({ description: 'Corrected text' })
  corrected: string;

  @ApiProperty({
    description: 'List of corrections with explanations',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        error: { type: 'string' },
        correction: { type: 'string' },
        explanation: { type: 'string' },
      },
    },
  })
  corrections: Array<{
    error: string;
    correction: string;
    explanation: string;
  }>;

  @ApiProperty({ description: 'Overall quality score (0-100)' })
  score: number;
}
