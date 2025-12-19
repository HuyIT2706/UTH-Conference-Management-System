# Review Service

Service quản lý Review/Bidding/Assignment trong hệ thống UTH-CONFMS.

## 1. Yêu cầu môi trường

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL chạy qua Docker (được cấu hình sẵn trong `docker-compose.yml` ở thư mục gốc).

## 2. Cấu trúc chính

- `src/reviews`
  - `reviews.controller.ts` – REST API cho Reviews/Assignments/Bids
  - `reviews.service.ts` – Business logic & làm việc với DB (TypeORM Repository)
  - `entities/review-preference.entity.ts` – Bảng `review_preferences` (Bidding)
  - `entities/assignment.entity.ts` – Bảng `assignments` (Gán bài)
  - `entities/review.entity.ts` – Bảng `reviews` (Kết quả chấm)
  - `entities/pc-discussion.entity.ts` – Bảng `pc_discussions` (Thảo luận nội bộ)
  - `dto/create-bid.dto.ts` – DTO cho bidding
  - `dto/create-assignment.dto.ts` – DTO cho assignment
  - `dto/create-review.dto.ts` – DTO cho review
- `src/main.ts` – Bootstrap NestJS, listen port 3004
- `review-service.module.ts` – Kết nối DB `db_review` (PostgreSQL)

## 3. Chạy bằng Docker Compose

```bash
docker-compose up -d --build
```

Docker Compose sẽ chạy:

- `postgres` – container cơ sở dữ liệu Postgres, tạo các database (`db_identity`, `db_conference`, `db_submission`, `db_review`)
- `identity-service` – port `3001`
- `conference-service` – port `3002`
- `review-service` – port `3004`

Kiểm tra container:

```bash
docker ps
```

Bạn nên thấy:

- `uth-confms-private-review-service-1` (PORT `0.0.0.0:3004->3004/tcp`)

## 4. Kết nối Database

`review-service` dùng các biến môi trường (đã cấu hình trong `docker-compose.yml`):

- `DB_HOST=postgres`
- `DB_PORT=5432`
- `DB_USERNAME=admin`
- `DB_PASSWORD=admin123`
- `DB_DATABASE=db_review`

TypeORM đang bật `synchronize: true` nên khi service start lần đầu sẽ tự tạo các bảng:

- `review_preferences` (Bidding)
- `assignments` (Gán bài)
- `reviews` (Kết quả chấm)
- `pc_discussions` (Thảo luận nội bộ)

## 5. API Endpoints

### 5.1. Reviewer APIs

#### POST `/api/reviews/bids`
Reviewer submit preference (bidding) cho một bài báo.

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "submissionId": 1,
  "preference": "INTERESTED" // INTERESTED, MAYBE, CONFLICT, NOT_INTERESTED
}
```

**Response:**
```json
{
  "message": "Đánh giá quan tâm bài báo thành công",
  "data": {
    "id": 1,
    "reviewerId": 5,
    "submissionId": 1,
    "preference": "INTERESTED",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### GET `/api/reviews/assignments/me`
Reviewer xem danh sách bài được gán.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Lấy danh sách assignments thành công",
  "data": [
    {
      "id": 1,
      "reviewerId": 5,
      "submissionId": 1,
      "status": "PENDING",
      "assignedBy": 2,
      "dueDate": "2024-02-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "review": null
    }
  ]
}
```

#### PUT `/api/reviews/assignments/:id/accept`
Reviewer chấp nhận assignment.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Chấp nhận assignment thành công",
  "data": {
    "id": 1,
    "status": "ACCEPTED",
    ...
  }
}
```

#### PUT `/api/reviews/assignments/:id/reject`
Reviewer từ chối assignment.

**Headers:**
```
Authorization: Bearer <token>
```

#### POST `/api/reviews`
Reviewer nộp bài chấm.

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "assignmentId": 1,
  "score": 85,
  "confidence": "HIGH", // LOW, MEDIUM, HIGH
  "commentForAuthor": "Bài viết tốt, cần chỉnh sửa một số phần nhỏ.",
  "commentForPC": "Tác giả có thể cải thiện phần methodology.",
  "recommendation": "ACCEPT" // ACCEPT, WEAK_ACCEPT, REJECT, WEAK_REJECT
}
```

**Response:**
```json
{
  "message": "Nộp bài chấm thành công",
  "data": {
    "id": 1,
    "assignmentId": 1,
    "score": 85,
    "confidence": "HIGH",
    "commentForAuthor": "Bài viết tốt...",
    "commentForPC": "Tác giả có thể...",
    "recommendation": "ACCEPT",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Lưu ý:** Sau khi nộp review, assignment status sẽ tự động chuyển sang `COMPLETED`.

### 5.2. Chair APIs

#### POST `/api/reviews/assignments`
Chair gán bài cho Reviewer.

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "reviewerId": 5,
  "submissionId": 1,
  "dueDate": "2024-02-01T00:00:00.000Z" // Optional
}
```

**Response:**
```json
{
  "message": "Gán bài cho Reviewer thành công",
  "data": {
    "id": 1,
    "reviewerId": 5,
    "submissionId": 1,
    "status": "PENDING",
    "assignedBy": 2,
    "dueDate": "2024-02-01T00:00:00.000Z",
    ...
  }
}
```

**Validation:**
- Không được gán nếu Reviewer đã báo CONFLICT cho bài này
- Không được gán nếu Reviewer không tồn tại trong hệ thống (mock check)

#### GET `/api/reviews/submission/:id`
Chair xem toàn bộ kết quả chấm của một bài.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Lấy danh sách reviews thành công",
  "data": [
    {
      "id": 1,
      "assignmentId": 1,
      "score": 85,
      "confidence": "HIGH",
      "commentForAuthor": "...",
      "commentForPC": "...",
      "recommendation": "ACCEPT",
      "assignment": {
        "id": 1,
        "reviewerId": 5,
        "submissionId": 1,
        "status": "COMPLETED",
        ...
      }
    }
  ]
}
```

#### GET `/api/reviews/bids/submission/:id`
Chair xem tất cả bids cho một bài (optional).

**Headers:**
```
Authorization: Bearer <token>
```

#### POST `/api/reviews/discussions`
Tạo thảo luận nội bộ PC.

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "submissionId": 1,
  "message": "Tôi nghĩ bài này cần review thêm..."
}
```

#### GET `/api/reviews/discussions/submission/:id`
Lấy danh sách thảo luận cho một bài.

**Headers:**
```
Authorization: Bearer <token>
```

## 6. Business Logic

### 6.1. Bidding Logic
- Reviewer có thể submit preference cho một submission
- Nếu preference là `CONFLICT`, hệ thống sẽ không cho phép Chair gán bài này cho Reviewer đó
- Có thể update preference nếu đã tồn tại

### 6.2. Assignment Logic
- Chair gán bài cho Reviewer
- Validate:
  - Không được gán nếu Reviewer đã báo CONFLICT
  - Không được gán nếu Reviewer không tồn tại (mock check)
  - Không được gán trùng lặp
- Assignment status: `PENDING` → `ACCEPTED`/`REJECTED` → `COMPLETED`

### 6.3. Review Logic
- Chỉ Reviewer có Assignment status `ACCEPTED` mới được nộp Review
- Sau khi nộp Review, Assignment status tự động chuyển sang `COMPLETED`
- Mỗi Assignment chỉ có thể có một Review

## 7. Database Schema

### review_preferences
- `id` (PK)
- `reviewerId` (Int)
- `submissionId` (Int)
- `preference` (Enum: INTERESTED, MAYBE, CONFLICT, NOT_INTERESTED)
- `createdAt`, `updatedAt`
- Unique constraint: (reviewerId, submissionId)

### assignments
- `id` (PK)
- `reviewerId` (Int)
- `submissionId` (Int)
- `status` (Enum: PENDING, ACCEPTED, REJECTED, COMPLETED)
- `assignedBy` (Int - ID của Chair)
- `dueDate` (Date, nullable)
- `createdAt`, `updatedAt`

### reviews
- `id` (PK)
- `assignmentId` (Int, unique)
- `score` (Int: 0-100)
- `confidence` (Enum: LOW, MEDIUM, HIGH)
- `commentForAuthor` (Text, nullable)
- `commentForPC` (Text, nullable - confidential)
- `recommendation` (Enum: ACCEPT, WEAK_ACCEPT, REJECT, WEAK_REJECT)
- `createdAt`, `updatedAt`

### pc_discussions
- `id` (PK)
- `submissionId` (Int)
- `userId` (Int)
- `message` (Text)
- `createdAt`

## 8. Lưu ý

- Review Service không chứa bảng User hay Submission, chỉ lưu ID tham chiếu
- Cần tích hợp với Identity Service để verify user/role (hiện tại dùng JWT decode)
- Cần tích hợp với Submission Service để verify submission tồn tại (hiện tại chỉ validate ID > 0)
