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

Base URL cho `conference-service`:

```text
http://localhost:3002/api
```

### 6.1 Tạo Conference

- Method: `POST`
- URL: `http://localhost:3002/api/conferences`
- Headers:
  - `Authorization: Bearer <JWT_ACCESS_TOKEN>`
  - `Content-Type: application/json`
- Body (JSON):

```json
{
  "name": "International UTH Conference 2025",
  "startDate": "2025-06-01T09:00:00Z",
  "endDate": "2025-06-03T18:00:00Z",
  "venue": "HCMC University of Transport"
}
```

### 6.2 Danh sách Conference

- Method: `GET`
- URL: `http://localhost:3002/api/conferences`

Trả về mảng các conference (kèm `tracks`).

### 6.3 Lấy chi tiết 1 Conference

- Method: `GET`
- URL: `http://localhost:3002/api/conferences/:id`

### 6.4 Thêm Track vào Conference

- Method: `POST`
- URL: `http://localhost:3002/api/conferences/:id/tracks`
- Headers:
  - `Authorization: Bearer <JWT_ACCESS_TOKEN>`
  - `Content-Type: application/json`
- Body (JSON):

```json
{
  "name": "AI Track"
}
```

### 6.5 Thiết lập CFP (Deadline) cho Conference

- Method: `POST`
- URL: `http://localhost:3002/api/conferences/:id/cfp`
- Headers:
  - `Authorization: Bearer <JWT_ACCESS_TOKEN>`
  - `Content-Type: application/json`
- Body (JSON):

```json
{
  "submissionDeadline": "2025-03-01T23:59:59Z",
  "reviewDeadline": "2025-03-15T23:59:59Z",
  "notificationDate": "2025-04-01T12:00:00Z",
  "cameraReadyDeadline": "2025-04-15T23:59:59Z"
}
```
