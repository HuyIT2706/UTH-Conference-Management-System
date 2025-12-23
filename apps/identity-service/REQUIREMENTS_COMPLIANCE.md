# Đối Chiếu Yêu Cầu - Identity Service vs UTH-ConfMS Requirements

## 📊 Tổng Quan So Sánh

Tài liệu này so sánh các yêu cầu từ đề tài UTH-ConfMS với implementation hiện tại của Identity Service.

---

## ✅ Phần Đã Đáp Ứng

### 1. **Role-Based Access Control (RBAC)**

| Yêu Cầu | Trạng Thái | Ghi Chú |
|---------|-----------|---------|
| RBAC tập trung | ✅ **ĐÃ CÓ** | Đã implement với Roles Guard và decorator `@Roles()` |
| Roles: ADMIN, CHAIR, AUTHOR, REVIEWER, PC_MEMBER | ✅ **ĐÃ CÓ** | Tất cả 5 roles đã được định nghĩa trong `RoleName` enum |
| Many-to-Many User-Role | ✅ **ĐÃ CÓ** | User có thể có nhiều roles |
| Role-based endpoint protection | ✅ **ĐÃ CÓ** | Sử dụng `@UseGuards(JwtAuthGuard, RolesGuard)` và `@Roles()` |

### 2. **Authentication & Security**

| Yêu Cầu | Trạng Thái | Ghi Chú |
|---------|-----------|---------|
| Đăng ký/Đăng nhập | ✅ **ĐÃ CÓ** | `POST /api/auth/register`, `POST /api/auth/login` |
| JWT Authentication | ✅ **ĐÃ CÓ** | JWT với access token và refresh token |
| Password hashing | ✅ **ĐÃ CÓ** | Bcrypt với salt rounds = 10 |
| Refresh token mechanism | ✅ **ĐÃ CÓ** | Rotate refresh token, lưu trong database |
| Logout | ✅ **CÓ** | Xóa refresh token (nhưng access token vẫn dùng được) |
| HTTPS requirement | ⚠️ **CẦN CẤU HÌNH** | Cần cấu hình ở infrastructure level |

### 3. **User Management**

| Yêu Cầu | Trạng Thái | Ghi Chú |
|---------|-----------|---------|
| Tạo user với role tùy chỉnh | ✅ **ĐÃ CÓ** | `POST /api/users/create` (chỉ ADMIN) |
| Cập nhật roles | ✅ **ĐÃ CÓ** | `PATCH /api/users/:id/roles` (chỉ ADMIN) |
| Lấy profile | ✅ **ĐÃ CÓ** | `GET /api/users/profile` |
| Đổi mật khẩu | ✅ **ĐÃ CÓ** | `PATCH /api/users/change-password` |
| User entity với metadata | ✅ **ĐÃ CÓ** | email, fullName, isVerified, roles, timestamps |

---

## ⚠️ Phần Cần Bổ Sung/Cải Thiện

### 1. **Single Sign-On (SSO)**

| Yêu Cầu | Trạng Thái | Ghi Chú |
|---------|-----------|---------|
| SSO support | ❌ **CHƯA CÓ** | Cần implement OAuth2/OIDC hoặc SAML |
| Integration với external identity providers | ❌ **CHƯA CÓ** | Cần thêm module SSO |

**Khuyến nghị:**
- Implement OAuth2/OIDC provider
- Hoặc tích hợp với external SSO (Google, Microsoft, etc.)
- Thêm endpoint `/api/auth/sso/login` và `/api/auth/sso/callback`

### 2. **Audit Logs**

| Yêu Cầu | Trạng Thái | Ghi Chú |
|---------|-----------|---------|
| Full audit trails | ❌ **CHƯA CÓ** | Không có logging các hoạt động quan trọng |
| Activity logs | ❌ **CHƯA CÓ** | Cần log: login, logout, password change, role changes |

**Khuyến nghị:**
- Tạo `AuditLog` entity
- Log các events: login, logout, register, password change, role update, user creation
- Thêm endpoint `GET /api/admin/audit-logs` (chỉ ADMIN)

### 3. **Email Functionality**

| Yêu Cầu | Trạng Thái | Ghi Chú |
|---------|-----------|---------|
| Email verification | ⚠️ **CHƯA HOÀN THIỆN** | Có field `isVerified` nhưng chưa có flow verify |
| Forgot password email | ❌ **CHƯA CÓ** | Chỉ có khung xử lý, chưa gửi email |
| Reset password token | ❌ **CHƯA CÓ** | Reset password không an toàn (không có token) |
| Email templates | ❌ **CHƯA CÓ** | Cần template cho: verification, password reset, notifications |

**Khuyến nghị:**
- Tích hợp email service (Nodemailer, SendGrid, AWS SES)
- Tạo `EmailVerificationToken` và `PasswordResetToken` entities
- Implement endpoints:
  - `POST /api/users/verify-email/:token`
  - `POST /api/users/resend-verification`
  - `POST /api/users/forgot-password` (hoàn thiện)
  - `POST /api/users/reset-password/:token` (sửa lại)

### 4. **Multi-Tenancy (TP1)**

| Yêu Cầu | Trạng Thái | Ghi Chú |
|---------|-----------|---------|
| Multi-conference operations | ❌ **CHƯA CÓ** | Không có concept "conference" hay "tenant" |
| Tenancy settings | ❌ **CHƯA CÓ** | Cần thêm tenant isolation |

**Khuyến nghị:**
- Thêm `Conference` entity (hoặc `Tenant`)
- Thêm `UserConference` junction table để link user với conference
- Thêm conference context vào JWT payload
- Filter data theo conference trong các queries

### 5. **SMTP Configuration (TP1)**

| Yêu Cầu | Trạng Thái | Ghi Chú |
|---------|-----------|---------|
| SMTP configuration | ❌ **CHƯA CÓ** | Không có admin interface để cấu hình SMTP |
| Email quotas | ❌ **CHƯA CÓ** | Không có giới hạn số lượng email gửi |

**Khuyến nghị:**
- Tạo `SmtpConfig` entity
- Admin endpoint để cấu hình SMTP: `POST /api/admin/smtp/config`
- Implement email quota tracking
- Rate limiting cho email sending

### 6. **Backup & Restore (TP1)**

| Yêu Cầu | Trạng Thái | Ghi Chú |
|---------|-----------|---------|
| Backup/restore functionality | ❌ **CHƯA CÓ** | Không có admin tools cho backup |

**Khuyến nghị:**
- Implement database backup scripts
- Admin endpoint: `POST /api/admin/backup`, `POST /api/admin/restore`
- Hoặc dùng PostgreSQL native backup tools

### 7. **Security Enhancements**

| Yêu Cầu | Trạng Thái | Ghi Chú |
|---------|-----------|---------|
| Token blacklist | ⚠️ **CHƯA CÓ** | Access token không thể invalidate khi logout |
| Rate limiting | ❌ **CHƯA CÓ** | Không có protection khỏi brute force |
| Password strength validation | ⚠️ **CƠ BẢN** | Chỉ check độ dài tối thiểu, không check complexity |
| Email domain validation | ⚠️ **CƠ BẢN** | Chỉ check format, không check domain hợp lệ |

**Khuyến nghị:**
- Implement token blacklist (Redis hoặc database)
- Thêm rate limiting (ThrottlerModule từ @nestjs/throttler)
- Cải thiện password validation (uppercase, lowercase, number, special char)
- Optional: Email domain whitelist/blacklist

### 8. **Internationalization (i18n)**

| Yêu Cầu | Trạng Thái | Ghi Chú |
|---------|-----------|---------|
| English/Vietnamese UI | ⚠️ **MỘT PHẦN** | Error messages có cả tiếng Việt và tiếng Anh (không nhất quán) |
| Unicode support | ✅ **CÓ** | Database và API hỗ trợ Unicode |

**Khuyến nghị:**
- Sử dụng i18n library (nestjs-i18n)
- Thống nhất error messages
- Support language header: `Accept-Language: vi` hoặc `en`

---

## 📋 Mapping với Proposed Tasks (TP1-TP9)

### TP1 - Admin & Platform

| Component | Trạng Thái | Priority |
|-----------|-----------|----------|
| Tenancy | ❌ Chưa có | 🔴 **CAO** |
| RBAC | ✅ Đã có | - |
| SMTP/quota | ❌ Chưa có | 🟡 **TRUNG BÌNH** |
| Audit | ❌ Chưa có | 🟡 **TRUNG BÌNH** |
| Backup/restore | ❌ Chưa có | 🟢 **THẤP** |

**Completion: 20%** (chỉ có RBAC)

### TP2 - Conference & CFP

| Component | Trạng Thái | Priority |
|-----------|-----------|----------|
| Conference entity | ❌ Chưa có | 🔴 **CAO** |
| CFP configuration | ❌ Chưa có | 🔴 **CAO** |
| Tracks/topics | ❌ Chưa có | 🔴 **CAO** |
| Email templates | ❌ Chưa có | 🟡 **TRUNG BÌNH** |

**Completion: 0%** (không thuộc identity-service, thuộc conference-service)

### TP3-TP7: Submission, Review, Decision, etc.

**Completion: 0%** (không thuộc identity-service, thuộc các services khác)

---

## 🎯 Kết Luận & Khuyến Nghị

### Điểm Mạnh:
1. ✅ **RBAC đầy đủ**: Tất cả 5 roles cần thiết đã có
2. ✅ **Authentication flow cơ bản**: Register, login, refresh, logout đã hoạt động
3. ✅ **Security foundation**: JWT, bcrypt, guards đã được implement
4. ✅ **User management cơ bản**: CRUD operations cho users và roles

### Điểm Yếu & Cần Bổ Sung:

#### 🔴 **Ưu Tiên Cao (Critical):**
1. **Multi-tenancy**: Cần thêm conference/tenant concept để support multi-conference
2. **Email verification**: Hoàn thiện flow verify email
3. **Forgot/Reset password**: Sửa lại để an toàn (cần token)
4. **SSO**: Cần implement nếu yêu cầu SSO

#### 🟡 **Ưu Tiên Trung Bình (Important):**
1. **Audit logs**: Log các hoạt động quan trọng
2. **SMTP configuration**: Admin interface để cấu hình email
3. **Token blacklist**: Invalidate access token khi logout
4. **Rate limiting**: Bảo vệ khỏi brute force

#### 🟢 **Ưu Tiên Thấp (Nice to have):**
1. **i18n**: Thống nhất error messages
2. **Password strength**: Cải thiện validation
3. **Backup/restore**: Admin tools

### Đánh Giá Tổng Thể:

**Identity Service hiện tại đáp ứng khoảng 40-50% yêu cầu từ đề tài.**

**Phần đã đáp ứng tốt:**
- ✅ RBAC và roles
- ✅ Authentication cơ bản
- ✅ User management cơ bản

**Phần còn thiếu quan trọng:**
- ❌ Multi-tenancy (cần cho multi-conference)
- ❌ SSO (nếu yêu cầu)
- ❌ Audit logs
- ❌ Email functionality hoàn chỉnh
- ❌ SMTP configuration

### Roadmap Đề Xuất:

#### Phase 1 (Critical - 2-3 tuần):
1. Hoàn thiện forgot/reset password với token
2. Implement email verification flow
3. Thêm audit logging
4. Sửa bug JWT expiresIn

#### Phase 2 (Important - 2-3 tuần):
1. Implement multi-tenancy (conference concept)
2. SMTP configuration admin interface
3. Token blacklist
4. Rate limiting

#### Phase 3 (Nice to have - 1-2 tuần):
1. SSO (nếu cần)
2. i18n improvements
3. Backup/restore tools
4. Password strength validation

---

## 📝 Checklist Implementation

### Authentication & Security
- [x] Register/Login
- [x] JWT tokens
- [x] Refresh token
- [x] Logout (partial - cần blacklist)
- [ ] SSO
- [ ] Email verification
- [ ] Forgot password (hoàn thiện)
- [ ] Reset password (sửa lại)
- [ ] Token blacklist
- [ ] Rate limiting

### User Management
- [x] Create user
- [x] Update roles
- [x] Get profile
- [x] Change password
- [ ] Email verification
- [ ] User activation/deactivation

### RBAC
- [x] Roles: ADMIN, CHAIR, AUTHOR, REVIEWER, PC_MEMBER
- [x] Role guards
- [x] Multiple roles per user
- [ ] Permission-based access (nếu cần chi tiết hơn)

### Platform Features
- [ ] Multi-tenancy
- [ ] Audit logs
- [ ] SMTP configuration
- [ ] Email quotas
- [ ] Backup/restore
- [ ] i18n

---

*Tài liệu được tạo: $(date)*
*Dựa trên yêu cầu từ đề tài UTH-ConfMS và đánh giá Identity Service hiện tại*


