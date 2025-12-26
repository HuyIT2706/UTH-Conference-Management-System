import type { ApiError } from '../types/api.types';

/**
 * Format API error message for display
 */
export const formatApiError = (error: unknown): string => {
  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    const apiError = error as ApiError;
    return apiError.message || 'An error occurred';
  }

  return 'An unexpected error occurred';
};

/**
 * Check if error is an API error
 */
export const isApiError = (error: unknown): error is ApiError => {
  return (
    error !== null &&
    typeof error === 'object' &&
    'statusCode' in error &&
    'message' in error
  );
};

/**
 * Create FormData for file upload with submission data
 */
export const createSubmissionFormData = (
  data: {
    title: string;
    abstract: string;
    keywords?: string;
    trackId: number;
    conferenceId: number;
  },
  file: File
): FormData => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', data.title);
  formData.append('abstract', data.abstract);
  if (data.keywords) {
    formData.append('keywords', data.keywords);
  }
  formData.append('trackId', data.trackId.toString());
  formData.append('conferenceId', data.conferenceId.toString());
  return formData;
};

