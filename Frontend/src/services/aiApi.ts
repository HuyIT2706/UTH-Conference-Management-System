import axiosInstance from '../api/axios.js';
import { API_ENDPOINTS } from '../utils/constants.js';

export interface CheckGrammarDto {
  text: string;
  type: 'abstract' | 'title' | 'content';
  language?: string;
}

export interface GrammarCheckResponse {
  original: string;
  corrected: string;
  corrections: Array<{
    error: string;
    correction: string;
    explanation: string;
  }>;
  score: number;
}

export interface SummarizeDto {
  submissionId: number;
  title: string;
  abstract: string;
  content?: string;
}

export interface SummaryResponse {
  submissionId: number;
  summary: string;
  problem: string;
  solution: string;
  result: string;
  keywords: string[];
  createdAt: Date;
}

// Api method 
export const aiApi = {
  checkGrammar: async (data: CheckGrammarDto): Promise<GrammarCheckResponse> => {
    const response = await axiosInstance.post<GrammarCheckResponse>(API_ENDPOINTS.AI.CHECK_GRAMMAR, data);
    return response.data;
  },

  summarizeSubmission: async (data: SummarizeDto): Promise<SummaryResponse> => {
    const response = await axiosInstance.post<SummaryResponse>(API_ENDPOINTS.AI.SUMMARIZE, data);
    return response.data;
  },

  regenerateSummary: async (data: SummarizeDto): Promise<SummaryResponse> => {
    const response = await axiosInstance.post<SummaryResponse>(API_ENDPOINTS.AI.REGENERATE_SUMMARY, data);
    return response.data;
  },

  getSummary: async (submissionId: number): Promise<SummaryResponse> => {
    const response = await axiosInstance.get<SummaryResponse>(API_ENDPOINTS.AI.GET_SUMMARY(submissionId));
    return response.data;
  },
};
