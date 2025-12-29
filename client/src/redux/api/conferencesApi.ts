import { apiSlice } from './apiSlice';
import type {
  Conference,
  Track,
  ApiResponse,
} from '../../types/api.types';

export const conferencesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get all conferences
    getConferences: builder.query<ApiResponse<Conference[]>, void>({
      query: () => '/conferences',
      providesTags: (result) =>
        result?.data && Array.isArray(result.data)
          ? [
              ...result.data.map(({ id }) => ({ type: 'Conference' as const, id })),
              { type: 'Conference', id: 'LIST' },
            ]
          : [{ type: 'Conference', id: 'LIST' }],
    }),
    // Get conference by ID
    getConferenceById: builder.query<ApiResponse<Conference>, number>({
      query: (id) => `/conferences/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Conference', id }],
    }),
    // Get tracks for a conference
    getTracks: builder.query<ApiResponse<Track[]>, number>({
      query: (conferenceId) => `/conferences/${conferenceId}/tracks`,
      providesTags: (result, _error, conferenceId) =>
        result?.data && Array.isArray(result.data)
          ? [
              ...result.data.map(({ id }) => ({ type: 'Track' as const, id })),
              { type: 'Track', id: `conference-${conferenceId}` },
            ]
          : [{ type: 'Track', id: `conference-${conferenceId}` }],
    }),
    // Get track by ID
    getTrackById: builder.query<
      ApiResponse<Track>,
      { conferenceId: number; trackId: number }
    >({
      query: ({ conferenceId, trackId }) =>
        `/conferences/${conferenceId}/tracks/${trackId}`,
      providesTags: (_result, _error, { trackId }) => [{ type: 'Track', id: trackId }],
    }),
    // Check deadline
    checkDeadline: builder.query<
      { valid: boolean; deadline?: string; message: string },
      { conferenceId: number; type: 'submission' | 'review' | 'notification' | 'camera-ready' }
    >({
      query: ({ conferenceId, type }) => ({
        url: `/conferences/${conferenceId}/cfp/check-deadline`,
        params: { type },
      }),
    }),
    // Create conference
    createConference: builder.mutation<
      ApiResponse<Conference>,
      {
        name: string;
        startDate: string;
        endDate: string;
        venue: string;
        description?: string;
        shortDescription?: string;
        contactEmail?: string;
      }
    >({
      query: (body) => ({
        url: '/conferences',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Conference', id: 'LIST' }],
    }),
    // Update conference
    updateConference: builder.mutation<
      ApiResponse<Conference>,
      {
        id: number;
        name?: string;
        startDate?: string;
        endDate?: string;
        venue?: string;
        description?: string;
        shortDescription?: string;
        contactEmail?: string;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/conferences/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Conference', id },
        { type: 'Conference', id: 'LIST' },
      ],
    }),
    // Set CFP settings
    setCfpSettings: builder.mutation<
      ApiResponse<any>,
      {
        conferenceId: number;
        submissionDeadline: string;
        reviewDeadline: string;
        notificationDate: string;
        cameraReadyDeadline: string;
      }
    >({
      query: ({ conferenceId, ...body }) => ({
        url: `/conferences/${conferenceId}/cfp`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { conferenceId }) => [
        { type: 'Conference', id: conferenceId },
      ],
    }),
  }),
});

export const {
  useGetConferencesQuery,
  useGetConferenceByIdQuery,
  useGetTracksQuery,
  useGetTrackByIdQuery,
  useCheckDeadlineQuery,
  useCreateConferenceMutation,
  useUpdateConferenceMutation,
  useSetCfpSettingsMutation,
} = conferencesApi;

