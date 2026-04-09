# Identity Service - BVA Postman Test Cases

Tài liệu này tổng hợp các Test Cases theo phương pháp **Boundary Value Analysis (BVA)** & **Integration Test Cases (ITC)** dành riêng cho module `identity-service`, kèm theo các JSON request body (Postman) để phục vụ cho việc kiểm thử. Bộ test này đã được bổ sung đầy đủ 100% các biên khó nhất (Max length, Khuyết trường, Dữ liệu Trim, ranh giới Enum, v.v.).

---

## 📋 Danh sách Test Cases Bổ Sung BVA (Dành cho Excel / Docs)

| Test Case ID | Function Name | Test Case Description | Test Case Procedure (Input) | Expected Results | Pre-conditions |
| --- | --- | --- | --- | --- | --- |
| 
| BVA_1.11 | register | Password vượt biên trên (256 ký tự) | Điền password = chuỗi 256 ký tự "A" | HTTP 400 (lỗi validation) hoặc 500 (Bcrypt/DB quá tải). | Email chưa đăng ký |
| BVA_1.12 | register | fullName đúng 1 ký tự (biên nhỏ nhất) | Điền fullName = "A". | HTTP 400 (nếu có @MinLength(2)) hoặc HTTP 201 thành công. | Email chưa đăng ký |
| BVA_1.13 | register | Thiếu hẳn trường fullName (Missing key) | Gửi body chỉ có email và password, không có chữ fullName. | HTTP 400. Lỗi missing property (do @IsNotEmpty hoặc @IsDefined). | Email chưa đăng ký |
| BVA_1.14 | register | Dữ liệu có chứa khoảng trắng 2 đầu | Điền email = " a@test.com ", fullName = " Huy ". | HTTP 201 nếu có middleware Trim(), hoặc 400 do sai email format. | Email chưa đăng ký |
| BVA_2.4 | login | Email có khoảng trắng thừa | Điền email = " user@gmail.com " kèm pass đúng. | HTTP 200 (nếu hệ thống tự cắt khoảng trắng) hoặc 401. | Email đã tồn tại và verify |
| BVA_5.9 | verifyEmail | Mã OTP bằng 0 tuyệt đối ("000000") | Nhập token = "000000". | HTTP 401 (Mã sai/hết hạn) hoặc HTTP 400 (Validation fail). | Có request xác minh trước đó |
| BVA_5.10 | verifyEmail | OTP 6 ký tự xen lẫn chữ cái (vd: "12a456") | Nhập token = "12a456". | HTTP 400. Lỗi validation DTO (như @IsNumberString). | Có request xác minh trước đó |
| BVA_9.6 | changePassword | Mật khẩu mới giống hệt Mật khẩu cũ | Nhập oldPassword = "xyz", newPassword = "xyz". | HTTP 400 "Mật khẩu mới trùng mật khẩu cũ" (hoặc qua lọt nếu chưa code). | Tài khoản đang đăng nhập |
| BVA_12.5 | verifyResetCode | Mã khôi phục 6 ký tự chứa chữ cái | Nhập code = "1a2b3c". | HTTP 400. Lỗi Validation mã Code không phải là dạng số. | Có request quên mặt khẩu trước |
| BVA_16.5 | createUser | Trường Role là chuỗi rỗng | Nhập role = "". | HTTP 400. Lỗi validation không nằm trong Enum hợp lệ. | Login bằng quyền Admin |
| BVA_16.6 | createUser | Trường Role bị gửi là Null | Nhập role = null. | HTTP 400. Lỗi thiếu dữ liệu Role. | Login bằng quyền Admin |

---

## 🚀 Postman Request Bodies

Sử dụng trực tiếp các snippet dưới đây để dán vào `Body -> raw (JSON)` trong Postman.

### 1. Register (`POST /auth/register`)
```json
// BVA_1.1: Password đúng 5 ký tự (dưới biên)
{ "email": "bva1.1@gmail.com", "password": "12345", "fullName": "Nguyễn Văn A" }

// BVA_1.2: Password đúng 6 ký tự (biên dưới hợp lệ)
{ "email": "bva1.2@gmail.com", "password": "123456", "fullName": "Nguyễn Văn A" }

// BVA_1.3: Password đúng 7 ký tự (trên biên dưới)
{ "email": "bva1.3@gmail.com", "password": "1234567", "fullName": "Nguyễn Văn A" }

// BVA_1.4: fullName dài đúng 50 ký tự (biên trên hợp lệ DB)
{ "email": "bva1.4@gmail.com", "password": "password123", "fullName": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" }

// BVA_1.5: fullName dài 51 ký tự (vượt biên trên DB)
{ "email": "bva1.5@gmail.com", "password": "password123", "fullName": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" }

// BVA_1.6: Email dài đúng 150 ký tự (Ví dụ: phần user 140 ký tự)
{ "email": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa@test.com", "password": "password123", "fullName": "Nguyễn Văn A" }

// BVA_1.7: Email dài 151 ký tự (vượt max email)
{ "email": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa@test.com", "password": "password123", "fullName": "Nguyễn Văn A" }

// BVA_1.8: fullName là chuỗi rỗng
{ "email": "bva1.8@gmail.com", "password": "password123", "fullName": "" }

// BVA_1.9: Password là chuỗi rỗng
{ "email": "bva1.9@gmail.com", "password": "", "fullName": "Nguyễn Văn A" }

// --- CÁC TRƯỜNG HỢP BỔ SUNG ĐỂ ĐẠT 100% CỦA BVA ---

// BVA_1.10: Password đạt biên trên 255 ký tự (Max)
{ "email": "bva1.10@gmail.com", "password": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", "fullName": "Nguyễn Văn A" }

// BVA_1.11: Password 256 ký tự (Vượt Max)
{ "email": "bva1.11@gmail.com", "password": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", "fullName": "Nguyễn Văn A" }

// BVA_1.12: fullName ngắn nhất (Đúng 1 ký tự)
{ "email": "bva1.12@gmail.com", "password": "password123", "fullName": "A" }

// BVA_1.13: Thiếu hẳn trường fullName (Undefined field - Test DTO @IsNotEmpty / @IsDefined)
{ "email": "bva1.13@gmail.com", "password": "password123" }

// BVA_1.14: Test tính năng tự động Trim (Khoảng trắng trước và sau)
{ "email": " bva1.14@gmail.com ", "password": " password123 ", "fullName": " Nguyễn Văn A " }
```

### 2. Login (`POST /auth/login`)
```json
// BVA_2.1: Password đúng 5 ký tự
{ "email": "user@gmail.com", "password": "12345" }

// BVA_2.2: Password đúng 6 ký tự
{ "email": "user@gmail.com", "password": "123456" }

// BVA_2.3: Email rỗng ""
{ "email": "", "password": "password123" }

// BVA_2.4: Email có khoảng trắng dư thừa
{ "email": " user@gmail.com ", "password": "password123" }
```

### 3. Refresh Token (`POST /auth/refresh-token`)
```json
// BVA_3.1: Refresh token rỗng
{ "refreshToken": "" }

// BVA_3.2: Refresh token gần hết hạn
{ "refreshToken": "eyJhbGciOiJIUzI1Ni...<token_sắp_hết_hạn>" }
```

### 4. Verify Email (`POST /auth/verify-email`)
*(Lưu ý: BVA 5.5, 5.6, 5.7 kiểm tra thời gian nên dùng body 5.2 bấm Send trên Postman ở các mốc thời gian khác nhau)*
```json
// BVA_5.1: Mã OTP 5 ký tự
{ "email": "user@gmail.com", "token": "99999" } 

// BVA_5.2: Mã OTP 6 ký tự chuẩn (biên giới hạn hợp lệ 100000)
{ "email": "user@gmail.com", "token": "100000" }

// BVA_5.3: Mã OTP 6 ký tự đúng (biên lớn nhất)
{ "email": "user@gmail.com", "token": "999999" }

// BVA_5.4: Mã OTP 7 ký tự (vượt biên)
{ "email": "user@gmail.com", "token": "1000000" }

// BVA_5.8: Mã OTP rỗng ""
{ "email": "user@gmail.com", "token": "" }

// --- CÁC TRƯỜNG HỢP BỔ SUNG ĐỂ ĐẠT 100% CỦA BVA ---

// BVA_5.9: Mã OTP giá trị bằng 0 tuyệt đối 
{ "email": "user@gmail.com", "token": "000000" }

// BVA_5.10: Mã OTP độ dài chuẩn (6 chars) nhưng bị xen lẫn chữ (Test DTO Regex/IsNumberString)
{ "email": "user@gmail.com", "token": "12a456" }
```

### 5. Change Password (`POST /auth/change-password` / `/users/change-password`) 
*(Yêu cầu Header: Authorization Bearer Token)*
```json
// BVA_9.1: newPassword đúng 5 ký tự
{ "oldPassword": "password123", "newPassword": "12345" }

// BVA_9.2: newPassword đúng 6 ký tự
{ "oldPassword": "password123", "newPassword": "123456" }

// BVA_9.3: newPassword đúng 7 ký tự
{ "oldPassword": "password123", "newPassword": "1234567" }

// BVA_9.4: newPassword rỗng ""
{ "oldPassword": "password123", "newPassword": "" }

// BVA_9.5: oldPassword rỗng ""
{ "oldPassword": "", "newPassword": "newpassword123" }

// --- BỔ SUNG ---
// BVA_9.6: newPassword giống hệt oldPassword (Logical Boundary)
{ "oldPassword": "password123", "newPassword": "password123" }
```

### 6. Quên & Khôi phục Mật Khẩu
#### Quên mật khẩu (`POST /auth/forgot-password`)
```json
// Gửi yêu cầu xin code (Function 11)
{ "email": "user@gmail.com" }
```

#### Xác thực mã Reset (`POST /auth/verify-reset-code`)
```json
// BVA_12.1: OTP reset 5 chữ số
{ "email": "user@gmail.com", "code": "99999" }

// BVA_12.2: OTP reset 7 chữ số
{ "email": "user@gmail.com", "code": "1000000" }

// BVA_12.4: OTP rỗng ""
{ "email": "user@gmail.com", "code": "" }

// BVA_12.5: OTP 6 ký tự nhưng có chứa chữ
{ "email": "user@gmail.com", "code": "1a2b3c" }
```

#### Đặt lại mật khẩu (`POST /auth/reset-password`)
```json
// BVA_13.1: newPassword đúng 5 ký tự
{ "email": "user@gmail.com", "code": "123456", "newPassword": "12345" }

// BVA_13.2: newPassword đúng 6 ký tự
{ "email": "user@gmail.com", "code": "123456", "newPassword": "123456" }

// BVA_13.3: newPassword rỗng ""
{ "email": "user@gmail.com", "code": "123456", "newPassword": "" }
```

### 7. View/Delete User by ID trên URL (`GET`, `DELETE`)
Với các hàm này, **KHÔNG CẦN BODY MÀ SỬA TRỰC TIẾP TRÊN URL**:
*   `GET /users/0` (BVA_15.1: Zero ID)
*   `GET /users/-1` (BVA_15.3: Âm)
*   `GET /users/2147483647` (BVA_15.4: MAX INT)
*   `GET /users/2147483648` (BVA_15.5: Vượt MAX INT)
*   `GET /users/1.5` (BVA_15.6: Số thập phân)

### 8. Create User (`POST /users` - Quyền Admin)
```json
// BVA_16.1: Password đúng 5 ký tự
{ "email": "user161@gmail.com", "password": "12345", "fullName": "Test Admin", "role": "AUTHOR" }

// BVA_16.2: Password đúng 6 ký tự
{ "email": "user162@gmail.com", "password": "123456", "fullName": "Test Admin", "role": "AUTHOR" }

// BVA_16.4: fullName 51 ký tự (vượt biên)
{ "email": "user164@gmail.com", "password": "password123", "fullName": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", "role": "AUTHOR" }

// --- BỔ SUNG BIÊN LỖI ENUM QUAN TRỌNG ---
// BVA_16.5: Role là chuỗi rỗng ""
{ "email": "user165@gmail.com", "password": "password123", "fullName": "Test", "role": "" }

// BVA_16.6: Cố tình truyền Role Null
{ "email": "user166@gmail.com", "password": "password123", "fullName": "Test", "role": null }
```

### 9. Update User Role (`PATCH /users/:id/roles`)
Điều chỉnh `:id` trên URL giống phần trên (vd: `/users/0/roles`) kèm Body:
```json
// Test chuẩn
{ "role": "REVIEWER" }

// Test biên Enum rỗng / null
{ "role": "" }
```
