# So Sánh Yêu Cầu vs Đánh Giá Review Service

## 📋 Tổng Quan

Tài liệu này so sánh các **yêu cầu từ đề tài UTH-ConfMS** với **các vấn đề đã được chỉ ra trong REVIEW.md** để xác định mức độ phù hợp và các gap cần bổ sung.

---

## ✅ So Sánh Chi Tiết

### 1. 🔐 Security & Authentication

| Yêu Cầu Từ Đề Tài | Vấn Đề Trong REVIEW.md | Mức Độ Phù Hợp |
|-------------------|------------------------|----------------|
| **"strict role-based access control (RBAC)"** | ❌ Đang decode JWT thủ công, không verify signature | 🔴 **RẤT PHÙ HỢP** - Đây là lỗ hổng bảo mật nghiêm trọng |
| **"single-blind/double-blind review modes"** | ❌ Không có cấu hình review mode | 🔴 **RẤT PHÙ HỢP** - Thiếu tính năng bảo mật quan trọng |
| **"COI enforcement"** | ⚠️ Có check nhưng chưa đầy đủ | 🟡 **PHÙ HỢP** - Cần cải thiện |
| **"audit logs"** | ⚠️ Có createdAt/updatedAt nhưng thiếu full audit trail | 🟡 **PHÙ HỢP** - Cần bổ sung |
| **"HTTPS"** | ⚠️ Không đề cập trong review (có thể ở infrastructure) | 🟢 OK |

**Kết luận:** ✅ **RẤT PHÙ HỢP** - Vấn đề JWT authentication và thiếu review mode là **nghiêm trọng** và vi phạm trực tiếp yêu cầu "strict RBAC" và "single-blind/double-blind review modes"

---

### 2. 👤 Reviewer/PC Member Functional Requirements

| Yêu Cầu Từ Đề Tài | Hiện Trạng | Vấn Đề Trong REVIEW.md | Mức Độ Phù HỢP |
|-------------------|------------|------------------------|----------------|
| **"access assigned papers"** | ✅ Có `GET /api/reviews/assignments/me` | ✅ Đã có | ✅ **ĐÃ CÓ** |
| **"submit scores/reviews"** | ✅ Có `POST /api/reviews` | ✅ Đã có | ✅ **ĐÃ CÓ** |
| **"internal discussions"** | ✅ Có `POST /api/reviews/discussions` | ✅ Đã có | ✅ **ĐÃ CÓ** |
| **"declare decline/COI"** | ✅ Có bidding với CONFLICT | ✅ Đã có | ✅ **ĐÃ CÓ** |
| **"bidding"** | ✅ Có `POST /api/reviews/bids` | ✅ Đã có | ✅ **ĐÃ CÓ** |

**Kết luận:** ✅ **HOÀN TOÀN PHÙ HỢP** - Tất cả chức năng cơ bản cho Reviewer đã được implement

---

### 3. 🎯 Program/Track Chair Functional Requirements

| Yêu Cầu Từ Đề Tài | Hiện Trạng | Vấn Đề Trong REVIEW.md | Mức Độ Phù HỢP |
|-------------------|------------|------------------------|----------------|
| **"assign papers (manual)"** | ✅ Có `POST /api/reviews/assignments` | ✅ Đã có | ✅ **ĐÃ CÓ** |
| **"assign papers (automatic)"** | ❌ **THIẾU** | ❌ Thiếu automatic assignment logic | 🔴 **RẤT PHÙ HỢP** - Yêu cầu trong TP4 |
| **"track progress"** | ⚠️ Có `GET /api/reviews/submission/:id` | ⚠️ Thiếu dashboard/thống kê tiến độ | 🟡 **PHÙ HỢP** - Cần bổ sung |
| **"record decisions"** | ❌ **THIẾU** | ❌ Thiếu Entity/API để lưu quyết định | 🔴 **RẤT PHÙ HỢP** - Core requirement cho TP6 |
| **"bulk notifications"** | ❌ **THIẾU** | ❌ Thiếu bulk email với anonymized feedback | 🔴 **RẤT PHÙ HỢP** - Yêu cầu trong TP6 |
| **"aggregate reviews"** | ⚠️ Có xem reviews nhưng không có logic tổng hợp | ❌ Thiếu average score, consensus | 🔴 **RẤT PHÙ HỢP** - Core requirement |

**Kết luận:** ✅ **RẤT PHÙ HỢP** - Thiếu nhiều chức năng quan trọng cho Chair role, đặc biệt là **Decision & Review Aggregation** (TP6)

---

### 4. 📝 Review Workflow Requirements

| Yêu Cầu Từ Đề Tài | Hiện Trạng | Vấn Đề Trong REVIEW.md | Mức Độ Phù HỢP |
|-------------------|------------|------------------------|----------------|
| **"rebuttal window (optional)"** | ❌ **THIẾU** | ❌ Không có entity/API cho rebuttal | 🟡 **PHÙ HỢP** - Optional nhưng quan trọng |
| **"review progress tracking"** | ⚠️ Có xem reviews | ⚠️ Thiếu dashboard/SLA tracking | 🟡 **PHÙ HỢP** - Yêu cầu trong TP4 |
| **"COI enforcement"** | ✅ Có check khi assign | ⚠️ Cần cải thiện | 🟡 **PHÙ HỢP** |
| **"manual/automatic assignment"** | ✅ Manual: Có<br>❌ Automatic: **THIẾU** | ❌ Thiếu auto assignment by topic/keywords | 🔴 **RẤT PHÙ HỢP** - Yêu cầu trong TP4 |

**Kết luận:** ✅ **PHÙ HỢP** - Thiếu rebuttal window và automatic assignment

---

### 5. 🏢 Multi-Conference & Tenancy

| Yêu Cầu Từ Đề Tài | Hiện Trạng | Vấn Đề Trong REVIEW.md | Mức Độ Phù HỢP |
|-------------------|------------|------------------------|----------------|
| **"multi-conference operations"** (TP1) | ❌ **THIẾU** | ❌ Assignment/Review không có conferenceId | 🔴 **RẤT PHÙ HỢP** - Tenancy requirement |
| **"tenancy settings"** | ❌ **THIẾU** | ❌ Không có isolation giữa conferences | 🔴 **RẤT PHÙ HỢP** - Yêu cầu trong TP1 |

**Kết luận:** ✅ **RẤT PHÙ HỢP** - Thiếu multi-conference support là gap lớn cho tenancy

---

### 6. ✅ Validation & Integration

| Yêu Cầu Từ Đề Tài | Hiện Trạng | Vấn Đề Trong REVIEW.md | Mức Độ Phù HỢP |
|-------------------|------------|------------------------|----------------|
| **"verify submission exists"** | ❌ Chỉ mock check | ❌ Không verify với submission-service | 🔴 **RẤT PHÙ HỢP** - Cần tích hợp |
| **"verify reviewer exists"** | ❌ Chỉ check reviewerId > 0 | ❌ Không verify với identity-service | 🔴 **RẤT PHÙ HỢP** - Cần tích hợp |
| **"verify reviewer role"** | ❌ Không verify | ❌ Không verify reviewer có role REVIEWER | 🔴 **RẤT PHÙ HỢP** - Cần tích hợp |

**Kết luận:** ✅ **RẤT PHÙ HỢP** - Thiếu validation và integration với các services khác

---

### 7. ⚡ Performance & Scalability

| Yêu Cầu Từ Đề Tài | Hiện Trạng | Vấn Đề Trong REVIEW.md | Mức Độ Phù HỢP |
|-------------------|------------|------------------------|----------------|
| **"handle deadline peaks"** | ⚠️ Chưa có caching | ⚠️ Không có caching | 🟡 **PHÙ HỢP** |
| **"thousands of papers"** | ❌ Không có pagination | ❌ Các list endpoints không có pagination | 🔴 **RẤT PHÙ HỢP** - Gap nghiêm trọng |
| **"hundreds of concurrent users"** | ⚠️ Chưa test load | ⚠️ Không có load testing | 🟡 **PHÙ HỢP** |
| **Query optimization** | ⚠️ 2 queries thay vì join | ⚠️ `getReviewsBySubmission` có thể tối ưu | 🟡 **PHÙ HỢP** |

**Kết luận:** ✅ **RẤT PHÙ HỢP** - Thiếu pagination là vấn đề nghiêm trọng cho scalability

---

### 8. 📊 Reports & Analytics

| Yêu Cầu Từ Đề Tài | Hiện Trạng | Vấn Đề Trong REVIEW.md | Mức Độ Phù HỢP |
|-------------------|------------|------------------------|----------------|
| **"submissions by school/track"** | ❌ Không có | ❌ Không có reporting APIs | 🟡 **PHÙ HỢP** - Yêu cầu trong TP |
| **"acceptance rate"** | ❌ Không có | ❌ Không có analytics | 🟡 **PHÙ HỢP** - Yêu cầu trong TP |
| **"review SLA"** | ❌ Không có | ❌ Thiếu SLA tracking | 🟡 **PHÙ HỢP** - Yêu cầu trong TP |
| **"activity logs"** | ⚠️ Có createdAt/updatedAt | ⚠️ Thiếu full audit trail | 🟡 **PHÙ HỢP** - Cần bổ sung |

**Kết luận:** ✅ **PHÙ HỢP** - Cần bổ sung toàn bộ module reports & analytics

---

### 9. 🤖 AI-Assisted Features

| Yêu Cầu Từ Đề Tài | Hiện Trạng | Vấn Đề Trong REVIEW.md | Mức Độ Phù HỢP |
|-------------------|------------|------------------------|----------------|
| **"neutral summaries for bidding"** | ❌ Không có | ❌ Không có AI integration | 🟢 **OK** - Opt-in, future enhancement |
| **"reviewer-paper similarity hints"** | ❌ Không có | ❌ Không có AI features | 🟢 **OK** - Opt-in, future enhancement |
| **"feature flags per conference"** | ❌ Không có | ❌ Không có feature flags | 🟢 **OK** - Opt-in, future enhancement |
| **"AI governance controls"** | ❌ Không có | ❌ Không có audit logging cho AI | 🟢 **OK** - Opt-in, future enhancement |

**Kết luận:** ✅ **OK** - AI features là opt-in và có thể làm sau

---

### 10. 🧪 Testing

| Yêu Cầu Từ Đề Tài | Hiện Trạng | Vấn Đề Trong REVIEW.md | Mức Độ Phù HỢP |
|-------------------|------------|------------------------|----------------|
| **"Testing Document"** (TP9) | ❌ Không có tests | ❌ Không thấy test files | 🔴 **RẤT PHÙ HỢP** - Yêu cầu bắt buộc |

**Kết luận:** ✅ **RẤT PHÙ HỢP** - Testing là yêu cầu bắt buộc trong đề tài

---

### 11. 🗄️ Database Design

| Yêu Cầu Từ Đề Tài | Hiện Trạng | Vấn Đề Trong REVIEW.md | Mức Độ Phù HỢP |
|-------------------|------------|------------------------|----------------|
| **"data integrity"** | ⚠️ Thiếu unique constraint | ❌ Thiếu unique constraint trên assignments | 🟡 **PHÙ HỢP** - Cần bổ sung |
| **"audit trails"** | ⚠️ Có createdAt/updatedAt | ⚠️ Thiếu full audit trail | 🟡 **PHÙ HỢP** - Cần bổ sung |

**Kết luận:** ✅ **PHÙ HỢP** - Cần cải thiện database constraints và audit trails

---

## 📊 Tổng Kết So Sánh

### ✅ Các Nhận Xét PHÙ HỢP với Yêu Cầu

1. **🔴 CAO - Authentication & Authorization**
   - ✅ **RẤT PHÙ HỢP** - Vi phạm trực tiếp yêu cầu "strict RBAC"
   - Yêu cầu: "strict role-based access control (RBAC)"
   - Hiện tại: Decode JWT thủ công, không verify signature

2. **🔴 CAO - Thiếu Review Mode (Blind)**
   - ✅ **RẤT PHÙ HỢP** - Yêu cầu: "single-blind/double-blind review modes"
   - Hiện tại: Không có cấu hình review mode

3. **🔴 CAO - Thiếu Decision & Review Aggregation**
   - ✅ **RẤT PHÙ HỢP** - Yêu cầu: "aggregate reviews, Accept/Reject" (TP6)
   - Hiện tại: Không có Entity/API để lưu quyết định

4. **🔴 CAO - Thiếu Multi-Conference Support**
   - ✅ **RẤT PHÙ HỢP** - Yêu cầu: "multi-conference operations" (TP1)
   - Hiện tại: Assignment/Review không có conferenceId

5. **🔴 CAO - Thiếu Automatic Assignment**
   - ✅ **RẤT PHÙ HỢP** - Yêu cầu: "manual/automatic assignment by topic/keywords" (TP4)
   - Hiện tại: Chỉ có manual assignment

6. **🔴 CAO - Thiếu Validation & Integration**
   - ✅ **RẤT PHÙ HỢP** - Yêu cầu: Verify với các services khác
   - Hiện tại: Chỉ mock check, không verify thực sự

7. **🔴 CAO - Thiếu Pagination**
   - ✅ **RẤT PHÙ HỢP** - Yêu cầu: "thousands of papers"
   - Hiện tại: Không có pagination

8. **🔴 CAO - Thiếu Testing**
   - ✅ **RẤT PHÙ HỢP** - Yêu cầu: "Testing Document" (TP9)
   - Hiện tại: Không có tests

### 🟡 Các Nhận Xét CẦN BỔ SUNG

1. **Rebuttal Window** - Yêu cầu: "rebuttal window (optional)"
2. **Progress Tracking** - Yêu cầu: "track review progress" (TP4)
3. **Bulk Notifications** - Yêu cầu: "bulk email with anonymized feedback" (TP6)
4. **Reports & Analytics** - Yêu cầu: "submissions by school/track, acceptance rate, review SLA"
5. **Audit Logs** - Yêu cầu: "full audit trails"
6. **Database Constraints** - Yêu cầu: "data integrity"

---

## 🎯 Kết Luận

### ✅ **CÁC NHẬN XÉT TRONG REVIEW.md RẤT PHÙ HỢP VỚI YÊU CẦU CỦA THẦY**

**Lý do:**

1. **Bảo mật (Security):**
   - Yêu cầu: "strict RBAC", "single-blind/double-blind review modes"
   - Review chỉ ra: JWT decode thủ công, thiếu review mode → **RẤT PHÙ HỢP**

2. **Chức năng Chair:**
   - Yêu cầu: "aggregate reviews, Accept/Reject" (TP6)
   - Review chỉ ra: Thiếu Decision & Review Aggregation → **RẤT PHÙ HỢP**

3. **Chức năng Assignment:**
   - Yêu cầu: "manual/automatic assignment by topic/keywords" (TP4)
   - Review chỉ ra: Thiếu automatic assignment → **RẤT PHÙ HỢP**

4. **Multi-tenancy:**
   - Yêu cầu: "multi-conference operations" (TP1)
   - Review chỉ ra: Thiếu conferenceId → **RẤT PHÙ HỢP**

5. **Performance:**
   - Yêu cầu: "thousands of papers"
   - Review chỉ ra: Thiếu pagination → **RẤT PHÙ HỢP**

6. **Testing:**
   - Yêu cầu: "Testing Document" (TP9)
   - Review chỉ ra: Không có tests → **RẤT PHÙ HỢP**

### 📋 Các Gap Bổ Sung Cần Thêm Vào REVIEW.md

1. ✅ Rebuttal window (optional nhưng quan trọng)
2. ✅ Progress tracking với SLA metrics
3. ✅ Bulk notifications với anonymized feedback
4. ✅ Reports & Analytics module đầy đủ
5. ✅ Full audit trails (không chỉ createdAt/updatedAt)
6. ✅ Database constraints (unique constraints)

---

## 🚀 Khuyến Nghị

### Ưu Tiên 1 (Cần Fix Ngay - Theo Yêu Cầu):

1. ✅ **Decision & Review Aggregation** - Core requirement cho TP6
   - Entity `Decision` với fields: submissionId, decision, decidedBy, decidedAt
   - Service method: `aggregateReviews(submissionId)` → average score, consensus
   - API: `POST /api/reviews/decisions`, `GET /api/reviews/decisions/submission/:id`

2. ✅ **Fix JWT Authentication** - Security requirement
   - Sử dụng JWT Guard từ identity-service
   - Verify JWT signature và expiration

3. ✅ **Multi-Conference Support** - Tenancy requirement (TP1)
   - Thêm `conferenceId` vào Assignment entity
   - Filter APIs theo conference

4. ✅ **Automatic Assignment** - Yêu cầu trong TP4
   - Service method: `autoAssignByTopic(submissionId, trackId)`
   - API: `POST /api/reviews/assignments/auto`

5. ✅ **Review Mode (Blind)** - Security requirement
   - Thêm `reviewMode` vào Conference/CfpSetting
   - Logic để ẩn/hiện author identity

6. ✅ **Validation & Integration** - Verify với services khác
   - Tích hợp với Identity Service để verify user/role
   - Tích hợp với Submission Service để verify submission tồn tại

### Ưu Tiên 2 (Cần Bổ Sung Sớm):

7. ✅ **Thêm DB Constraints** - Data integrity
   - Unique constraint trên `assignments(reviewerId, submissionId)`

8. ✅ **Rebuttal Window** - Optional nhưng quan trọng
   - Entity `Rebuttal` với fields: submissionId, authorId, message
   - API: `POST /api/reviews/rebuttals`, `GET /api/reviews/rebuttals/submission/:id`

9. ✅ **Progress Tracking** - Yêu cầu trong TP4
   - API: `GET /api/reviews/progress/submission/:id`
   - API: `GET /api/reviews/progress/conference/:id`
   - SLA tracking

10. ✅ **Bulk Notifications** - Yêu cầu trong TP6
    - Integration với email service
    - Bulk email với anonymized feedback

11. ✅ **Pagination** - Performance requirement
    - Thêm pagination cho tất cả list endpoints
    - Filtering/sorting options

12. ✅ **Testing** - Yêu cầu bắt buộc TP9
    - Unit tests cho ReviewsService
    - Integration tests cho API endpoints

### Ưu Tiên 3 (Có Thể Làm Sau):

13. ✅ **Reports & Analytics** - Nice to have
    - API: `GET /api/reviews/analytics/conference/:id`
    - Submissions by track, acceptance rate, review SLA

14. ✅ **Full Audit Trails** - Cải thiện logging
    - Logging cho các operations quan trọng
    - Audit entries với prompt, model, timestamp

15. ✅ **AI Features** - Future enhancement (opt-in)
    - Neutral summaries for bidding
    - Reviewer-paper similarity hints
    - Feature flags per conference

---

## ✅ Kết Luận Cuối Cùng

**Các nhận xét trong REVIEW.md RẤT PHÙ HỢP với yêu cầu của thầy**, và thậm chí còn **chưa đầy đủ** so với yêu cầu. Cần bổ sung thêm:

- **Decision & Review Aggregation** (TP6) - **QUAN TRỌNG NHẤT**
- Multi-conference support (TP1)
- Automatic assignment (TP4)
- Review mode (single-blind/double-blind)
- Rebuttal window
- Progress tracking với SLA
- Bulk notifications
- Reports & Analytics
- Full audit trails

**Điểm số phù hợp:** 9.5/10 - Các nhận xét đều đúng và phù hợp với yêu cầu đề tài, đặc biệt là các yêu cầu trong TP4 và TP6.

---

## 📊 Bảng So Sánh Tổng Quan

| Yêu Cầu | Trạng Thái Hiện Tại | Mức Độ Phù Hợp | Ưu Tiên |
|---------|---------------------|----------------|---------|
| **Core Review Flow** | ✅ ĐÃ CÓ | ✅ OK | - |
| Bidding/COI | ✅ ĐÃ CÓ | ✅ OK | - |
| Assignment (Manual) | ✅ ĐÃ CÓ | ✅ OK | - |
| Review Submission | ✅ ĐÃ CÓ | ✅ OK | - |
| PC Discussion | ✅ ĐÃ CÓ | ✅ OK | - |
| **Decision & Aggregation** | ❌ THIẾU | 🔴 **RẤT PHÙ HỢP** | 🔴 CAO |
| **Multi-Conference** | ❌ THIẾU | 🔴 **RẤT PHÙ HỢP** | 🔴 CAO |
| **Auto Assignment** | ❌ THIẾU | 🔴 **RẤT PHÙ HỢP** | 🔴 CAO |
| **Review Mode (Blind)** | ❌ THIẾU | 🔴 **RẤT PHÙ HỢP** | 🔴 CAO |
| **RBAC/Security** | ⚠️ CẦN CẢI THIỆN | 🔴 **RẤT PHÙ HỢP** | 🔴 CAO |
| **Validation & Integration** | ⚠️ CẦN CẢI THIỆN | 🔴 **RẤT PHÙ HỢP** | 🔴 CAO |
| **Pagination** | ❌ THIẾU | 🔴 **RẤT PHÙ HỢP** | 🔴 CAO |
| **Testing** | ❌ THIẾU | 🔴 **RẤT PHÙ HỢP** | 🔴 CAO |
| **Rebuttal Window** | ❌ THIẾU | 🟡 **PHÙ HỢP** | 🟡 TRUNG BÌNH |
| **Progress Tracking** | ⚠️ CƠ BẢN | 🟡 **PHÙ HỢP** | 🟡 TRUNG BÌNH |
| **DB Constraints** | ⚠️ THIẾU | 🟡 **PHÙ HỢP** | 🟡 TRUNG BÌNH |
| **Reports/Analytics** | ❌ THIẾU | 🟡 **PHÙ HỢP** | 🟢 THẤP |
| **AI Features** | ❌ THIẾU | 🟢 **OK** | 🟢 THẤP |

---

*Tài liệu được tạo dựa trên REVIEW.md và yêu cầu hệ thống UTH-ConfMS*

