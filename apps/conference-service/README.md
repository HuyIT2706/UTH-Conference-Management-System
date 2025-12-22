# Conference Service

Service quản lý Conference/Track/CFP trong hệ thống UTH-CONFMS.

## 1. Yêu cầu môi trường

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL chạy qua Docker (được cấu hình sẵn trong `docker-compose.yml` ở thư mục gốc).

## 2. Cấu trúc chính

- `src/conferences`  
  - `conferences.controller.ts` – REST API cho Conferences  
  - `conferences.service.ts` – Business logic & làm việc với DB (TypeORM Repository)  
  - `entities/conference.entity.ts` – Bảng `conferences`  
  - `entities/track.entity.ts` – Bảng `tracks`  
  - `entities/conference-member.entity.ts` – Bảng `conference_members`
- `src/cfp`  
  - `entities/cfp-setting.entity.ts` – Bảng `cfp_settings` (các mốc deadline)  
  - `dto/set-cfp-setting.dto.ts`
- `src/main.ts` – Bootstrap NestJS, listen port 3002
- `conference-service.module.ts` – Kết nối DB `db_conference` (PostgreSQL)

## 3. Chạy bằng Docker Compose

```bash
docker-compose up -d --build
```

Docker Compose sẽ chạy:

- `postgres` – container cơ sở dữ liệu Postgres, tạo các database (`db_identity`, `db_conference`, ...)
- `identity-service` – port `3001`
- `conference-service` – port `3002`

Kiểm tra container:

```bash
docker ps
```

Bạn nên thấy:

- `uth-confms-private-identity-service-1` (PORT `0.0.0.0:3001->3001/tcp`)
- `uth-confms-private-conference-service-1` (PORT `0.0.0.0:3002->3002/tcp`)
- `uth_postgres` (PORT `5432`)


## 4. Kết nối Database

`conference-service` dùng các biến môi trường (đã cấu hình trong `docker-compose.yml`):

- `DB_HOST=postgres`
- `DB_PORT=5432`
- `DB_USERNAME=admin`
- `DB_PASSWORD=admin123`
- `DB_DATABASE=db_conference`

TypeORM đang bật `synchronize: true` nên khi service start lần đầu sẽ tự tạo các bảng:

- `conferences`
- `tracks`
- `conference_members`
- `cfp_settings`
- `email_templates`
- `form_templates`
- `cfp_templates`
- `audit_logs`

Bạn có thể kiểm tra trong Postgres:

```bash
docker exec -it uth_postgres psql -U admin -d db_conference
\dt
```
## 5. Test API bằng Postman

### 5.1 Lấy access token (từ identity-service)
- Base URL identity-service: `http://localhost:3001/api`
- Đăng nhập: `POST /api/auth/login`
  - Body:
  ```json
  {
    "email": "admin@example.com",
    "password": "admin123"
  }
  ```
  - Lấy `accessToken` trong response, dùng cho tất cả yêu cầu dưới (`Authorization: Bearer <accessToken>`).

### 5.2 Base URL conference-service
```
http://localhost:3002/api
```

### 5.3 Conference
- Tạo conference  
  - `POST /conferences`  
  - Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`  
  - Body:
  ```json
  {
    "name": "International UTH Conference 2025",
    "startDate": "2025-06-01T09:00:00Z",
    "endDate": "2025-06-03T18:00:00Z",
    "venue": "HCMC University of Transport"
  }
  ```
- Danh sách: `GET /conferences`
- Chi tiết: `GET /conferences/:id`
- Cập nhật: `PATCH /conferences/:id` (body tùy chọn các trường `name`, `startDate`, `endDate`, `venue`)
- Xóa: `DELETE /conferences/:id`

### 5.4 Track
- Thêm track:  
  - `POST /conferences/:id/tracks`  
  - Body:
  ```json
  { "name": "AI Track" }
  ```
- Cập nhật track: `PATCH /conferences/:conferenceId/tracks/:trackId` (body: `{ "name": "New Name" }`)
- Xóa track: `DELETE /conferences/:conferenceId/tracks/:trackId`

### 5.5 CFP (deadline)
- `POST /conferences/:id/cfp`
- Body (thứ tự phải hợp lệ: submission ≤ review ≤ notification ≤ cameraReady):
```json
{
  "submissionDeadline": "2025-03-01T23:59:59Z",
  "reviewDeadline": "2025-03-15T23:59:59Z",
  "notificationDate": "2025-04-01T12:00:00Z",
  "cameraReadyDeadline": "2025-04-15T23:59:59Z"
}
```

### 5.6 Conference Members (PC/Chair)
- Lấy danh sách member: `GET /conferences/:id/members`
- Thêm member:  
  - `POST /conferences/:id/members`  
  - Body:
  ```json
  {
    "userId": 5,
    "role": "PC_MEMBER" // hoặc "CHAIR"
  }
  ```
- Xóa member: `DELETE /conferences/:id/members/:userId`

### 5.7 Template Management

#### Email Templates
- Tạo email template:
  - `POST /conferences/:conferenceId/templates/email`
  - Body:
  ```json
  {
    "name": "Decision Accepted Email",
    "type": "DECISION_ACCEPTED",
    "subject": "Congratulations! Your submission has been accepted",
    "body": "Dear {{authorName}},\n\nYour submission '{{submissionTitle}}' has been accepted for {{conferenceName}}.\n\nBest regards,\n{{conferenceName}} Committee",
    "variables": {
      "authorName": "Tên tác giả",
      "submissionTitle": "Tiêu đề bài nộp",
      "conferenceName": "Tên hội nghị"
    }
  }
  ```
  - Các type có sẵn: `DECISION_ACCEPTED`, `DECISION_REJECTED`, `REMINDER_REVIEW`, `INVITATION_PC`, `NOTIFICATION_DEADLINE`
- Lấy danh sách: `GET /conferences/:conferenceId/templates/email`
- Lấy chi tiết: `GET /conferences/:conferenceId/templates/email/:templateId`
- Cập nhật: `PATCH /conferences/:conferenceId/templates/email/:templateId`
- Xóa: `DELETE /conferences/:conferenceId/templates/email/:templateId`

#### Form Templates
- Tạo form template:
  - `POST /conferences/:conferenceId/templates/form`
  - Body:
  ```json
  {
    "type": "SUBMISSION_FORM",
    "name": "Submission Form Template",
    "fields": [
      {
        "name": "title",
        "label": "Title",
        "type": "text",
        "required": true,
        "validation": { "maxLength": 500 }
      },
      {
        "name": "abstract",
        "label": "Abstract",
        "type": "textarea",
        "required": true
      },
      {
        "name": "keywords",
        "label": "Keywords",
        "type": "text",
        "required": false
      }
    ],
    "description": "Template for submission form"
  }
  ```
  - Các type có sẵn: `SUBMISSION_FORM`, `REVIEW_FORM`, `CFP_FORM`
- Lấy danh sách: `GET /conferences/:conferenceId/templates/form`
- Lấy chi tiết: `GET /conferences/:conferenceId/templates/form/:templateId`
- Cập nhật: `PATCH /conferences/:conferenceId/templates/form/:templateId`
- Xóa: `DELETE /conferences/:conferenceId/templates/form/:templateId`

#### CFP Templates
- Tạo/Cập nhật CFP template:
  - `POST /conferences/:conferenceId/templates/cfp`
  - Body:
  ```json
  {
    "htmlContent": "<html><body><h1>{{conferenceName}}</h1><p>Welcome to our conference!</p></body></html>",
    "customStyles": {
      "primaryColor": "#007bff",
      "fontFamily": "Arial"
    }
  }
  ```
- Lấy CFP template: `GET /conferences/:conferenceId/templates/cfp`
- Cập nhật: `PATCH /conferences/:conferenceId/templates/cfp`

### 5.8 Bulk Notifications
- Gửi email hàng loạt:
  - `POST /conferences/:conferenceId/notifications/bulk`
  - Body:
  ```json
  {
    "recipientType": "PC_MEMBERS",
    "templateId": 1,
    "variables": {
      "deadline": "2025-03-15",
      "conferenceName": "International UTH Conference 2025"
    },
    "subject": "Reminder: Review Deadline Approaching",
    "body": "Custom email body (optional if using template)"
  }
  ```
  - Các recipientType: `PC_MEMBERS`, `AUTHORS`, `REVIEWERS`, `CHAIRS`
- Preview email trước khi gửi:
  - `POST /conferences/:conferenceId/notifications/preview`
  - Body: Giống như bulk notification

### 5.9 Public CFP Page (Không cần authentication)
- Lấy thông tin CFP công khai:
  - `GET /public/conferences/:id/cfp`
  - Không cần `Authorization` header
  - Response bao gồm: thông tin conference, tracks, deadlines, CFP template
- Lấy danh sách tracks công khai:
  - `GET /public/conferences/:id/tracks`
  - Không cần `Authorization` header

### 5.10 Reporting & Analytics
- Thống kê tổng quan:
  - `GET /conferences/:conferenceId/stats`
  - Response: tổng số tracks, members, members theo role
- Thống kê submissions:
  - `GET /conferences/:conferenceId/stats/submissions`
  - Lưu ý: Cần tích hợp với submission-service để lấy dữ liệu thực tế
- Tỷ lệ chấp nhận:
  - `GET /conferences/:conferenceId/stats/acceptance-rate`
  - Lưu ý: Cần tích hợp với submission-service để lấy dữ liệu thực tế
- Thống kê tracks:
  - `GET /conferences/:conferenceId/stats/tracks`

### 5.11 Audit Logs
- Lấy audit logs của conference:
  - `GET /conferences/:conferenceId/audit-logs`
  - Response: danh sách các thao tác đã được log (CREATE, UPDATE, DELETE, etc.)

### 5.12 Validation Helpers
- Validate track thuộc conference:
  - `GET /conferences/:conferenceId/tracks/:trackId/validate`
  - Response: `{ "valid": true/false, "track": {...} }`
- Lấy deadlines của conference:
  - `GET /conferences/:conferenceId/cfp/deadlines`
  - Response: `{ "deadlines": {...} }`
- Check deadline hợp lệ:
  - `GET /conferences/:conferenceId/cfp/check-deadline?type=submission`
  - Các type: `submission`, `review`, `notification`, `camera-ready`
  - Response: `{ "valid": true/false, "deadline": "...", "message": "..." }`

---

## 6. Lưu ý quyền

- **ADMIN**: Có thể quản lý tất cả conferences
- **CHAIR**: Chỉ có thể quản lý conference mà họ là CHAIR
- **PC_MEMBER**: Không có quyền quản lý (chỉ review)
- **Public endpoints** (`/public/*`): Không cần authentication

---

## 7. Workflow Test Đề Xuất

### Bước 1: Setup cơ bản
1. Đăng nhập và lấy token (ADMIN hoặc CHAIR)
2. Tạo conference
3. Tạo tracks
4. Thiết lập CFP deadlines
5. Thêm PC members

### Bước 2: Template Management
1. Tạo email templates (decision, reminder, invitation)
2. Tạo form templates (submission, review)
3. Tạo CFP template

### Bước 3: Bulk Notifications
1. Preview email với template
2. Gửi email hàng loạt cho PC members

### Bước 4: Public CFP Page
1. Test public endpoints (không cần token)
2. Kiểm tra hiển thị thông tin đúng

### Bước 5: Reporting & Analytics
1. Xem thống kê tổng quan
2. Xem thống kê tracks và members

### Bước 6: Validation Helpers
1. Validate track ID
2. Check deadline hợp lệ

---

## 8. Tích hợp với Services khác

### Submission Service
- Cần tích hợp để lấy dữ liệu submissions cho Reporting
- Cần tích hợp để lấy danh sách authors cho Bulk Notifications

### Review Service
- Cần tích hợp để lấy dữ liệu reviews cho Reporting
- Cần tích hợp để lấy danh sách reviewers cho Bulk Notifications

### Email Service
- Cần tích hợp email provider (SMTP, SendGrid, AWS SES) để gửi email thực tế trong Bulk Notifications

