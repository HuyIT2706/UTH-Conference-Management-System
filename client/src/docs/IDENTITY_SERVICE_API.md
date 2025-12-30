# Identity Service API Documentation

## Base URL
- **Development**: `http://localhost:3001/api`
- **Production**: Thông qua API Gateway tại `http://localhost:3000/api`

## Authentication Endpoints (`/auth`)

### 1. POST `/auth/register`
**Đăng ký tài khoản mới**

**Request Body:**
```typescript
{
  email: string;        // Email đăng ký
  password: string;     // Mật khẩu (tối thiểu 6 ký tự)
  fullName: string;     // Họ và tên
}
```

**Response:**
```typescript
{
  message: string;
  user: {
    id: number;
    email: string;
    fullName: string;
    roles: string[];
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
  };
  message: "Vui lòng kiểm tra email để xác minh tài khoản"
}
```

**Status Codes:**
- `201`: Đăng ký thành công
- `400`: Email đã tồn tại hoặc dữ liệu không hợp lệ

---

### 2. POST `/auth/login`
**Đăng nhập và lấy JWT tokens**

**Request Body:**
```typescript
{
  email: string;        // Email đăng nhập
  password: string;     // Mật khẩu (tối thiểu 6 ký tự)
}
```

**Response:**
```typescript
{
  message: "Đăng nhập thành công",
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    email: string;
    fullName?: string;
    roles: string[];
  };
  expiresIn: string;        // Ví dụ: "3600"
  refreshExpiresIn: string; // Ví dụ: "7d"
}
```

**Status Codes:**
- `200`: Đăng nhập thành công
- `401`: Thông tin đăng nhập không hợp lệ hoặc tài khoản chưa xác minh email

**Lưu ý:**
- Tài khoản phải được xác minh email trước khi đăng nhập
- Nếu chưa xác minh, sẽ trả về lỗi: "Tài khoản chưa được xác minh email. Vui lòng kiểm tra email."

---

### 3. POST `/auth/refresh-token`
**Làm mới access token bằng refresh token**

**Request Body:**
```typescript
{
  refreshToken: string;
}
```

**Response:**
```typescript
{
  message: "Làm mới access token thành công",
  accessToken: string;
  refreshToken: string;  // Refresh token mới
  user: {
    id: number;
    email: string;
    fullName?: string;
    roles: string[];
  };
  expiresIn: string;
  refreshExpiresIn: string;
}
```

**Status Codes:**
- `200`: Token được làm mới thành công
- `401`: Refresh token không hợp lệ hoặc đã hết hạn

**Lưu ý:**
- Refresh token cũ sẽ bị xóa sau khi refresh thành công (rotation)

---

### 4. POST `/auth/logout`
**Đăng xuất và thu hồi refresh token**

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request Body:**
```typescript
{
  refreshToken: string;
}
```

**Response:**
```typescript
{
  message: "Đã đăng xuất"
}
```

**Status Codes:**
- `200`: Đăng xuất thành công
- `401`: Không có quyền truy cập

---

### 5. GET `/auth/verify-email`
**Xác minh email bằng token**

**Query Parameters:**
```
?token=<verification_token>
```

**Response:**
```typescript
{
  message: "Xác minh email thành công"
}
```

**Status Codes:**
- `200`: Xác minh email thành công
- `404`: Token không hợp lệ
- `401`: Token đã hết hạn

**Lưu ý:**
- Token có thời hạn 24 giờ
- Token chỉ dùng được 1 lần

---

### 6. GET `/auth/get-verification-token`
**[DEV ONLY] Lấy verification token từ database**

**Query Parameters:**
```
?email=<user_email>
```

**Response:**
```typescript
{
  message: string;
  data: {
    email: string;
    token: string;
    expiresAt: string;
    verifyUrl: string;
    isVerified: boolean;
  }
}
```

**Status Codes:**
- `200`: Lấy token thành công
- `404`: User không tồn tại

**Lưu ý:**
- Chỉ dùng trong development để test
- Nếu email đã được xác minh, sẽ trả về `isVerified: true`

---

## Users Endpoints (`/users`)

### 7. GET `/users/profile`
**Lấy thông tin profile của user hiện tại**

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response:**
```typescript
{
  message: "Lấy thông tin người dùng thành công",
  user: {
    id: number;
    email: string;
    fullName?: string;
    roles: string[];
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
  }
}
```

**Status Codes:**
- `200`: Lấy thông tin thành công
- `401`: Không có quyền truy cập

---

### 8. PATCH `/users/change-password`
**Đổi mật khẩu**

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request Body:**
```typescript
{
  oldPassword: string;   // Mật khẩu cũ
  newPassword: string;   // Mật khẩu mới (tối thiểu 6 ký tự)
}
```

**Response:**
```typescript
{
  message: "Đổi mật khẩu thành công"
}
```

**Status Codes:**
- `200`: Đổi mật khẩu thành công
- `400`: Mật khẩu cũ không đúng
- `401`: Không có quyền truy cập

---

### 9. POST `/users/forgot-password`
**Gửi mã reset mật khẩu qua email**

**Request Body:**
```typescript
{
  email: string;
}
```

**Response:**
```typescript
{
  message: "Đã gửi mã reset mật khẩu tới email (nếu tồn tại)"
}
```

**Status Codes:**
- `200`: Đã gửi mã (luôn trả về 200, không tiết lộ email có tồn tại hay không)

**Lưu ý:**
- Mã reset là 6 chữ số
- Mã có thời hạn 15 phút
- Mã được log ra console trong development (chưa tích hợp email service)

---

### 10. POST `/users/reset-password`
**Reset mật khẩu bằng mã code**

**Request Body:**
```typescript
{
  email: string;
  code: string;         // Mã 6 chữ số từ email
  newPassword: string;   // Mật khẩu mới (tối thiểu 6 ký tự)
}
```

**Response:**
```typescript
{
  message: "Reset mật khẩu thành công"
}
```

**Status Codes:**
- `200`: Reset mật khẩu thành công
- `401`: Mã reset không hợp lệ hoặc đã hết hạn
- `404`: User không tồn tại

**Lưu ý:**
- Mã chỉ dùng được 1 lần
- Mã có thời hạn 15 phút

---

### 11. POST `/users/create`
**[ADMIN ONLY] Tạo user mới với role tùy chỉnh**

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request Body:**
```typescript
{
  email: string;
  password: string;      // Tối thiểu 6 ký tự
  fullName: string;
  role: RoleName;        // ADMIN | CHAIR | AUTHOR | REVIEWER | PC_MEMBER
}
```

**Response:**
```typescript
{
  message: "Tạo tài khoản thành công",
  user: {
    id: number;
    email: string;
    fullName: string;
    roles: string[];
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
  }
}
```

**Status Codes:**
- `201`: Tạo user thành công
- `403`: Không có quyền ADMIN
- `400`: Email đã tồn tại

---

### 12. PATCH `/users/:id/roles`
**[ADMIN ONLY] Cập nhật role cho user**

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request Body:**
```typescript
{
  role: RoleName;        // ADMIN | CHAIR | AUTHOR | REVIEWER | PC_MEMBER
}
```

**Response:**
```typescript
{
  message: "Cập nhật vai trò người dùng thành công",
  user: {
    id: number;
    email: string;
    fullName?: string;
    roles: string[];
    // ...
  }
}
```

**Status Codes:**
- `200`: Cập nhật role thành công
- `403`: Không có quyền ADMIN
- `404`: User không tồn tại

---

### 13. DELETE `/users/:id`
**[ADMIN ONLY] Xóa user**

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response:**
```typescript
{
  message: "Xóa user thành công"
}
```

**Status Codes:**
- `200`: Xóa user thành công
- `403`: Không có quyền ADMIN
- `404`: User không tồn tại

---

## Roles

Các roles có sẵn trong hệ thống:
- `ADMIN`: Quản trị viên
- `CHAIR`: Chủ tịch hội nghị
- `AUTHOR`: Tác giả
- `REVIEWER`: Người đánh giá
- `PC_MEMBER`: Thành viên ban chương trình

---

## Error Responses

Tất cả các lỗi đều trả về format:
```typescript
{
  message: string;       // Thông báo lỗi bằng tiếng Việt
  statusCode: number;
  error?: string;
}
```

---

## Notes

1. **Email Verification**: 
   - User phải verify email trước khi login
   - Token verification có thời hạn 24 giờ
   - Có thể dùng `/auth/get-verification-token` trong development để lấy token

2. **Password Reset**:
   - Mã reset là 6 chữ số
   - Mã có thời hạn 15 phút
   - Mã chỉ dùng được 1 lần
   - Trong development, mã được log ra console

3. **Token Management**:
   - Access token: Thời hạn mặc định 3600 giây (1 giờ)
   - Refresh token: Thời hạn mặc định 7 ngày
   - Refresh token rotation: Token cũ bị xóa khi refresh

4. **Security**:
   - Tất cả passwords được hash bằng bcrypt (10 rounds)
   - JWT tokens chứa user ID, email, fullName, và roles
   - Protected endpoints yêu cầu Bearer token trong header





