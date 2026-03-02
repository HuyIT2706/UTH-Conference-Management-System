import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../utils/constants';
import { Mutex } from 'async-mutex';
import { tokenUtils } from '../utils/token';

const mutex = new Mutex();

const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers) => {
    const token = tokenUtils.getAccessToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  // Bỏ qua chặn 401 với các endpoint này để không bị lặp vô tận (ví dụ: login sai pass cũng trả về 401)
  const url = typeof args === 'string' ? args : args.url;
  const isAuthEndpoint = (
      url.includes('/auth/login') ||
      url.includes('/auth/logout') ||
      url.includes('/users/change-password')
  );

  await mutex.waitForUnlock();
  let result = await baseQuery(args, api, extraOptions);
  
  if (result.error && result.error.status === 401 && !isAuthEndpoint) {
    if (!mutex.isLocked()) {
      const release = await mutex.acquire(); 
      
      try {
        const refreshToken = tokenUtils.getRefreshToken(); 
        
        if (refreshToken) {
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
            const data = refreshResult.data as { accessToken: string; refreshToken?: string };
            tokenUtils.setTokens(data.accessToken, data.refreshToken || refreshToken);

            result = await baseQuery(args, api, extraOptions);
          } else {
            tokenUtils.clearTokens();
            window.dispatchEvent(new CustomEvent('auth:logout')); 
          }
        } else {
           tokenUtils.clearTokens();
           window.dispatchEvent(new CustomEvent('auth:logout'));
        }
      } finally {
        release(); 
      }
    } else {
      await mutex.waitForUnlock();
      result = await baseQuery(args, api, extraOptions);
    }
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth, 
  tagTypes: ['Conference', 'Track', 'TrackMember', 'Assignment', 'Submission', 'Review', 'User'],
  endpoints: (builder) => ({}),
});