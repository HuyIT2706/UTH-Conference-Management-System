# Reviewer Service - Postman Test Scripts (Chuẩn theo API)

Tài liệu này viết script Postman cho **từng API trong nhóm Review** theo đúng flow bạn chụp.  
Các script đều có ghi chú tiếng Việt và phân nhánh theo status code giống mẫu bạn đưa.

## 0) Biến môi trường nên có

- `baseUrlReview` = `http://localhost:3004/api`
- `bearerToken` = access token
- `submissionId` = UUID bài nộp
- `conferenceId` = ID hội nghị (number)
- `assignmentId` = ID assignment (number)
- `reviewerId` = ID reviewer (number)

Header dùng cho hầu hết API:

- `Authorization: Bearer {{bearerToken}}`
- `Content-Type: application/json`

---

## 1) POST /reviews/bids

> Test: Reviewer submit preference (bidding) cho bài báo.

```javascript
const statusCode = pm.response.code;

if (statusCode === 201) {
  // SUCCESS: Submit bid thành công
  pm.test('[Success] Status code là 201', () => {
    pm.response.to.have.status(201);
  });

  pm.test('[Success] Response có message và data', () => {
    const json = pm.response.json();
    pm.expect(json).to.be.an('object');
    pm.expect(json.message).to.be.a('string');
    pm.expect(json.data).to.be.an('object');
  });

  pm.test('[Success] Data bidding đúng format', () => {
    const json = pm.response.json();
    pm.expect(json.data.submissionId).to.be.a('string').and.not.empty;
    pm.expect(json.data.conferenceId).to.be.a('number');
    pm.expect(json.data.preference).to.be.oneOf([
      'INTERESTED',
      'MAYBE',
      'CONFLICT',
      'NOT_INTERESTED',
    ]);
  });
} else if (statusCode === 400 || statusCode === 401 || statusCode === 403) {
  // ERROR: dữ liệu sai / token sai / không đủ quyền
  pm.test('[Error] Status code là 400/401/403', () => {
    pm.expect(statusCode).to.be.oneOf([400, 401, 403]);
  });

  pm.test('[Error] Response có thông báo lỗi', () => {
    const json = pm.response.json();
    pm.expect(json).to.be.an('object');
    pm.expect(json.message).to.exist;
  });
} else {
  pm.test('[Unexpected] Status code không mong đợi: ' + statusCode, () => {
    pm.expect(statusCode).to.be.oneOf([201, 400, 401, 403]);
  });
}
```

---

## 2) GET /reviews/assignments/me?page=1&limit=10

> Test: Reviewer lấy danh sách assignment của chính mình.

```javascript
const statusCode = pm.response.code;

if (statusCode === 200) {
  // SUCCESS: Lấy danh sách assignment thành công
  pm.test('[Success] Status code là 200', () => {
    pm.response.to.have.status(200);
  });

  pm.test('[Success] Response có data là mảng', () => {
    const json = pm.response.json();
    pm.expect(json.data).to.be.an('array');
  });

  pm.test('[Success] Nếu có dữ liệu thì assignment có field chính', () => {
    const json = pm.response.json();
    if (json.data.length > 0) {
      pm.expect(json.data[0].id).to.be.a('number');
      pm.expect(json.data[0].status).to.be.oneOf([
        'PENDING',
        'ACCEPTED',
        'REJECTED',
        'COMPLETED',
      ]);
    }
  });

  pm.test('[Success] Lưu assignmentId đầu tiên (nếu có)', () => {
    const json = pm.response.json();
    if (json.data.length > 0 && json.data[0].id) {
      pm.environment.set('assignmentId', json.data[0].id);
      console.log('Đã lưu assignmentId:', json.data[0].id);
    }
  });
} else if (statusCode === 400 || statusCode === 401 || statusCode === 403) {
  // ERROR: page/limit sai hoặc token/quyền sai
  pm.test('[Error] Status code là 400/401/403', () => {
    pm.expect(statusCode).to.be.oneOf([400, 401, 403]);
  });
} else {
  pm.test('[Unexpected] Status code không mong đợi: ' + statusCode, () => {
    pm.expect(statusCode).to.be.oneOf([200, 400, 401, 403]);
  });
}
```

---

## 3) PUT /reviews/assignments/:id/accept

> Test: Reviewer chấp nhận assignment.

```javascript
const statusCode = pm.response.code;

if (statusCode === 200) {
  // SUCCESS: Accept assignment thành công
  pm.test('[Success] Status code là 200', () => {
    pm.response.to.have.status(200);
  });

  pm.test('[Success] Assignment chuyển sang ACCEPTED', () => {
    const json = pm.response.json();
    pm.expect(json.data).to.be.an('object');
    pm.expect(json.data.status).to.equal('ACCEPTED');
  });
} else if (
  statusCode === 400 ||
  statusCode === 401 ||
  statusCode === 403 ||
  statusCode === 404
) {
  // ERROR: đã xử lý rồi / token sai / không đúng owner / không tồn tại
  pm.test('[Error] Status code là 400/401/403/404', () => {
    pm.expect(statusCode).to.be.oneOf([400, 401, 403, 404]);
  });

  pm.test('[Error] Có message lỗi', () => {
    const json = pm.response.json();
    pm.expect(json.message).to.exist;
  });
} else {
  pm.test('[Unexpected] Status code không mong đợi: ' + statusCode, () => {
    pm.expect(statusCode).to.be.oneOf([200, 400, 401, 403, 404]);
  });
}
```

---

## 4) PUT /reviews/assignments/:id/reject

> Test: Reviewer từ chối assignment.

```javascript
const statusCode = pm.response.code;

if (statusCode === 200) {
  // SUCCESS: Reject assignment thành công
  pm.test('[Success] Status code là 200', () => {
    pm.response.to.have.status(200);
  });

  pm.test('[Success] Assignment chuyển sang REJECTED', () => {
    const json = pm.response.json();
    pm.expect(json.data).to.be.an('object');
    pm.expect(json.data.status).to.equal('REJECTED');
  });
} else if (
  statusCode === 400 ||
  statusCode === 401 ||
  statusCode === 403 ||
  statusCode === 404
) {
  // ERROR: đã xử lý rồi / token sai / không đúng owner / không tồn tại
  pm.test('[Error] Status code là 400/401/403/404', () => {
    pm.expect(statusCode).to.be.oneOf([400, 401, 403, 404]);
  });
} else {
  pm.test('[Unexpected] Status code không mong đợi: ' + statusCode, () => {
    pm.expect(statusCode).to.be.oneOf([200, 400, 401, 403, 404]);
  });
}
```

---

## 5) POST /reviews/assignments/self

> Test: Reviewer tự phân công bài báo cho chính mình (self assignment).

```javascript
const statusCode = pm.response.code;

if (statusCode === 201) {
  // SUCCESS: self-assign thành công
  pm.test('[Success] Status code là 201', () => {
    pm.response.to.have.status(201);
  });

  pm.test('[Success] Response có assignment hợp lệ', () => {
    const json = pm.response.json();
    pm.expect(json.data.id).to.be.a('number');
    pm.expect(json.data.status).to.equal('ACCEPTED');
    pm.expect(json.data.submissionId).to.be.a('string');
  });

  pm.test('[Success] Lưu assignmentId', () => {
    const json = pm.response.json();
    if (json.data?.id) {
      pm.environment.set('assignmentId', json.data.id);
      console.log('Đã lưu assignmentId từ self-assign:', json.data.id);
    }
  });
} else if (statusCode === 400 || statusCode === 401 || statusCode === 403) {
  // ERROR: conflict/dữ liệu sai/token sai/không đúng role
  pm.test('[Error] Status code là 400/401/403', () => {
    pm.expect(statusCode).to.be.oneOf([400, 401, 403]);
  });
} else {
  pm.test('[Unexpected] Status code không mong đợi: ' + statusCode, () => {
    pm.expect(statusCode).to.be.oneOf([201, 400, 401, 403]);
  });
}
```

---

## 6) GET /reviews/submissions/accepted-tracks

> Test: Reviewer xem danh sách bài nộp trong các track đã chấp nhận.

```javascript
const statusCode = pm.response.code;

if (statusCode === 200) {
  // SUCCESS: Lấy danh sách submissions thành công
  pm.test('[Success] Status code là 200', () => {
    pm.response.to.have.status(200);
  });

  pm.test('[Success] Response có data là mảng', () => {
    const json = pm.response.json();
    pm.expect(json.data).to.be.an('array');
  });

  pm.test('[Success] Lưu submissionId đầu tiên (nếu có)', () => {
    const json = pm.response.json();
    if (json.data.length > 0 && json.data[0].id) {
      pm.environment.set('submissionId', json.data[0].id);
      console.log('Đã lưu submissionId:', json.data[0].id);
    }
  });
} else if (statusCode === 401 || statusCode === 403) {
  // ERROR: token sai hoặc không đúng role
  pm.test('[Error] Status code là 401/403', () => {
    pm.expect(statusCode).to.be.oneOf([401, 403]);
  });
} else {
  pm.test('[Unexpected] Status code không mong đợi: ' + statusCode, () => {
    pm.expect(statusCode).to.be.oneOf([200, 401, 403]);
  });
}
```

---

## 7) POST /reviews

> Test: Reviewer nộp bài chấm.

```javascript
const statusCode = pm.response.code;

if (statusCode === 201) {
  // SUCCESS: Nộp review thành công
  pm.test('[Success] Status code là 201', () => {
    pm.response.to.have.status(201);
  });

  pm.test('[Success] Data review hợp lệ', () => {
    const json = pm.response.json();
    pm.expect(json.data).to.be.an('object');
    pm.expect(json.data.assignmentId).to.be.a('number');
    pm.expect(json.data.score).to.be.a('number');
    pm.expect(json.data.score).to.be.within(0, 10);
    pm.expect(json.data.confidence).to.be.oneOf(['LOW', 'MEDIUM', 'HIGH']);
    pm.expect(json.data.recommendation).to.be.oneOf([
      'ACCEPT',
      'WEAK_ACCEPT',
      'REJECT',
      'WEAK_REJECT',
    ]);
  });
} else if (
  statusCode === 400 ||
  statusCode === 401 ||
  statusCode === 403 ||
  statusCode === 404
) {
  // ERROR: validate fail / token sai / không đúng owner / assignment không tồn tại
  pm.test('[Error] Status code là 400/401/403/404', () => {
    pm.expect(statusCode).to.be.oneOf([400, 401, 403, 404]);
  });

  pm.test('[Error] Response có message', () => {
    const json = pm.response.json();
    pm.expect(json.message).to.exist;
  });
} else {
  pm.test('[Unexpected] Status code không mong đợi: ' + statusCode, () => {
    pm.expect(statusCode).to.be.oneOf([201, 400, 401, 403, 404]);
  });
}
```

---

## 8) GET /reviews/submission/:id/anonymized

> Test: Xem reviews đã ẩn danh (cho tác giả).

```javascript
const statusCode = pm.response.code;

if (statusCode === 200) {
  // SUCCESS: Lấy danh sách review ẩn danh
  pm.test('[Success] Status code là 200', () => {
    pm.response.to.have.status(200);
  });

  pm.test('[Success] Data là mảng reviews ẩn danh', () => {
    const json = pm.response.json();
    pm.expect(json.data).to.be.an('array');

    if (json.data.length > 0) {
      pm.expect(json.data[0]).to.have.property('score');
      pm.expect(json.data[0]).to.have.property('recommendation');
      pm.expect(json.data[0]).to.have.property('createdAt');
      pm.expect(json.data[0]).to.not.have.property('reviewerId');
      pm.expect(json.data[0]).to.not.have.property('reviewerName');
    }
  });
} else if (statusCode === 400 || statusCode === 401) {
  // ERROR: submissionId không đúng UUID hoặc token sai
  pm.test('[Error] Status code là 400/401', () => {
    pm.expect(statusCode).to.be.oneOf([400, 401]);
  });
} else {
  pm.test('[Unexpected] Status code không mong đợi: ' + statusCode, () => {
    pm.expect(statusCode).to.be.oneOf([200, 400, 401]);
  });
}
```

---

## 9) GET /reviews/submission/:id

> Test: Xem tất cả reviews của một submission (Chair/Admin hoặc reviewer được gán).

```javascript
const statusCode = pm.response.code;

if (statusCode === 200) {
  // SUCCESS: Lấy danh sách reviews thành công
  pm.test('[Success] Status code là 200', () => {
    pm.response.to.have.status(200);
  });

  pm.test('[Success] Response có data là mảng', () => {
    const json = pm.response.json();
    pm.expect(json.data).to.be.an('array');
  });

  pm.test('[Success] Nếu có phần tử thì có reviewerName', () => {
    const json = pm.response.json();
    if (json.data.length > 0) {
      pm.expect(json.data[0]).to.have.property('reviewerName');
    }
  });
} else if (statusCode === 400 || statusCode === 401 || statusCode === 403) {
  // ERROR: UUID sai / token sai / không có quyền xem
  pm.test('[Error] Status code là 400/401/403', () => {
    pm.expect(statusCode).to.be.oneOf([400, 401, 403]);
  });
} else {
  pm.test('[Unexpected] Status code không mong đợi: ' + statusCode, () => {
    pm.expect(statusCode).to.be.oneOf([200, 400, 401, 403]);
  });
}
```

---

## 10) GET /reviews/bids/submission/:id

> Test: Chair/Admin xem tất cả bids của một submission.

```javascript
const statusCode = pm.response.code;

if (statusCode === 200) {
  // SUCCESS: Lấy bids thành công
  pm.test('[Success] Status code là 200', () => {
    pm.response.to.have.status(200);
  });

  pm.test('[Success] Data là mảng bids', () => {
    const json = pm.response.json();
    pm.expect(json.data).to.be.an('array');
  });
} else if (statusCode === 400 || statusCode === 401 || statusCode === 403) {
  // ERROR: UUID sai / token sai / không phải chair-admin
  pm.test('[Error] Status code là 400/401/403', () => {
    pm.expect(statusCode).to.be.oneOf([400, 401, 403]);
  });
} else {
  pm.test('[Unexpected] Status code không mong đợi: ' + statusCode, () => {
    pm.expect(statusCode).to.be.oneOf([200, 400, 401, 403]);
  });
}
```

---

## 11) GET /reviews/discussions/submission/:id

> Test: Chair/Admin xem danh sách thảo luận PC của submission.

```javascript
const statusCode = pm.response.code;

if (statusCode === 200) {
  // SUCCESS: Lấy discussions thành công
  pm.test('[Success] Status code là 200', () => {
    pm.response.to.have.status(200);
  });

  pm.test('[Success] Data là mảng discussions', () => {
    const json = pm.response.json();
    pm.expect(json.data).to.be.an('array');
  });
} else if (statusCode === 400 || statusCode === 401 || statusCode === 403) {
  // ERROR: UUID sai / token sai / không phải chair-admin
  pm.test('[Error] Status code là 400/401/403', () => {
    pm.expect(statusCode).to.be.oneOf([400, 401, 403]);
  });
} else {
  pm.test('[Unexpected] Status code không mong đợi: ' + statusCode, () => {
    pm.expect(statusCode).to.be.oneOf([200, 400, 401, 403]);
  });
}
```

---

## 12) GET /reviews/decisions/submission/:id

> Test: Chair/Admin xem tổng hợp reviews và quyết định hiện tại.

```javascript
const statusCode = pm.response.code;

if (statusCode === 200) {
  // SUCCESS: Lấy decision summary thành công
  pm.test('[Success] Status code là 200', () => {
    pm.response.to.have.status(200);
  });

  pm.test('[Success] Data có stats và decision', () => {
    const json = pm.response.json();
    pm.expect(json.data).to.be.an('object');
    pm.expect(json.data.stats).to.be.an('object');
    pm.expect(json.data.stats).to.have.property('reviewCount');
    pm.expect(json.data.stats).to.have.property('recommendationCounts');
    pm.expect(json.data).to.have.property('decision');
  });
} else if (statusCode === 400 || statusCode === 401 || statusCode === 403) {
  // ERROR: UUID sai / token sai / không phải chair-admin
  pm.test('[Error] Status code là 400/401/403', () => {
    pm.expect(statusCode).to.be.oneOf([400, 401, 403]);
  });
} else {
  pm.test('[Unexpected] Status code không mong đợi: ' + statusCode, () => {
    pm.expect(statusCode).to.be.oneOf([200, 400, 401, 403]);
  });
}
```

---

## 13) POST /reviews/decisions

> Test: Chair/Admin set hoặc update quyết định cuối cùng.

```javascript
const statusCode = pm.response.code;

if (statusCode === 201) {
  // SUCCESS: Set/update decision thành công
  pm.test('[Success] Status code là 201', () => {
    pm.response.to.have.status(201);
  });

  pm.test('[Success] Response có decision và summary', () => {
    const json = pm.response.json();
    pm.expect(json.data).to.be.an('object');
    pm.expect(json.data.decision).to.be.an('object');
    pm.expect(json.data.summary).to.be.an('object');
  });

  pm.test('[Success] Decision hợp lệ', () => {
    const json = pm.response.json();
    pm.expect(json.data.decision.decision).to.be.oneOf([
      'ACCEPT',
      'REJECT',
      'BORDERLINE',
    ]);
  });
} else if (statusCode === 400 || statusCode === 401 || statusCode === 403) {
  // ERROR: payload sai / token sai / không phải chair-admin
  pm.test('[Error] Status code là 400/401/403', () => {
    pm.expect(statusCode).to.be.oneOf([400, 401, 403]);
  });

  pm.test('[Error] Response có message', () => {
    const json = pm.response.json();
    pm.expect(json.message).to.exist;
  });
} else {
  pm.test('[Unexpected] Status code không mong đợi: ' + statusCode, () => {
    pm.expect(statusCode).to.be.oneOf([201, 400, 401, 403]);
  });
}
```

---

## 14) GET /reviews/progress/submission/:id

> Test: Chair/Admin xem tiến độ review của một submission.

```javascript
const statusCode = pm.response.code;

if (statusCode === 200) {
  // SUCCESS: Lấy progress theo submission thành công
  pm.test('[Success] Status code là 200', () => {
    pm.response.to.have.status(200);
  });

  pm.test('[Success] Data có các metric tiến độ', () => {
    const json = pm.response.json();
    pm.expect(json.data).to.be.an('object');
    pm.expect(json.data).to.have.property('totalAssignments');
    pm.expect(json.data).to.have.property('completedAssignments');
    pm.expect(json.data).to.have.property('pendingAssignments');
    pm.expect(json.data).to.have.property('reviewsSubmitted');
  });
} else if (statusCode === 400 || statusCode === 401 || statusCode === 403) {
  // ERROR: UUID sai / token sai / không phải chair-admin
  pm.test('[Error] Status code là 400/401/403', () => {
    pm.expect(statusCode).to.be.oneOf([400, 401, 403]);
  });
} else {
  pm.test('[Unexpected] Status code không mong đợi: ' + statusCode, () => {
    pm.expect(statusCode).to.be.oneOf([200, 400, 401, 403]);
  });
}
```

---

## 15) GET /reviews/progress/conference/:id

> Test: Chair/Admin xem tiến độ review của cả hội nghị.

```javascript
const statusCode = pm.response.code;

if (statusCode === 200) {
  // SUCCESS: Lấy progress theo conference thành công
  pm.test('[Success] Status code là 200', () => {
    pm.response.to.have.status(200);
  });

  pm.test('[Success] Data có metric tổng hợp', () => {
    const json = pm.response.json();
    pm.expect(json.data).to.be.an('object');
    pm.expect(json.data.conferenceId).to.be.a('number');
    pm.expect(json.data).to.have.property('totalAssignments');
    pm.expect(json.data).to.have.property('completedAssignments');
    pm.expect(json.data).to.have.property('pendingAssignments');
    pm.expect(json.data).to.have.property('reviewsSubmitted');
  });
} else if (statusCode === 400 || statusCode === 401 || statusCode === 403) {
  // ERROR: conference id sai kiểu / token sai / không phải chair-admin
  pm.test('[Error] Status code là 400/401/403', () => {
    pm.expect(statusCode).to.be.oneOf([400, 401, 403]);
  });
} else {
  pm.test('[Unexpected] Status code không mong đợi: ' + statusCode, () => {
    pm.expect(statusCode).to.be.oneOf([200, 400, 401, 403]);
  });
}
```

---

## 16) GET /reviews/reviewer/:reviewerId/stats

> Test: Lấy thống kê hoạt động reviewer (internal).

```javascript
const statusCode = pm.response.code;

if (statusCode === 200) {
  // SUCCESS: Lấy thống kê thành công
  pm.test('[Success] Status code là 200', () => {
    pm.response.to.have.status(200);
  });

  pm.test('[Success] Data thống kê có đủ field', () => {
    const json = pm.response.json();
    pm.expect(json.data).to.be.an('object');
    pm.expect(json.data.assignmentCount).to.be.a('number');
    pm.expect(json.data.reviewCount).to.be.a('number');
    pm.expect(json.data.hasActiveAssignments).to.be.a('boolean');
    pm.expect(json.data.completedReviews).to.be.a('number');
  });
} else if (statusCode === 400 || statusCode === 401) {
  // ERROR: reviewerId không hợp lệ hoặc thiếu/sai token
  pm.test('[Error] Status code là 400/401', () => {
    pm.expect(statusCode).to.be.oneOf([400, 401]);
  });
} else {
  pm.test('[Unexpected] Status code không mong đợi: ' + statusCode, () => {
    pm.expect(statusCode).to.be.oneOf([200, 400, 401]);
  });
}
```

---

## Payload mẫu cho các API có body

### POST /reviews/bids

```json
{
  "submissionId": "{{submissionId}}",
  "conferenceId": {{conferenceId}},
  "preference": "INTERESTED"
}
```

### POST /reviews/assignments/self

```json
{
  "submissionId": "{{submissionId}}",
  "conferenceId": {{conferenceId}}
}
```

### POST /reviews

```json
{
  "assignmentId": {{assignmentId}},
  "score": 8,
  "confidence": "HIGH",
  "commentForAuthor": "Bài có ý tưởng tốt, cần làm rõ phần thí nghiệm.",
  "commentForPC": "Có novelty nhưng cần bổ sung so sánh baseline.",
  "recommendation": "WEAK_ACCEPT"
}
```

### POST /reviews/decisions

```json
{
  "submissionId": "{{submissionId}}",
  "decision": "ACCEPT",
  "note": "Đủ số lượng review, điểm trung bình tốt."
}
```
