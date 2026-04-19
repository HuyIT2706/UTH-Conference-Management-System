# AI Service - Báo Cáo Rà Soát Luồng & Test Cases

## 1. Rà Soát Luồng Nghiệp Vụ (Functional Flows)

### 1.1. Luồng Kiểm Tra Ngữ Pháp (Grammar Check)

- **Kích hoạt (`POST /ai/check-grammar`):**
  - _Nghiệp vụ:_ Client gửi đoạn văn bản (`text`) và loại văn bản (`type` - vd: abstract, title, content). Tích hợp API của Google Gemini (`gemini-2.5-flash-lite`).
  - _Xử lý AI:_ Yêu cầu Gemini đóng vai biên tập viên học thuật (Expert Academic Editor), trả về JSON bao gồm đoạn văn bản đã sửa lỗi (`corrected`), danh sách các lỗi (`corrections` chi tiết quá trình sửa lỗi), và điểm đánh giá (`score`).
  - _Fallback:_ Nếu AI trả kết quả không chứa định dạng chuẩn hoặc sai sót do JSON parse lỗi, hệ thống có kịch bản dự phòng là giữ nguyên đoạn text gôc và map lỗi an toàn.

### 1.2. Luồng Tóm Tắt Bài Nộp (Summarize Submission)

- **Tạo Tóm Tắt (`POST /ai/summarize`):**
  - _Nghiệp vụ:_ Client yêu cầu AI tóm tắt bài báo (cung cấp Tiêu đề, Abstract, và Content).
  - _Luồng Cache DB:_ Hệ thống kiểm tra trong Database (`SubmissionSummary`) qua `submissionId`. Nếu bài nộp nào **đã từng được tóm tắt**, hệ thống sẽ lập tức trả về record trong DB thay vì gọi lại Gemini API (giúp tiết kiệm token/cost API và thời gian phản hồi cực nhanh).
    \*Nếu chưa có, mới tiến hành gọi API AI, sau đó lưu lại vào Database rồi mới trả về.
- **Tạo Lại (Force Regenerate - `POST /ai/summarize/regenerate`):**
  - _Nghiệp vụ:_ Nếu bản tóm tắt cũ không đạt (Ví dụ: do AI "chêm" tiếng Anh vào tiếng Việt), hệ thống cho phép **xóa đi** bản ghi cũ trong Database và ép buộc (force) gọi lại quá trình tạo Tóm tắt mới hoàn toàn qua AI.
- **Lấy kết quả tóm tắt (`GET /ai/summaries/:submissionId`):**
  - _Nghiệp vụ:_ Lấy kết quả đã lưu trong DB thông qua `submissionId`. Nếu chưa từng summarize, trả về `404 Not Found`.

---

## 2. Danh Sách Test Cases

### 2.1. API Kiểm Tra Ngữ Pháp (Grammar Check)

| Mã TC | Chức năng         | Kịch Bản Kì Vọng (Success)                                                                                                        | Kịch Bản Lỗi (Error / Validation)                                                                    |
| ----- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| AI_01 | **Check Grammar** | Văn bản có lỗi tiếng Anh: AI trả về danh sách `corrections` chứa chi tiết lý do và bản `corrected` chính xác. Điểm `score` < 100. | - Token không hợp lệ (HTTP 401).                                                                     |
| AI_02 | **Check Grammar** | Đoạn text hoàn hảo: System parse kết quả rỗng cho sửa lỗi mảng `corrections: []`, score = 100. Trả về đúng original code.         | - Gemini API die hoặc hết quota hạn mức HTTP 503 Service Unavailable (Hệ thống Throw HttpException). |

### 2.2. API Tóm Tắt (Summarize)

| Mã TC  | Chức năng                  | Kịch Bản Kì Vọng (Success)                                                                                              | Kịch Bản Lỗi (Error / Validation)                                                  |
| ------ | -------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| SUM_01 | **Summarize (First time)** | Lần đầu tiên: Gọi API Gemini mất vài giây, lưu Database thành công và map data chính xác.                               | - System không parse được định dạng JSON từ Gemini trả về, nhảy error Handler 503. |
| SUM_02 | **Summarize (Cached)**     | Gọi lại cùng `submissionId`: API trả về kết quả gần như **tức thì (0ms)** do lấy thẳng từ Database (bỏ qua Gemini API). |                                                                                    |
| SUM_03 | **Get Summary**            | Request `submissionId` có trong DB -> Trả về JSON summary chi tiết.                                                     | - Request `submissionId` không tồn tại trong DB -> Báo lỗi `404 Not Found`.        |
| SUM_04 | **Regenerate Summary**     | Gọi ép tạo mới: Xóa ngay lập tức DB cũ, gọi Gemini để generate một prompt mới. Kết quả thay đổi so với bài cũ.          | - Quên cấp JWT Token (HTTP 401).<br/>- DB lỗi trong quá trình call xóa old ID.     |

---

---

---

## 3. Reviewer Service - Test Cases (Review Service)

### 3.1. Biến môi trường Postman đề xuất

- `baseUrlReview`: URL review-service (ví dụ: `http://localhost:3004/api`)
- `bearerToken`: access token của reviewer
- `submissionId`: UUID bài nộp hợp lệ
- `conferenceId`: ID hội nghị hợp lệ
- `assignmentId`: ID assignment để accept/reject/submit review

### 3.2. Ma trận test case nghiệp vụ Reviewer

| Mã TC  | Endpoint                                      | Kịch Bản Kì Vọng (Success)                                                            | Kịch Bản Lỗi (Error / Validation)                                                                                                     |
| ------ | --------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| REV_01 | `POST /reviews/bids`                          | Reviewer submit preference thành công, trả về `201` và object `data` có `preference`. | `401` token sai/thiếu, `403` không có role reviewer, `400` thiếu field hoặc `preference` sai enum.                                    |
| REV_02 | `GET /reviews/assignments/me?page=1&limit=10` | Lấy danh sách assignment của reviewer, `200`, `data` là mảng.                         | `401` token sai/thiếu, `403` không đúng quyền, `400` khi `page/limit` không hợp lệ (vd: `page=0`, `limit=200`).                       |
| REV_03 | `GET /reviews/submissions/accepted-tracks`    | Lấy danh sách submissions theo track đã accept, `200`, `data` là mảng.                | `401` token sai/thiếu, `403` không đúng quyền.                                                                                        |
| REV_04 | `POST /reviews/assignments/self`              | Reviewer tự nhận chấm thành công, `201`, trả về assignment status `ACCEPTED`.         | `400` có conflict COI hoặc dữ liệu sai, `401` token sai/thiếu, `403` không phải reviewer/pc member.                                   |
| REV_05 | `PUT /reviews/assignments/:id/accept`         | Accept assignment thành công, `200`, `data.status = ACCEPTED`.                        | `404` không tìm thấy assignment, `403` assignment không thuộc reviewer, `400` assignment không còn ở `PENDING`.                       |
| REV_06 | `PUT /reviews/assignments/:id/reject`         | Reject assignment thành công, `200`, `data.status = REJECTED`.                        | `404` không tìm thấy assignment, `403` assignment không thuộc reviewer, `400` assignment không còn ở `PENDING`.                       |
| REV_07 | `POST /reviews`                               | Submit review thành công, `201`, `data.score` và `data.recommendation` đúng payload.  | `400` assignment chưa `ACCEPTED` hoặc score ngoài `[0,10]` hoặc enum sai, `403` không thuộc reviewer, `404` assignment không tồn tại. |

---

## 4. Postman Test Scripts (theo style status code branch)

> Dán script tương ứng vào tab **Tests** của từng request.

### 4.1. REV_01 - `POST /reviews/bids`

```javascript
const statusCode = pm.response.code;

if (statusCode === 201) {
  pm.test("[Success] Status code là 201", () => {
    pm.response.to.have.status(201);
  });

  pm.test("[Success] Response có message và data", () => {
    const json = pm.response.json();
    pm.expect(json.message).to.be.a("string");
    pm.expect(json.data).to.be.an("object");
    pm.expect(json.data.submissionId).to.be.a("string").and.not.empty;
    pm.expect(json.data.preference).to.be.oneOf([
      "INTERESTED",
      "MAYBE",
      "CONFLICT",
      "NOT_INTERESTED",
    ]);
  });
} else if (statusCode === 400 || statusCode === 401 || statusCode === 403) {
  pm.test("[Error] Status code hợp lệ cho nhánh lỗi", () => {
    pm.expect(statusCode).to.be.oneOf([400, 401, 403]);
  });

  pm.test("[Error] Response có message", () => {
    const json = pm.response.json();
    pm.expect(json.message).to.exist;
  });
} else {
  pm.test("[Unexpected] Status code không mong đợi: " + statusCode, () => {
    pm.expect(statusCode).to.be.oneOf([201, 400, 401, 403]);
  });
}
```

### 4.2. REV_02 - `GET /reviews/assignments/me`

```javascript
const statusCode = pm.response.code;

if (statusCode === 200) {
  pm.test("[Success] Status code là 200", () => {
    pm.response.to.have.status(200);
  });

  pm.test("[Success] Response trả về mảng assignments", () => {
    const json = pm.response.json();
    pm.expect(json.data).to.be.an("array");
  });

  pm.test("[Success] Lưu assignmentId đầu tiên (nếu có)", () => {
    const json = pm.response.json();
    if (json.data.length > 0 && json.data[0].id) {
      pm.environment.set("assignmentId", json.data[0].id);
      console.log("Đã lưu assignmentId:", json.data[0].id);
    }
  });
} else if (statusCode === 400 || statusCode === 401 || statusCode === 403) {
  pm.test("[Error] Status code hợp lệ", () => {
    pm.expect(statusCode).to.be.oneOf([400, 401, 403]);
  });
} else {
  pm.test("[Unexpected] Status code không mong đợi: " + statusCode, () => {
    pm.expect(statusCode).to.be.oneOf([200, 400, 401, 403]);
  });
}
```

### 4.3. REV_03 - `GET /reviews/submissions/accepted-tracks`

```javascript
const statusCode = pm.response.code;

if (statusCode === 200) {
  pm.test("[Success] Status code là 200", () => {
    pm.response.to.have.status(200);
  });

  pm.test("[Success] Response có data là mảng submissions", () => {
    const json = pm.response.json();
    pm.expect(json.data).to.be.an("array");
  });

  pm.test("[Success] Lưu submissionId đầu tiên (nếu có)", () => {
    const json = pm.response.json();
    if (json.data.length > 0 && json.data[0].id) {
      pm.environment.set("submissionId", json.data[0].id);
      console.log("Đã lưu submissionId:", json.data[0].id);
    }
  });
} else if (statusCode === 401 || statusCode === 403) {
  pm.test("[Error] Status code là 401 hoặc 403", () => {
    pm.expect(statusCode).to.be.oneOf([401, 403]);
  });
} else {
  pm.test("[Unexpected] Status code không mong đợi: " + statusCode, () => {
    pm.expect(statusCode).to.be.oneOf([200, 401, 403]);
  });
}
```

### 4.4. REV_04 - `POST /reviews/assignments/self`

```javascript
const statusCode = pm.response.code;

if (statusCode === 201) {
  pm.test("[Success] Status code là 201", () => {
    pm.response.to.have.status(201);
  });

  pm.test("[Success] Self-assign thành công", () => {
    const json = pm.response.json();
    pm.expect(json.data).to.be.an("object");
    pm.expect(json.data.id).to.exist;
    pm.expect(json.data.status).to.equal("ACCEPTED");
  });

  pm.test("[Success] Lưu assignmentId", () => {
    const json = pm.response.json();
    if (json.data?.id) {
      pm.environment.set("assignmentId", json.data.id);
      console.log("Đã lưu assignmentId từ self-assign:", json.data.id);
    }
  });
} else if (statusCode === 400 || statusCode === 401 || statusCode === 403) {
  pm.test("[Error] Status code hợp lệ", () => {
    pm.expect(statusCode).to.be.oneOf([400, 401, 403]);
  });
} else {
  pm.test("[Unexpected] Status code không mong đợi: " + statusCode, () => {
    pm.expect(statusCode).to.be.oneOf([201, 400, 401, 403]);
  });
}
```

### 4.5. REV_05 - `PUT /reviews/assignments/:id/accept`

```javascript
const statusCode = pm.response.code;

if (statusCode === 200) {
  pm.test("[Success] Status code là 200", () => {
    pm.response.to.have.status(200);
  });

  pm.test("[Success] Assignment chuyển trạng thái ACCEPTED", () => {
    const json = pm.response.json();
    pm.expect(json.data.status).to.equal("ACCEPTED");
  });
} else if (statusCode === 400 || statusCode === 403 || statusCode === 404) {
  pm.test("[Error] Status code hợp lệ", () => {
    pm.expect(statusCode).to.be.oneOf([400, 403, 404]);
  });
} else {
  pm.test("[Unexpected] Status code không mong đợi: " + statusCode, () => {
    pm.expect(statusCode).to.be.oneOf([200, 400, 403, 404]);
  });
}
```

### 4.6. REV_06 - `PUT /reviews/assignments/:id/reject`

```javascript
const statusCode = pm.response.code;

if (statusCode === 200) {
  pm.test("[Success] Status code là 200", () => {
    pm.response.to.have.status(200);
  });

  pm.test("[Success] Assignment chuyển trạng thái REJECTED", () => {
    const json = pm.response.json();
    pm.expect(json.data.status).to.equal("REJECTED");
  });
} else if (statusCode === 400 || statusCode === 403 || statusCode === 404) {
  pm.test("[Error] Status code hợp lệ", () => {
    pm.expect(statusCode).to.be.oneOf([400, 403, 404]);
  });
} else {
  pm.test("[Unexpected] Status code không mong đợi: " + statusCode, () => {
    pm.expect(statusCode).to.be.oneOf([200, 400, 403, 404]);
  });
}
```

### 4.7. REV_07 - `POST /reviews`

```javascript
const statusCode = pm.response.code;

if (statusCode === 201) {
  pm.test("[Success] Status code là 201", () => {
    pm.response.to.have.status(201);
  });

  pm.test("[Success] Response có dữ liệu review hợp lệ", () => {
    const json = pm.response.json();
    pm.expect(json.data).to.be.an("object");
    pm.expect(json.data.assignmentId).to.exist;
    pm.expect(json.data.score).to.be.a("number");
    pm.expect(json.data.score).to.be.within(0, 10);
    pm.expect(json.data.confidence).to.be.oneOf(["LOW", "MEDIUM", "HIGH"]);
    pm.expect(json.data.recommendation).to.be.oneOf([
      "ACCEPT",
      "WEAK_ACCEPT",
      "REJECT",
      "WEAK_REJECT",
    ]);
  });
} else if (statusCode === 400 || statusCode === 403 || statusCode === 404) {
  pm.test("[Error] Status code hợp lệ", () => {
    pm.expect(statusCode).to.be.oneOf([400, 403, 404]);
  });

  pm.test("[Error] Có message lỗi", () => {
    const json = pm.response.json();
    pm.expect(json.message).to.exist;
  });
} else {
  pm.test("[Unexpected] Status code không mong đợi: " + statusCode, () => {
    pm.expect(statusCode).to.be.oneOf([201, 400, 403, 404]);
  });
}
```

---

## 5. Payload mẫu nhanh cho request body

### 5.1. REV_01 - Submit bid

```json
{
  "submissionId": "{{submissionId}}",
  "conferenceId": {{conferenceId}},
  "preference": "INTERESTED"
}
```

### 5.2. REV_04 - Self assign

```json
{
  "submissionId": "{{submissionId}}",
  "conferenceId": {{conferenceId}}
}
```

### 5.3. REV_07 - Submit review

```json
{
  "assignmentId": {{assignmentId}},
  "score": 8,
  "confidence": "HIGH",
  "commentForAuthor": "Bài có ý tưởng tốt, cần bổ sung thí nghiệm.",
  "commentForPC": "Kết quả ổn nhưng phần so sánh baseline còn mỏng.",
  "recommendation": "WEAK_ACCEPT"
}
```
