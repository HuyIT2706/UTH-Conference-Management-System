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

### Bước 2: Build & chạy bằng Docker

```bash
# Từ thư mục root của project
docker build -t uth-submission-service -f apps/submission-service/Dockerfile .

docker run --env-file apps/submission-service/.env -p 3003:3003 uth-submission-service
```

Service sẽ chạy tại `http://localhost:3003/api`.

### Bước 3: Chuẩn bị access token & dữ liệu conference

- **Access token (JWT)**: lấy từ `identity-service`
  - `POST http://localhost:3001/api/auth/login`
  - Body:
    ```json
    {
      "email": "author@example.com",
      "password": "author123"
    }
    ```
  - Lấy `accessToken` trong response, dùng cho tất cả request bên dưới:
    ```http
    Authorization: Bearer <accessToken>
    ```

- **Conference & Track**: tạo trên `conference-service` (http://localhost:3002/api)
  - Tạo conference → lấy `conferenceId`
  - Tạo track thuộc conference đó → lấy `trackId`
  - Thiết lập CFP deadlines (`submissionDeadline`, `cameraReadyDeadline`, …) để validate hạn nộp.

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
- `conferenceId` (Number, bắt buộc): ID Conference chứa track đó

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

- **Query params (tùy chọn):**
  - `page`, `limit` – phân trang
  - `trackId`, `conferenceId`, `status`, `authorId` – filter
  - `search` – tìm theo title/abstract/keywords

- **RBAC:**
  - Author: chỉ thấy submissions của chính mình
  - Chair/Admin: thấy tất cả submissions

### 2.1. Lấy danh sách submissions của chính mình

**Endpoint:** `GET /api/submissions/me`

**Headers:**
```
Authorization: Bearer {accessToken}
```

- Trả về toàn bộ submissions của user hiện tại (không phân trang).

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
- `coAuthors` (tùy chọn): danh sách đồng tác giả (nếu cần)

**Business:**
- Chỉ author của bài được sửa
- Chỉ cho phép sửa **trước hạn submissionDeadline** (check qua conference-service)
- Mỗi lần sửa sẽ tự động tạo **version mới** trong `submission_versions`.

### 5. Rút Submission (Withdraw)

**Endpoint:** `DELETE /api/submissions/:id`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Business:**
- Chỉ author của submission được rút
- Chỉ cho phép khi status ∈ `{ SUBMITTED, REVIEWING }`
- Phải còn hạn `submissionDeadline` (check qua conference-service)
- Status sau khi rút: `WITHDRAWN`

### 6. Chair/Admin: Cập nhật trạng thái (Decision)

**Endpoint:** `PATCH /api/submissions/:id/status`

**Headers:**
```
Authorization: Bearer {accessToken-của-CHAIR-hoặc-ADMIN}
Content-Type: application/json
```

**Body:**
```json
{
  "status": "ACCEPTED",
  "decisionNote": "Good paper, strong results"
}
```

- Chỉ role `CHAIR` / `ADMIN` được gọi endpoint này.
- Có **state machine** validate chuyển trạng thái hợp lệ.

### 7. Upload Camera-Ready

**Endpoint:** `POST /api/submissions/:id/camera-ready`

**Headers:**
```
Authorization: Bearer {accessToken-của-author}
Content-Type: multipart/form-data
```

**Body (Form Data):**
- `file` (File, bắt buộc): PDF camera-ready

**Business:**
- Chỉ author bài đó được upload
- Chỉ khi status hiện tại là `ACCEPTED`
- Phải còn hạn `cameraReadyDeadline` (check qua conference-service)
- Lưu URL camera-ready và chuyển status sang `CAMERA_READY`

### 8. Tác giả xem Reviews (ẩn danh)

**Endpoint:** `GET /api/submissions/:id/reviews`

**Headers:**
```
Authorization: Bearer {accessToken-của-author}
```

**Business:**
- Chỉ author của submission được xem reviews
- Chỉ khi bài đã `ACCEPTED` hoặc `REJECTED`
- Gọi sang review-service (endpoint `/reviews/submission/:id/anonymized` – cần implement bên review-service)
- Chỉ trả về các trường cho tác giả (ví dụ: `score`, `commentForAuthor`, `recommendation`)

## API Endpoints Summary

### Submissions
- `POST /api/submissions` - Tạo submission mới với file PDF (cần auth)
- `GET /api/submissions` - Lấy danh sách submissions (có phân trang, filter, RBAC)
- `GET /api/submissions/me` - Lấy submissions của user hiện tại (tất cả)
- `GET /api/submissions/:id` - Lấy chi tiết submission kèm lịch sử versions (RBAC: author/chair/admin)
- `PUT /api/submissions/:id` - Cập nhật submission (chỉ author, trước deadline)
- `DELETE /api/submissions/:id` - Rút submission (withdraw, trước deadline)
- `PATCH /api/submissions/:id/status` - Chair/Admin cập nhật trạng thái (decision)
- `POST /api/submissions/:id/camera-ready` - Author upload camera-ready sau khi ACCEPTED
- `GET /api/submissions/:id/reviews` - Author xem reviews đã ẩn danh sau khi có decision

### Submission Status
Enum `SubmissionStatus` có các giá trị:
- `DRAFT` - Bản nháp
- `SUBMITTED` - Đã nộp
- `REVIEWING` - Đang được review
- `ACCEPTED` - Đã chấp nhận
- `REJECTED` - Đã từ chối
- `WITHDRAWN` - Tác giả rút bài
- `CAMERA_READY` - Đã upload camera-ready

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
