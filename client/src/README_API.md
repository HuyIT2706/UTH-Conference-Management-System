# API Setup Documentation

## Tổng quan

Dự án đã được setup với:
- **Redux Toolkit** + **RTK Query** cho state management và API calls
- **Axios** instance với interceptors cho authentication
- **TypeScript** types đầy đủ cho tất cả API endpoints

## Cấu trúc

```
src/
├── api/
│   └── axios.ts              # Axios instance với interceptors
├── redux/
│   ├── store.ts              # Redux store configuration
│   ├── hooks.ts              # Typed hooks (useAppDispatch, useAppSelector)
│   └── api/
│       ├── apiSlice.ts       # Base RTK Query API slice
│       ├── authApi.ts        # Auth endpoints
│       ├── submissionsApi.ts # Submission endpoints
│       ├── conferencesApi.ts # Conference endpoints
│       └── reviewsApi.ts     # Review endpoints
├── types/
│   └── api.types.ts          # TypeScript types cho API
└── utils/
    ├── constants.ts          # API constants và endpoints
    ├── token.ts              # Token management utilities
    └── api-helpers.ts        # Helper functions
```

## Cấu hình

### Environment Variables

Tạo file `.env` trong thư mục `client/`:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

Mặc định sẽ sử dụng API Gateway tại `http://localhost:3000/api`

## Cách sử dụng

### 1. Sử dụng RTK Query Hooks

```tsx
import { useGetSubmissionsQuery, useCreateSubmissionMutation } from '../redux/api/submissionsApi';

function SubmissionsPage() {
  // Query hook - tự động fetch và cache
  const { data, isLoading, error } = useGetSubmissionsQuery({ page: 1, limit: 10 });
  
  // Mutation hook - cho POST/PUT/DELETE
  const [createSubmission, { isLoading: isCreating }] = useCreateSubmissionMutation();

  const handleSubmit = async (formData: FormData) => {
    try {
      const result = await createSubmission(formData).unwrap();
      console.log('Created:', result);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data?.data.map(submission => (
        <div key={submission.id}>{submission.title}</div>
      ))}
    </div>
  );
}
```

### 2. Authentication Flow

```tsx
import { useLoginMutation, useGetMeQuery } from '../redux/api/authApi';
import { tokenUtils } from '../utils/token';

function LoginPage() {
  const [login, { isLoading }] = useLoginMutation();
  const { data: user } = useGetMeQuery();

  const handleLogin = async (email: string, password: string) => {
    try {
      const result = await login({ email, password }).unwrap();
      // Tokens được tự động lưu vào localStorage bởi interceptor
      tokenUtils.setTokens(result.accessToken, result.refreshToken);
      // Redirect to dashboard
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return <div>...</div>;
}
```

### 3. File Upload (Submissions)

```tsx
import { useCreateSubmissionMutation } from '../redux/api/submissionsApi';
import { createSubmissionFormData } from '../utils/api-helpers';

function SubmitForm() {
  const [createSubmission, { isLoading }] = useCreateSubmissionMutation();

  const handleFileUpload = async (file: File, submissionData: any) => {
    const formData = createSubmissionFormData(submissionData, file);
    try {
      const result = await createSubmission(formData).unwrap();
      console.log('Submission created:', result);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return <div>...</div>;
}
```

### 4. Token Management

```tsx
import { tokenUtils } from '../utils/token';

// Check if user is authenticated
if (tokenUtils.hasToken()) {
  // User is logged in
}

// Clear tokens on logout
tokenUtils.clearTokens();
```

## API Endpoints Available

### Auth (`authApi`)
- `useLoginMutation()` - Đăng nhập
- `useRegisterMutation()` - Đăng ký
- `useGetMeQuery()` - Lấy thông tin user hiện tại
- `useLogoutMutation()` - Đăng xuất
- `useRefreshTokenMutation()` - Refresh token

### Submissions (`submissionsApi`)
- `useGetSubmissionsQuery(params)` - Lấy danh sách submissions
- `useGetMySubmissionsQuery()` - Lấy submissions của tôi
- `useGetSubmissionByIdQuery(id)` - Lấy chi tiết submission
- `useCreateSubmissionMutation()` - Tạo submission mới
- `useUpdateSubmissionMutation()` - Cập nhật submission
- `useWithdrawSubmissionMutation()` - Rút submission
- `useUpdateSubmissionStatusMutation()` - Cập nhật status (Chair/Admin)
- `useUploadCameraReadyMutation()` - Upload camera-ready
- `useGetAnonymizedReviewsQuery(id)` - Lấy reviews ẩn danh

### Conferences (`conferencesApi`)
- `useGetConferencesQuery()` - Lấy danh sách conferences
- `useGetConferenceByIdQuery(id)` - Lấy chi tiết conference
- `useGetTracksQuery(conferenceId)` - Lấy tracks của conference
- `useGetTrackByIdQuery({conferenceId, trackId})` - Lấy chi tiết track
- `useCheckDeadlineQuery({conferenceId, type})` - Kiểm tra deadline

### Reviews (`reviewsApi`)
- `useGetMyAssignmentsQuery()` - Lấy assignments của reviewer
- `useGetReviewByIdQuery(id)` - Lấy chi tiết review
- `useGetAnonymizedReviewsForSubmissionQuery(submissionId)` - Lấy reviews ẩn danh

## Features

### Auto Token Refresh
- Tự động refresh token khi access token hết hạn (401)
- Tự động retry request sau khi refresh thành công
- Redirect to login nếu refresh thất bại

### Caching
- RTK Query tự động cache responses
- Invalidate cache khi có mutations
- Tags-based cache invalidation

### Type Safety
- Tất cả API calls đều có TypeScript types
- Type-safe hooks với `useAppDispatch` và `useAppSelector`

## Lưu ý

1. **File Upload**: Sử dụng `FormData` cho file uploads, không set `Content-Type` header (browser sẽ tự set với boundary)

2. **Error Handling**: Sử dụng `unwrap()` để lấy error từ mutation, hoặc check `error` từ query hook

3. **Loading States**: Mỗi hook có `isLoading` hoặc `isFetching` state

4. **Pagination**: Query hooks hỗ trợ pagination params (`page`, `limit`)


