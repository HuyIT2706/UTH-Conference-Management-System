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

const GEMINI_MODEL = 'gemini-2.5-flash-lite';
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly geminiApiKey: string;
  private readonly apiUrl: string;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(SubmissionSummary)
    private readonly summaryRepository: Repository<SubmissionSummary>,
  ) {
    this.geminiApiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
    
    this.apiUrl = `${GEMINI_BASE_URL}/${GEMINI_MODEL}:generateContent?key=${this.geminiApiKey}`;

    if (!this.geminiApiKey) {
      this.logger.warn(' GEMINI_API_KEY is missing in .env');
    }
  }
  // Api check lỗi chính tả
  async checkGrammar(dto: CheckGrammarDto): Promise<GrammarCheckResponse> {
    const prompt = this.generateGrammarPrompt(dto);
    return this.processGeminiRequest<GrammarCheckResponse>(prompt, {
      original: dto.text,
      corrected: dto.text,
      corrections: [],
      score: 100,
    });
  }

  /**
   * Tính năng 2: Tóm tắt bài báo 
   */
  async summarizeSubmission(dto: SummarizeDto): Promise<SummaryResponse> {
    // Check bài nộp
    const existing = await this.summaryRepository.findOne({ where: { submissionId: dto.submissionId } });
    if (existing) return this.mapEntityToResponse(existing);
    // Gọi Promt 
    const prompt = this.generateSummaryPrompt(dto);
    const parsedResult = await this.processGeminiRequest<any>(prompt, null);
    // Lưu vào DB 
    try {
      const summary = this.summaryRepository.create({
        submissionId: dto.submissionId,
        ...parsedResult,
      });
      const saved = await this.summaryRepository.save(summary);
      return this.mapEntityToResponse(Array.isArray(saved) ? saved[0] : saved);
    } catch (error) {
      this.logger.error('Database save failed:', error);
      throw new HttpException('Failed to save summary', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Regenerate: Xóa cũ tạo mới
   */
  async regenerateSummary(dto: SummarizeDto): Promise<SummaryResponse> {
    await this.summaryRepository.delete({ submissionId: dto.submissionId });
    return this.summarizeSubmission(dto); // Tái sử dụng logic của hàm trên
  }

  async getSummary(submissionId: number): Promise<SummaryResponse | null> {
    const summary = await this.summaryRepository.findOne({ where: { submissionId } });
    return summary ? this.mapEntityToResponse(summary) : null;
  }

  /**
   * @param prompt 
   * @param fallbackValue 
   */
  private async processGeminiRequest<T>(prompt: string, fallbackValue: T | null): Promise<T> {
    try {
      const jsonText = await this.callGeminiApi(prompt);
      return this.parseJsonFromText<T>(jsonText);
    } catch (error) {
      this.logger.error(`AI Task Failed: ${error.message}`);
      if (fallbackValue) return fallbackValue; 
      
      throw new HttpException(
        'AI Service is currently unavailable. Please try again.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Gửi Request HTTP raw (Dùng fetch)
   */
  private async callGeminiApi(prompt: string): Promise<string> {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3, 
          responseMimeType: "application/json" 
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini Error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) throw new Error('Empty response from Gemini');
    return text;
  }

  /**
   * Clean và Parse JSON an toàn
   */
  private parseJsonFromText<T>(text: string): T {
    try {
      const cleanText = text.replace(/```json|```/g, '').trim();
      return JSON.parse(cleanText) as T;
    } catch (error) {
      this.logger.error('JSON Parse Failed:', text);
      throw new Error('Invalid JSON format from AI');
    }
  }


  private generateGrammarPrompt(dto: CheckGrammarDto): string {
    const typeMap = {
      abstract: 'academic paper abstract',
      title: 'academic paper title',
      content: 'academic paper content',
    };

    return `
      Role: Expert Academic Editor.
      Task: Check grammar, spelling, and punctuation for the following ${typeMap[dto.type] || 'text'}.
      
      Requirements:
      1. Output MUST be valid JSON only. No markdown.
      2. Format: { "corrected": "...", "corrections": [{"error": "...", "correction": "...", "explanation": "..."}], "score": 0-100 }
      3. If perfect, "corrections" is empty and "score" is 100.

      Text to check:
      """${dto.text}"""
    `;
  }

  private generateSummaryPrompt(dto: SummarizeDto): string {
    const safeContent = dto.content ? dto.content.substring(0, 8000) : 'No content provided';

    return `
      Role: Expert Academic Reviewer.
      Task: Summarize this submission.
      
      Title: ${dto.title}
      Abstract: ${dto.abstract}
      Content Snippet: ${safeContent}

      Requirements:
      1. Output MUST be valid JSON only.
      2. Format: { 
         "summary": "2-3 sentences overview", 
         "problem": "Research question (1-2 sentences)", 
         "solution": "Methodology (1-2 sentences)", 
         "result": "Key findings (1-2 sentences)", 
         "keywords": ["tag1", "tag2", "tag3", "tag4", "tag5"] 
      }
    `;
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