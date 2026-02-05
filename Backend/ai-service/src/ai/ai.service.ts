import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubmissionSummary } from './entities/submission-summary.entity';
import {
  CheckGrammarDto,
  GrammarCheckResponse,
  SummarizeDto,
  SummaryResponse,
} from './dto';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly geminiApiKey: string;
  private readonly geminiApiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(SubmissionSummary)
    private readonly summaryRepository: Repository<SubmissionSummary>,
  ) {
    this.geminiApiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
    if (!this.geminiApiKey) {
      this.logger.warn('GEMINI_API_KEY is not configured!');
    }
  }

  /**
   * Check grammar and spelling errors using Google Gemini
   */
  async checkGrammar(dto: CheckGrammarDto): Promise<GrammarCheckResponse> {
    const prompt = this.buildGrammarPrompt(dto);

    try {
      const response = await this.callGemini(prompt);
      return this.parseGrammarResponse(dto.text, response);
    } catch (error) {
      this.logger.error('Grammar check failed:', error);
      throw new HttpException(
        'Failed to check grammar. Please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Summarize submission using Google Gemini
   */
  async summarizeSubmission(dto: SummarizeDto): Promise<SummaryResponse> {
    // Check if summary already exists
    const existing = await this.summaryRepository.findOne({
      where: { submissionId: dto.submissionId },
    });

    if (existing) {
      return this.mapEntityToResponse(existing);
    }

    const prompt = this.buildSummaryPrompt(dto);

    try {
      const response = await this.callGemini(prompt);
      const parsed = this.parseSummaryResponse(response);

      // Save to database
      const summary = this.summaryRepository.create({
        submissionId: dto.submissionId,
        ...parsed,
      });
      const saved = await this.summaryRepository.save(summary);

      return this.mapEntityToResponse(saved);
    } catch (error) {
      this.logger.error('Summarization failed:', error);
      throw new HttpException(
        'Failed to summarize submission. Please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get existing summary by submission ID
   */
  async getSummary(submissionId: number): Promise<SummaryResponse | null> {
    const summary = await this.summaryRepository.findOne({
      where: { submissionId },
    });

    if (!summary) {
      return null;
    }

    return this.mapEntityToResponse(summary);
  }

  /**
   * Regenerate summary for a submission
   */
  async regenerateSummary(dto: SummarizeDto): Promise<SummaryResponse> {
    // Delete existing summary
    await this.summaryRepository.delete({ submissionId: dto.submissionId });

    // Generate new summary
    const prompt = this.buildSummaryPrompt(dto);
    const response = await this.callGemini(prompt);
    const parsed = this.parseSummaryResponse(response);

    const summary = this.summaryRepository.create({
      submissionId: dto.submissionId,
      ...parsed,
    });
    const saved = await this.summaryRepository.save(summary);

    return this.mapEntityToResponse(saved);
  }

  // ==================== Private Methods ====================

  private async callGemini(prompt: string): Promise<string> {
    if (!this.geminiApiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const url = `${this.geminiApiUrl}?key=${this.geminiApiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error('Gemini API error:', error);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  private buildGrammarPrompt(dto: CheckGrammarDto): string {
    const typeContext = {
      abstract: 'academic paper abstract',
      title: 'academic paper title',
      content: 'academic paper content',
    };

    return `You are an expert academic editor. Please check the following ${typeContext[dto.type]} for grammar, spelling, and punctuation errors.

TEXT TO CHECK:
"""
${dto.text}
"""

Please respond in the following JSON format ONLY (no markdown, no explanation outside JSON):
{
  "corrected": "The corrected text with all errors fixed",
  "corrections": [
    {
      "error": "the original error text",
      "correction": "the corrected version",
      "explanation": "brief explanation of why this is wrong"
    }
  ],
  "score": 85
}

The score should be 0-100 based on the overall quality (100 = perfect, no errors).
If there are no errors, return the original text as corrected with an empty corrections array and score 100.`;
  }

  private buildSummaryPrompt(dto: SummarizeDto): string {
    return `You are an expert academic reviewer. Please summarize the following academic submission.

TITLE: ${dto.title}

ABSTRACT:
${dto.abstract}

${dto.content ? `CONTENT:\n${dto.content.substring(0, 5000)}` : ''}

Please respond in the following JSON format ONLY (no markdown, no explanation outside JSON):
{
  "summary": "A comprehensive 2-3 sentence summary of the paper",
  "problem": "The main problem or research question addressed (1-2 sentences)",
  "solution": "The proposed solution, methodology, or approach (1-2 sentences)",
  "result": "The key findings, results, or contributions (1-2 sentences)",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}`;
  }

  private parseGrammarResponse(
    originalText: string,
    response: string,
  ): GrammarCheckResponse {
    try {
      // Remove potential markdown code blocks
      const cleanResponse = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const parsed = JSON.parse(cleanResponse);

      return {
        original: originalText,
        corrected: parsed.corrected || originalText,
        corrections: parsed.corrections || [],
        score: parsed.score || 100,
      };
    } catch (error) {
      this.logger.error('Failed to parse grammar response:', error);
      // Return a safe default
      return {
        original: originalText,
        corrected: originalText,
        corrections: [],
        score: 100,
      };
    }
  }

  private parseSummaryResponse(response: string): {
    summary: string;
    problem: string;
    solution: string;
    result: string;
    keywords: string[];
  } {
    try {
      // Remove potential markdown code blocks
      const cleanResponse = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const parsed = JSON.parse(cleanResponse);

      return {
        summary: parsed.summary || 'Summary not available',
        problem: parsed.problem || 'Problem not identified',
        solution: parsed.solution || 'Solution not identified',
        result: parsed.result || 'Results not available',
        keywords: parsed.keywords || [],
      };
    } catch (error) {
      this.logger.error('Failed to parse summary response:', error);
      return {
        summary: 'Failed to generate summary',
        problem: 'Unable to identify problem',
        solution: 'Unable to identify solution',
        result: 'Unable to identify results',
        keywords: [],
      };
    }
  }

  private mapEntityToResponse(entity: SubmissionSummary): SummaryResponse {
    return {
      submissionId: entity.submissionId,
      summary: entity.summary,
      problem: entity.problem,
      solution: entity.solution,
      result: entity.result,
      keywords: entity.keywords || [],
      createdAt: entity.createdAt,
    };
  }
}
