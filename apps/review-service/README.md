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
- Cần tích hợp với Identity Service để verify user/role (hiện tại decode JWT và dùng roles trong payload)
- Cần tích hợp với Submission Service để verify submission tồn tại (hiện tại chỉ validate ID > 0)

## 9. Kịch bản test end-to-end bằng Postman

### 9.1. Chuẩn bị chung

- **Base URL**: `http://localhost:3004/api` (hoặc đúng port bạn map cho review-service trong Docker).
- Tất cả endpoint đều yêu cầu header:

```text
Authorization: Bearer <JWT>
Content-Type: application/json
```

- JWT payload tối thiểu:

```json
{
  "sub": 1,
  "roles": ["CHAIR"],   // hoặc ADMIN / REVIEWER / AUTHOR
  "email": "user@example.com"
}
```

- ID giả định để test nhanh:
  - `conferenceId = 1`
  - `submissionId = 1`
  - `chairId = 1` (token có role `CHAIR` hoặc `ADMIN`)
  - `reviewerId1 = 2`, `reviewerId2 = 3` (token có role `REVIEWER`)
  - `authorId = 4` (token đại diện tác giả)

> Bạn có thể dùng Identity Service để sinh JWT thật, hoặc tạm thời dùng JWT giả có `sub`, `roles` đúng như trên để test luồng.

---

### 9.2. Flow 1 – Reviewer bidding + COI

**Bước 1 – Reviewer gửi bidding cho bài báo**

- Method: `POST`
- URL: `/api/reviews/bids`
- JWT: của **reviewer** (`roles` chứa `REVIEWER`)
- Body:

```json
{
  "submissionId": 1,
  "conferenceId": 1,
  "preference": "INTERESTED"
}
```

**Bước 2 – Reviewer báo xung đột lợi ích (COI)**

- Gửi lại request với:

```json
{
  "submissionId": 1,
  "conferenceId": 1,
  "preference": "CONFLICT"
}
```

> Sau đó nếu Chair auto-assign trùng reviewer này, API sẽ trả 400 với thông báo CONFLICT.

---

### 9.3. Flow 2 – Chair gán bài (manual + auto)

**Bước 1 – Chair gán 1 bài cho 1 reviewer (manual)**

- Method: `POST`
- URL: `/api/reviews/assignments`
- JWT: của **chair** (`roles` chứa `CHAIR` hoặc `ADMIN`)
- Body:

```json
{
  "reviewerId": 2,
  "submissionId": 1,
  "conferenceId": 1,
  "dueDate": "2025-01-31T23:59:59.000Z"
}
```

**Bước 2 – Chair auto-assign 1 bài cho nhiều reviewer (đơn giản)**

- Method: `POST`
- URL: `/api/reviews/assignments/auto`
- JWT: **chair**
- Body:

```json
{
  "submissionId": 1,
  "conferenceId": 1,
  "reviewerIds": [2, 3]
}
```

Kết quả:

```json
{
  "message": "Tự động gán bài cho nhiều Reviewer (đơn giản) thành công",
  "data": {
    "created": [
      { "id": 10, "reviewerId": 2, "submissionId": 1, "conferenceId": 1 },
      { "id": 11, "reviewerId": 3, "submissionId": 1, "conferenceId": 1 }
    ],
    "failed": [
      {
        "reviewerId": 5,
        "reason": "Không thể gán bài này vì Reviewer đã báo cáo xung đột lợi ích (CONFLICT)"
      }
    ]
  }
}
```

---

### 9.4. Flow 3 – Reviewer nhận assignment, accept và nộp review

**Bước 1 – Reviewer xem assignments của mình**

- Method: `GET`
- URL: `/api/reviews/assignments/me?page=1&limit=10`
- JWT: reviewer (`sub = 2`)

**Bước 2 – Reviewer accept assignment**

- Method: `PUT`
- URL: `/api/reviews/assignments/10/accept` (thay `10` bằng `id` thật)
- JWT: reviewer (`sub = 2`)

**Bước 3 – Reviewer nộp review**

- Method: `POST`
- URL: `/api/reviews`
- JWT: reviewer (`sub = 2`)
- Body:

```json
{
  "assignmentId": 10,
  "score": 85,
  "confidence": "HIGH",
  "commentForAuthor": "Bài viết tốt, nên chỉnh sửa phần hình vẽ.",
  "commentForPC": "Nên hỏi thêm về phần methodology.",
  "recommendation": "ACCEPT"
}
```

> Sau khi nộp, `assignment.status` sẽ là `COMPLETED`.

---

### 9.5. Flow 4 – Chair xem reviews, bids, discussions

**1. Xem toàn bộ reviews của 1 submission**

- Method: `GET`
- URL: `/api/reviews/submission/1?page=1&limit=10`
- JWT: chair

**2. Xem tất cả bids cho 1 submission**

- Method: `GET`
- URL: `/api/reviews/bids/submission/1?page=1&limit=10`
- JWT: chair

**3. Tạo thảo luận PC cho submission**

- Method: `POST`
- URL: `/api/reviews/discussions`
- JWT: chair
- Body:

```json
{
  "submissionId": 1,
  "message": "Tôi nghĩ cần thêm 1 reviewer nữa cho chủ đề này."
}
```

**4. Xem danh sách thảo luận**

- Method: `GET`
- URL: `/api/reviews/discussions/submission/1?page=1&limit=20`
- JWT: chair

---

### 9.6. Flow 5 – Quyết định cuối cùng & tổng hợp review (Decision & Aggregation)

**1. Chair xem tổng hợp review + quyết định hiện tại**

- Method: `GET`
- URL: `/api/reviews/decisions/submission/1`
- JWT: chair

Response mẫu:

```json
{
  "message": "Lấy tổng hợp review và quyết định thành công",
  "data": {
    "submissionId": 1,
    "stats": {
      "reviewCount": 2,
      "averageScore": 82.5,
      "minScore": 80,
      "maxScore": 85,
      "recommendationCounts": {
        "ACCEPT": 1,
        "WEAK_ACCEPT": 1
      }
    },
    "decision": null
  }
}
```

**2. Chair đặt quyết định cuối cùng (Accept/Reject/BORDERLINE)**

- Method: `POST`
- URL: `/api/reviews/decisions`
- JWT: chair
- Body:

```json
{
  "submissionId": 1,
  "decision": "ACCEPT",
  "note": "Điểm trung bình cao, đồng thuận tốt."
}
```

---

### 9.7. Flow 6 – Anonymized reviews cho tác giả (single-blind cơ bản)

Endpoint này được `submission-service` gọi để hiện kết quả review cho tác giả.

- Method: `GET`
- URL: `/api/reviews/submission/1/anonymized`
- JWT: có thể là token của tác giả, hệ thống submission-service sẽ kiểm soát quyền.

Response:

```json
{
  "message": "Lấy danh sách reviews ẩn danh thành công",
  "data": [
    {
      "score": 85,
      "commentForAuthor": "Bài viết tốt, nên chỉnh sửa phần hình vẽ.",
      "recommendation": "ACCEPT",
      "createdAt": "2025-01-01T10:00:00.000Z"
    }
  ]
}
```

---

### 9.8. Flow 7 – Rebuttal (tác giả phản hồi)

**1. Tác giả gửi rebuttal cho bài báo**

- Method: `POST`
- URL: `/api/reviews/rebuttals`
- JWT: **author** (`sub = 4`)
- Body:

```json
{
  "submissionId": 1,
  "conferenceId": 1,
  "message": "Chúng tôi đã cập nhật phần thí nghiệm như góp ý."
}
```

**2. Chair xem toàn bộ rebuttal của submission**

- Method: `GET`
- URL: `/api/reviews/rebuttals/submission/1`
- JWT: chair

---

### 9.9. Flow 8 – Progress Tracking

**1. Tiến độ review cho 1 submission**

- Method: `GET`
- URL: `/api/reviews/progress/submission/1`
- JWT: chair

Ví dụ:

```json
{
  "message": "Lấy tiến độ review của bài báo thành công",
  "data": {
    "submissionId": 1,
    "totalAssignments": 3,
    "completedAssignments": 2,
    "pendingAssignments": 1,
    "reviewsSubmitted": 2,
    "lastReviewAt": "2025-01-01T10:00:00.000Z"
  }
}
```

**2. Tiến độ review cho 1 conference**

- Method: `GET`
- URL: `/api/reviews/progress/conference/1`
- JWT: chair

```json
{
  "message": "Lấy tiến độ review của hội nghị thành công",
  "data": {
    "conferenceId": 1,
    "totalAssignments": 50,
    "completedAssignments": 40,
    "pendingAssignments": 10,
    "reviewsSubmitted": 40
  }
}
```

Với các flow trên, bạn có thể dùng Postman (hoặc Newman) để demo trọn luồng: **Bidding → Assignment (manual/auto) → Review → Discussion → Rebuttal → Decision → Anonymized Reviews → Progress Tracking** cho `review-service`.






