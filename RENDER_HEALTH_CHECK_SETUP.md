# Hướng dẫn cấu hình Health Check trên Render để tránh 502

## Vấn đề
Render.com free tier tự động tắt các service sau 15 phút không có traffic, dẫn đến lỗi 502.

## Giải pháp
Đã thêm health check endpoints cho tất cả services. Bạn cần cấu hình Render để ping các endpoints này định kỳ.

## Health Check Endpoints

### API Gateway
- **URL**: `https://your-api-gateway-url.onrender.com/health`
- **Response**: `{ "status": "ok", "service": "api-gateway", "timestamp": "..." }`

### Identity Service
- **URL**: `https://your-identity-service-url.onrender.com/api/health`
- **Response**: `{ "status": "ok", "service": "identity-service", "timestamp": "..." }`

### Conference Service
- **URL**: `https://your-conference-service-url.onrender.com/api/health`
- **Response**: `{ "status": "ok", "service": "conference-service", "timestamp": "..." }`

### Submission Service
- **URL**: `https://your-submission-service-url.onrender.com/api/health`
- **Response**: `{ "status": "ok", "service": "submission-service", "timestamp": "..." }`

### Review Service
- **URL**: `https://your-review-service-url.onrender.com/api/health`
- **Response**: `{ "status": "ok", "service": "review-service", "timestamp": "..." }`

## Cách cấu hình trên Render

### Bước 1: Cấu hình Health Check trong Render Dashboard

1. Vào **Render Dashboard** → Chọn service của bạn
2. Vào tab **Settings** → Scroll xuống phần **Health Check**
3. Cấu hình như sau:
   - **Health Check Path**: `/health` (cho API Gateway) hoặc `/api/health` (cho các service khác)
   - **Health Check Interval**: `5 minutes` (hoặc tối thiểu có thể)
   - **Timeout**: `10 seconds`

### Bước 2: Sử dụng External Ping Service (Khuyến nghị)

Nếu Render không có tùy chọn health check tự động, sử dụng dịch vụ bên ngoài:

#### Option 1: UptimeRobot (Miễn phí)
1. Đăng ký tại https://uptimerobot.com
2. Thêm monitor cho mỗi service:
   - **Monitor Type**: HTTP(s)
   - **URL**: Health check endpoint của service
   - **Monitoring Interval**: 5 minutes
   - **Alert Contacts**: Email của bạn

#### Option 2: cron-job.org
1. Đăng ký tại https://cron-job.org
2. Tạo cron job:
   - **URL**: Health check endpoint
   - **Schedule**: Mỗi 5 phút (`*/5 * * * *`)
   - **Request Method**: GET

#### Option 3: Render Scheduled Jobs (Nếu có)
Nếu Render hỗ trợ scheduled jobs, tạo job ping health check mỗi 5 phút.

## Cấu hình cho từng Service trên Render

### API Gateway
```
Health Check Path: /health
```

### Identity Service
```
Health Check Path: /api/health
```

### Conference Service
```
Health Check Path: /api/health
```

### Submission Service
```
Health Check Path: /api/health
```

### Review Service
```
Health Check Path: /api/health
```

## Kiểm tra Health Check

Sau khi deploy, test các endpoints:

```bash
# API Gateway
curl https://your-api-gateway-url.onrender.com/health

# Identity Service
curl https://your-identity-service-url.onrender.com/api/health

# Conference Service
curl https://your-conference-service-url.onrender.com/api/health

# Submission Service
curl https://your-submission-service-url.onrender.com/api/health

# Review Service
curl https://your-review-service-url.onrender.com/api/health
```

## Lưu ý

1. **Interval**: Ping ít nhất mỗi 10-14 phút để tránh service bị tắt
2. **Timeout**: Đảm bảo timeout đủ lớn (30s) để service có thời gian khởi động
3. **Monitoring**: Theo dõi logs để đảm bảo health checks hoạt động đúng
4. **Cost**: Nếu upgrade lên paid plan, services sẽ không bị tắt tự động

## Cải thiện đã thực hiện

1. ✅ Thêm health check endpoints cho tất cả services
2. ✅ Cải thiện API Gateway với timeout và error handling
3. ✅ Bind tất cả services vào `0.0.0.0` để hoạt động trong Docker/cloud
4. ✅ Thêm health check proxy endpoints trong API Gateway (`/health/identity`, `/health/conference`, etc.)
