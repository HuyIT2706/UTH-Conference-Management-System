# Submission Service - UTH ConfMS

### Bước 1: Khởi động Database

```bash
# Từ thư mục root của project
docker-compose up -d postgres
```

Kiểm tra database đã chạy:
```bash
docker-compose ps
```
### Base URL
```
http://localhost:3003/api
```

### 1. Tạo Submission Mới

**Endpoint:** `POST /api/submissions`

**⚠️ Lưu ý:** URL phải có prefix `/api` ở đầu!

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data
```

**Body (Form Data):**
- `file` (File, bắt buộc): File PDF
- `title` (String, bắt buộc): Tiêu đề bài báo
- `abstract` (String, bắt buộc): Tóm tắt bài báo
- `keywords` (String, tùy chọn): Từ khóa
- `trackId` (Number, bắt buộc): ID Track hội nghị

**Lưu ý:**
- File phải là PDF (mimetype: `application/pdf`)
- Kích thước file tối đa: 10MB
- Tự động tạo version 1 khi tạo submission mới

### 2. Lấy Danh Sách Submissions

**Endpoint:** `GET /api/submissions`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Lưu ý:**
- Chỉ trả về submissions của user hiện tại (theo `authorId` từ JWT token)
- Sắp xếp theo `createdAt` giảm dần (mới nhất trước)

### 3. Lấy Chi Tiết Submission

**Endpoint:** `GET /api/submissions/:id`

**⚠️ Lưu ý:** URL phải có prefix `/api` ở đầu!

**Ví dụ URL đúng:**
```
http://localhost:3003/api/submissions/8ccd4365-3258-4b87-8903-c48d06189ed1
```

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Lưu ý:**
- Chỉ author của submission mới được xem chi tiết
- Kèm theo lịch sử tất cả versions
- Versions được sắp xếp theo versionNumber giảm dần (mới nhất trước)

### 4. Cập nhật Submission

**Endpoint:** `PUT /api/submissions/:id`
**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data
```

**Body (Form Data, tất cả đều tùy chọn):**
- `file` (File, tùy chọn): File PDF mới
- `title` (String, tùy chọn): Tiêu đề mới
- `abstract` (String, tùy chọn): Tóm tắt mới
- `keywords` (String, tùy chọn): Từ khóa mới
- `trackId` (Number, tùy chọn): ID Track mới

## API Endpoints Summary

### Submissions
- `POST /api/submissions` - Tạo submission mới với file PDF (cần auth)
- `GET /api/submissions` - Lấy danh sách submissions của user hiện tại (cần auth)
- `GET /api/submissions/:id` - Lấy chi tiết submission kèm lịch sử versions (cần auth - chỉ author)
- `PUT /api/submissions/:id` - Cập nhật submission (cần auth - chỉ author)

### Submission Status
Enum `SubmissionStatus` có các giá trị:
- `DRAFT` - Bản nháp
- `SUBMITTED` - Đã nộp
- `REVIEWING` - Đang được review
- `ACCEPTED` - Đã chấp nhận
- `REJECTED` - Đã từ chối

## Cấu trúc Project

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
