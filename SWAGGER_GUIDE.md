# Swagger/OpenAPI Documentation Guide

## Tổng quan

Tất cả 4 backend services đã được tích hợp Swagger/OpenAPI để tạo tài liệu API tự động và dễ sử dụng.

## URLs Swagger

Sau khi khởi động các services, bạn có thể truy cập Swagger UI tại:

- **Identity Service**: http://localhost:3001/api/docs
- **Conference Service**: http://localhost:3002/api/docs
- **Submission Service**: http://localhost:3003/api/docs
- **Review Service**: http://localhost:3004/api/docs

## Tính năng

### 1. JWT Authentication
Tất cả services đã được cấu hình để hỗ trợ JWT Bearer token:
- Click vào nút **"Authorize"** (🔒) ở đầu trang Swagger
- Nhập JWT token (bắt đầu với `Bearer ` hoặc chỉ token)
- Token sẽ được áp dụng cho tất cả các requests

### 2. Try it out
- Mỗi endpoint đều có nút **"Try it out"** để test trực tiếp
- Swagger tự động generate request body dựa trên DTOs
- Response sẽ hiển thị ngay trong Swagger UI

### 3. Schema Documentation
- Tất cả DTOs đã được document với `@ApiProperty`
- Request/Response examples đã được cấu hình
- Enum values được hiển thị rõ ràng

## Cách sử dụng

### Bước 1: Lấy JWT Token
1. Mở Swagger của Identity Service: http://localhost:3001/api/docs
2. Test endpoint `POST /auth/login` với credentials:
   ```json
   {
     "email": "user@example.com",
     "password": "password123"
   }
   ```
3. Copy `accessToken` từ response

### Bước 2: Authorize trong Swagger
1. Click nút **"Authorize"** ở đầu trang
2. Nhập token (có thể bỏ qua `Bearer ` prefix)
3. Click **"Authorize"** và **"Close"**

### Bước 3: Test các endpoints
- Bây giờ bạn có thể test tất cả các protected endpoints
- Request sẽ tự động include `Authorization: Bearer <token>` header

## Các endpoints đã được document

### Identity Service
- ✅ Authentication (register, login, refresh-token, logout, verify-email)
- ✅ Users (profile, change-password, create-user, update-roles)

### Conference Service
- ✅ Conferences (CRUD operations)
- ✅ Tracks management
- ✅ CFP Settings
- ✅ Conference Members
- ✅ Templates (Email, Form, CFP)
- ✅ Notifications
- ✅ Reporting & Analytics
- ✅ Audit Logs

### Submission Service
- ✅ Submissions (create, list, get detail, update, delete)
- ✅ Upload PDF files
- ✅ Version history
- ✅ Camera-ready upload
- ✅ Reviews (anonymized)

### Review Service
- ✅ Bidding/Preferences
- ✅ Assignments (manual & auto)
- ✅ Reviews submission
- ✅ PC Discussions
- ✅ Decisions
- ✅ Rebuttals
- ✅ Progress tracking

## Tips

1. **Chỉnh sửa JSON Body**: 
   - Click **"Try it out"** trên bất kỳ endpoint nào
   - Swagger sẽ hiển thị JSON body với example values đã được điền sẵn
   - Bạn có thể chỉnh sửa trực tiếp JSON trong textarea để thay đổi giá trị
   - Click **"Execute"** để gửi request với JSON đã chỉnh sửa

2. **File Upload**: Với endpoints có file upload (như create submission), Swagger UI sẽ tự động hiển thị file picker
3. **Query Parameters**: Các query params như pagination sẽ được hiển thị dưới dạng input fields
4. **Response Examples**: Click vào response schema để xem cấu trúc dữ liệu chi tiết
5. **Error Responses**: Tất cả các error codes đã được document (400, 401, 403, 404, etc.)
6. **Example Values**: Tất cả các DTOs đã có example values mặc định để dễ test

## Cải thiện tương lai

- [ ] Thêm response examples cụ thể hơn
- [ ] Thêm tags và grouping tốt hơn cho các endpoints
- [ ] Thêm server configurations cho different environments
- [ ] Export OpenAPI spec để tích hợp với Postman/Insomnia
- [ ] Thêm API versioning trong Swagger

