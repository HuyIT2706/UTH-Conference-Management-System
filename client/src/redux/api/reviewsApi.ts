import { apiSlice } from './apiSlice';
import type {
  Review,
  ReviewAssignment,
  Submission,
  ApiResponse,
} from '../../types/api.types';

export const reviewsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get my review assignments
    getMyAssignments: builder.query<ApiResponse<ReviewAssignment[]>, void>({
      query: () => '/reviews/assignments/me',
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Assignment' as const, id })),
              { type: 'Assignment', id: 'MY_LIST' },
            ]
          : [{ type: 'Assignment', id: 'MY_LIST' }],
    }),
    // Accept assignment
    acceptAssignment: builder.mutation<ApiResponse<ReviewAssignment>, number>({
      query: (assignmentId) => ({
        url: `/reviews/assignments/${assignmentId}/accept`,
        method: 'PUT',
      }),
      invalidatesTags: (_result, _error, assignmentId) => [
        { type: 'Assignment', id: assignmentId },
        { type: 'Assignment', id: 'MY_LIST' },
      ],
    }),
    // Reject assignment
    rejectAssignment: builder.mutation<ApiResponse<ReviewAssignment>, number>({
      query: (assignmentId) => ({
        url: `/reviews/assignments/${assignmentId}/reject`,
        method: 'PUT',
      }),
      invalidatesTags: (_result, _error, assignmentId) => [
        { type: 'Assignment', id: assignmentId },
        { type: 'Assignment', id: 'MY_LIST' },
      ],
    }),
    // Self-assign submission (reviewer assigns to themselves)
    selfAssignSubmission: builder.mutation<
      ApiResponse<ReviewAssignment>,
      { submissionId: string; conferenceId: number }
    >({
      query: (body) => ({
        url: '/reviews/assignments/self',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'Assignment', id: 'MY_LIST' },
        { type: 'Submission', id: 'REVIEWER_ACCEPTED_TRACKS' },
      ],
    }),
    // Create review
    createReview: builder.mutation<
      ApiResponse<Review>,
      {
        assignmentId: number;
        score: number;
        confidence: 'LOW' | 'MEDIUM' | 'HIGH';
        commentForAuthor: string;
        commentForPC?: string;
        recommendation: 'ACCEPT' | 'WEAK_ACCEPT' | 'REJECT' | 'WEAK_REJECT';
      }
    >({
      query: (body) => ({
        url: '/reviews',
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { assignmentId }) => [
        { type: 'Review', id: `assignment-${assignmentId}` },
        { type: 'Assignment', id: assignmentId },
        { type: 'Assignment', id: 'MY_LIST' },
      ],
    }),
    // Get reviews for a submission
    getReviewsForSubmission: builder.query<ApiResponse<Review[]>, string>({
      query: (submissionId) => `/reviews/submission/${submissionId}`,
      providesTags: (_result, _error, submissionId) => [
        { type: 'Review', id: `submission-${submissionId}` },
      ],
    }),
    // Get review by ID
    getReviewById: builder.query<ApiResponse<Review>, number>({
      query: (id) => `/reviews/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Review', id }],
    }),
    // Get anonymized reviews for a submission (for authors)
    getAnonymizedReviewsForSubmission: builder.query<
      ApiResponse<Array<{ score: number; commentForAuthor: string; recommendation: string }>>,
      string
    >({
      query: (submissionId) => `/reviews/submission/${submissionId}/anonymized`,
      providesTags: (_result, _error, submissionId) => [
        { type: 'Review', id: `submission-${submissionId}` },
      ],
    }),
    // Get submissions for reviewer in accepted tracks
    getSubmissionsForReviewer: builder.query<
      ApiResponse<Submission[]>,
      { status?: string[] } | void
    >({
      query: (params) => {
        // Convert status array to query string format: status=SUBMITTED&status=REVIEWING
        const queryParams: Record<string, string | string[]> = {};
        if (params?.status && Array.isArray(params.status) && params.status.length > 0) {
          queryParams.status = params.status;
        }
        
        return {
          url: '/reviews/submissions/accepted-tracks',
          params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
        };
      },
      providesTags: [{ type: 'Submission', id: 'REVIEWER_ACCEPTED_TRACKS' }],
    }),
  }),
});

export const {
  useGetMyAssignmentsQuery,
  useAcceptAssignmentMutation,
  useRejectAssignmentMutation,
  useSelfAssignSubmissionMutation,
  useCreateReviewMutation,
  useGetReviewsForSubmissionQuery,
  useGetReviewByIdQuery,
  useGetAnonymizedReviewsForSubmissionQuery,
  useGetSubmissionsForReviewerQuery,
} = reviewsApi;

