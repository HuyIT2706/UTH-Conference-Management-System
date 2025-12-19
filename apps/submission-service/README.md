# Submission Service

Service quản lý Submission (Bài nộp) trong hệ thống UTH-CONFMS với Supabase Storage.

- `src/submissions`
  - `submissions.controller.ts` – REST API cho Submissions
  - `submissions.service.ts` – Business logic & làm việc với DB (TypeORM Repository)
  - `dto/create-submission.dto.ts` – DTO cho tạo submission mới
  - `dto/update-submission.dto.ts` – DTO cho cập nhật submission
- `src/entities`
  - `submission.entity.ts` – Bảng `submissions` (Bài nộp)
  - `submission-version.entity.ts` – Bảng `submission_versions` (Lịch sử versions)
- `src/supabase`
  - `supabase.config.ts` – Cấu hình Supabase Client
- `src/main.ts` – Bootstrap NestJS, listen port 3003
- `submission-service.module.ts` – Kết nối DB `db_submission` (PostgreSQL)

## 3. Chạy bằng Docker Compose

```bash
docker-compose up -d --build
```

Docker Compose sẽ chạy:

- `postgres` – container cơ sở dữ liệu Postgres, tạo các database (`db_identity`, `db_conference`, `db_submission`, `db_review`)
- `identity-service` – port `3001`
- `conference-service` – port `3002`
- `submission-service` – port `3003`
- `review-service` – port `3004`
## 4. Cấu hình Environment Variables

### 4.1. File `.env` ở thư mục gốc

Tạo file `.env` ở thư mục gốc của project với nội dung:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
```
### 4.2. Kết nối Database

`submission-service` dùng các biến môi trường (đã cấu hình trong `docker-compose.yml`):

- `DB_HOST=postgres`
- `DB_PORT=5432`
- `DB_USERNAME=admin`
- `DB_PASSWORD=admin123`
- `DB_DATABASE=db_submission`

## 6. API Endpoints

### Base URL

```
http://localhost:3003/api
```

### 6.1. Tạo Submission Mới

**Endpoint:** `POST /submissions`

**Headers:**
```
Authorization: Bearer <JWT_ACCESS_TOKEN>
Content-Type: multipart/form-data
```

**Body (Form Data):**
- `file` (File, bắt buộc): File PDF
- `title` (String, bắt buộc): Tiêu đề bài báo
- `abstract` (String, bắt buộc): Tóm tắt bài báo
- `keywords` (String, tùy chọn): Từ khóa
- `trackId` (Number, bắt buộc): ID Track hội nghị

**Response (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Machine Learning in Healthcare",
  "abstract": "This paper explores...",
  "keywords": "machine learning, healthcare, AI",
  "fileUrl": "https://your-project.supabase.co/storage/v1/object/public/submissions/1234567890-uuid.pdf",
  "status": "SUBMITTED",
  "authorId": 1,
  "trackId": 1,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "versions": [
    {
      "id": 1,
      "submissionId": "550e8400-e29b-41d4-a716-446655440000",
      "versionNumber": 1,
      "title": "Machine Learning in Healthcare",
      "abstract": "This paper explores...",
      "fileUrl": "https://your-project.supabase.co/storage/v1/object/public/submissions/1234567890-uuid.pdf",
      "keywords": "machine learning, healthcare, AI",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Lưu ý:**
- File phải là PDF (mimetype: `application/pdf`)
- Kích thước file tối đa: 10MB
- Tự động tạo version 1 khi tạo submission mới

### 6.2. Cập nhật Submission

**Endpoint:** `PUT /submissions/:id`

**Headers:**
```
Authorization: Bearer <JWT_ACCESS_TOKEN>
Content-Type: multipart/form-data
```

**Body (Form Data, tất cả đều tùy chọn):**
- `file` (File, tùy chọn): File PDF mới
- `title` (String, tùy chọn): Tiêu đề mới
- `abstract` (String, tùy chọn): Tóm tắt mới
- `keywords` (String, tùy chọn): Từ khóa mới
- `trackId` (Number, tùy chọn): ID Track mới


**Lưu ý:**
- Chỉ author của submission mới được cập nhật
- Trước khi cập nhật, hệ thống tự động tạo version backup (version number tăng dần)
- Nếu không upload file mới, sẽ giữ nguyên file URL cũ
- Versions được sắp xếp theo versionNumber giảm dần (mới nhất trước)

### 6.3. Lấy Danh Sách Submissions

**Endpoint:** `GET /submissions`

**Headers:**
```
Authorization: Bearer <JWT_ACCESS_TOKEN>
```
**Lưu ý:**
- Chỉ trả về submissions của user hiện tại (theo `authorId` từ JWT token)
- Sắp xếp theo `createdAt` giảm dần (mới nhất trước)

### 6.4. Lấy Chi Tiết Submission

**Endpoint:** `GET /submissions/:id`

**Headers:**
```
Authorization: Bearer <JWT_ACCESS_TOKEN>
```

**Lưu ý:**
- Chỉ author của submission mới được xem chi tiết
- Kèm theo lịch sử tất cả versions
- Versions được sắp xếp theo versionNumber giảm dần

## 7. Submission Status

Enum `SubmissionStatus` có các giá trị:

- `DRAFT` - Bản nháp
- `SUBMITTED` - Đã nộp
- `REVIEWING` - Đang được review
- `ACCEPTED` - Đã chấp nhận
- `REJECTED` - Đã từ chối

### Các bước test:

1. **Đăng nhập** để lấy JWT token (từ identity-service)
2. **Tạo submission mới** với file PDF
3. **Lấy danh sách submissions** của user
4. **Xem chi tiết submission** kèm versions
5. **Cập nhật submission** (tạo version mới)
