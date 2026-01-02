import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../../utils/constants';

const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
  let result = await baseQuery(args, api, extraOptions);

  
  const isLoginRequest = typeof args === 'object' && args.url === '/auth/login';
  
  if (result.error && result.error.status === 401 && !isLoginRequest) {
    const refreshToken = sessionStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        const refreshResult = await baseQuery(
          {
            url: '/auth/refresh-token',
            method: 'POST',
            body: { refreshToken },
          },
          api,
          extraOptions
        );

        if (refreshResult.data) {
          const { accessToken, refreshToken: newRefreshToken } = refreshResult.data as {
            accessToken: string;
            refreshToken: string;
          };
          localStorage.setItem('accessToken', accessToken);
          sessionStorage.setItem('refreshToken', newRefreshToken);

          result = await baseQuery(args, api, extraOptions);
        } else {
          // Refresh failed, clear tokens
          localStorage.removeItem('accessToken');
          sessionStorage.removeItem('refreshToken');
          // Dispatch event to trigger navigation without reload
          window.dispatchEvent(new CustomEvent('auth:logout'));
        }
      } catch (error) {
        localStorage.removeItem('accessToken');
        sessionStorage.removeItem('refreshToken');
        // Dispatch event to trigger navigation without reload
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }
    } else {
      localStorage.removeItem('accessToken');
      // Dispatch event to trigger navigation without reload
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'User',
    'Conference',
    'Track',
    'Submission',
    'Review',
    'Assignment',
  ],
  endpoints: () => ({}),
});

