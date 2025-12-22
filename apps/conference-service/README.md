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

### 5.4 Track - Phân ban/Chủ đề của Hội nghị

**Mục đích:** Phân loại submissions theo chủ đề/phân ban (ví dụ: AI, Machine Learning, Database, etc.)

**Giải thích:**
- **Track = Phân ban/Chủ đề** của hội nghị, KHÔNG phải người
- Mỗi hội nghị có thể có nhiều tracks (ví dụ: "AI Track", "ML Track", "Database Track")
- **Authors** chọn track khi submit paper (trong submission-service)
- **CHAIR** có thể phân công reviewers theo track (reviewers chuyên về track đó)
- Dùng để **phân loại và báo cáo** submissions theo chủ đề

**Sự khác biệt với Conference Members:**
- **Tracks** = Chủ đề/phân ban (AI, ML, Database...) → Phân loại **papers**
- **Members** = Người tham gia (CHAIR, PC_MEMBER) → Quản lý **người**

**Ví dụ thực tế:**
```
Conference: "International UTH Conference 2025"
├── Tracks (Chủ đề):
│   ├── Track 1: "Artificial Intelligence"
│   ├── Track 2: "Machine Learning"
│   └── Track 3: "Database Systems"
│
└── Members (Người):
    ├── CHAIR: Bùi Văn Huy
    ├── PC_MEMBER: Nguyễn Văn A (chuyên AI)
    └── PC_MEMBER: Trần Thị B (chuyên ML)
```

**Workflow:**
1. CHAIR tạo conference
2. CHAIR tạo các tracks (AI, ML, Database...)
3. Authors submit papers và chọn track phù hợp
4. CHAIR phân công reviewers theo track (người chuyên về track đó)
5. Báo cáo: Xem có bao nhiêu papers mỗi track, acceptance rate theo track

**Endpoints:**

- **Thêm track:** `POST /conferences/:id/tracks`
  - Headers: `Authorization: Bearer <token>` (phải là CHAIR hoặc ADMIN)
  - Body:
  ```json
  { "name": "Artificial Intelligence" }
  ```

- **Cập nhật track:** `PATCH /conferences/:conferenceId/tracks/:trackId`
  - Body: `{ "name": "New Track Name" }`

- **Xóa track:** `DELETE /conferences/:conferenceId/tracks/:trackId`

**Ví dụ sử dụng:**
```bash
# 1. CHAIR tạo track "AI" cho conference ID 1
POST http://localhost:3002/api/conferences/1/tracks
Authorization: Bearer <token_của_CHAIR>
Body: { "name": "Artificial Intelligence" }

# 2. CHAIR tạo thêm track "ML"
POST http://localhost:3002/api/conferences/1/tracks
Authorization: Bearer <token_của_CHAIR>
Body: { "name": "Machine Learning" }

# 3. Xem danh sách tracks của conference
GET http://localhost:3002/api/conferences/1
# Response sẽ có field "tracks": [{"id": 1, "name": "AI"}, {"id": 2, "name": "ML"}]
```

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

### 5.6 Conference Members (PC/Chair) - Quản lý Ban Chương trình

**Mục đích:** Quản lý thành viên Ban Chương trình (Program Committee) của hội nghị.

**Giải thích:**
- **CHAIR (Chủ tịch Ban Chương trình):** Người quản lý hội nghị, có quyền:
  - Mời/thêm PC members vào hội nghị
  - Phân công papers cho reviewers (trong review-service)
  - Ra quyết định Accept/Reject papers
  - Xem tất cả submissions và reviews
- **PC_MEMBER (Thành viên Ban Chương trình):** Người review papers, có quyền:
  - Xem papers được phân công (trong review-service)
  - Submit reviews và scores
  - Thảo luận nội bộ với PC khác

**Workflow thực tế:**
1. User tạo conference → Tự động trở thành CHAIR của conference đó
2. CHAIR mời PC Members → Dùng `POST /conferences/:id/members` để thêm reviewers
3. PC Members nhận assignments → Trong review-service, họ được gán papers để review
4. CHAIR theo dõi progress và ra quyết định → Dựa trên reviews từ PC members

**Ví dụ:**
```
Conference ID 1: "International UTH Conference 2025"
├── CHAIR: User ID 15 (Bùi Văn Huy) - Tạo conference
├── PC_MEMBER: User ID 5 (Nguyễn Văn A) - Được mời review
└── PC_MEMBER: User ID 6 (Trần Thị B) - Được mời review
```

**Endpoints:**

- **Lấy danh sách members:** `GET /conferences/:id/members`
  - Trả về tất cả CHAIR và PC_MEMBER của conference
  - Chỉ CHAIR hoặc ADMIN mới xem được

- **Thêm member:** `POST /conferences/:id/members`
  - Headers: `Authorization: Bearer <token>` (phải là CHAIR hoặc ADMIN)
  - Body:
  ```json
  {
    "userId": 5,
    "role": "PC_MEMBER"  // hoặc "CHAIR" (nếu muốn thêm CHAIR khác)
  }
  ```
  - **Lưu ý:** `userId` phải là ID của user đã tồn tại trong identity-service

- **Xóa member:** `DELETE /conferences/:id/members/:userId`
  - Xóa user khỏi PC của conference
  - Chỉ CHAIR hoặc ADMIN mới xóa được

**Ví dụ sử dụng:**
```bash
# 1. CHAIR xem danh sách PC members
GET http://localhost:3002/api/conferences/1/members
Authorization: Bearer <token_của_CHAIR>

# 2. CHAIR mời PC member mới
POST http://localhost:3002/api/conferences/1/members
Authorization: Bearer <token_của_CHAIR>
Body: { "userId": 5, "role": "PC_MEMBER" }

# 3. CHAIR xóa PC member
DELETE http://localhost:3002/api/conferences/1/members/5
Authorization: Bearer <token_của_CHAIR>
```

### 5.7 Lưu ý quyền
- Yêu cầu token hợp lệ từ identity-service.
- **ADMIN:** Thao tác được tất cả conference (không cần là member).
- **CHAIR:** Chỉ quản lý conference mà mình là member với role CHAIR.
- **PC_MEMBER:** Không có quyền quản lý conference, chỉ review papers được phân công.
