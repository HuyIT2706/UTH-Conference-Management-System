import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AiService } from './ai.service';
import {
  CheckGrammarDto,
  GrammarCheckResponse,
  SummarizeDto,
  SummaryResponse,
} from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('AI')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('check-grammar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Check grammar and spelling',
    description: 'Check text for grammar, spelling, and punctuation errors using AI',
  })
  @ApiResponse({
    status: 200,
    description: 'Grammar check completed successfully',
    type: GrammarCheckResponse,
  })
  async checkGrammar(
    @Body() dto: CheckGrammarDto,
  ): Promise<GrammarCheckResponse> {
    return this.aiService.checkGrammar(dto);
  }

  @Post('summarize')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Summarize a submission',
    description: 'Generate an AI summary for a paper submission (Problem, Solution, Result)',
  })
  @ApiResponse({
    status: 200,
    description: 'Summary generated successfully',
    type: SummaryResponse,
  })
  async summarize(@Body() dto: SummarizeDto): Promise<SummaryResponse> {
    return this.aiService.summarizeSubmission(dto);
  }

  @Post('summarize/regenerate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Regenerate submission summary',
    description: 'Force regenerate the AI summary for a submission',
  })
  @ApiResponse({
    status: 200,
    description: 'Summary regenerated successfully',
    type: SummaryResponse,
  })
  async regenerateSummary(@Body() dto: SummarizeDto): Promise<SummaryResponse> {
    return this.aiService.regenerateSummary(dto);
  }

  @Get('summaries/:submissionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get submission summary',
    description: 'Get the AI-generated summary for a specific submission',
  })
  @ApiResponse({
    status: 200,
    description: 'Summary retrieved successfully',
    type: SummaryResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'Summary not found',
  })
  async getSummary(
    @Param('submissionId', ParseIntPipe) submissionId: number,
  ): Promise<SummaryResponse> {
    const summary = await this.aiService.getSummary(submissionId);
    if (!summary) {
      throw new NotFoundException(
        `Summary for submission ${submissionId} not found`,
      );
    }
    return summary;
  }
}
