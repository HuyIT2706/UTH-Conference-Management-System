# AI Service - BVA & ITC Test Cases

Tài liệu này tổng hợp toàn bộ các Test Cases (Integration Test Cases - ITC và Boundary Value Analysis - BVA) cho `ai-service`, phục vụ việc đảm bảo chất lượng, bảo mật và hiệu năng khi tích hợp Google Gemini AI vào hệ thống đánh giá ngữ pháp và tự động tóm tắt.

---

## 📋 Danh sách Bảng Test Cases (Copy cho Docs/Excel)

| Test Case ID | Function Name | Test Case Description | Test Case Procedure (Input) | Expected Results | Pre-conditions |
| --- | --- | --- | --- | --- | --- |
| ITC_1.1 | checkGrammar | Kiểm tra đoạn văn có lỗi ngữ pháp | Một đoạn văn bản tiếng Anh cố tình viết sai ngữ pháp/chính tả, kèm Token hợp lệ. | HTTP 200 OK. Trả về mảng corrections, điểm đánh giá < 100. | Đã đăng nhập |
| ITC_1.2 | checkGrammar | Kiểm tra đoạn văn hoàn hảo | Một đoạn văn bản tiếng Anh chuẩn xác. | HTTP 200 OK. Trả về mảng corrections rỗng [], điểm đánh giá = 100. | Đã đăng nhập |
| ITC_1.3 | checkGrammar | Yêu cầu check thiếu Token xác thực | Gửi Request không đính kèm Bearer Token ở header. | HTTP 401 Unauthorized. Bị chặn cấu hình. | Không đăng nhập |
| ITC_1.4 | checkGrammar | Bắt validation định dạng dữ liệu | Gửi Body thiếu trường text bắt buộc hoặc trường text rỗng "". | HTTP 400 Bad Request. Báo lỗi Validation từ hệ thống. | Đã đăng nhập |
| ITC_1.5 | checkGrammar | Truyền type không hợp lệ | Gửi Body với type = "essay" (ngoài enum). | HTTP 400 Bad Request. Lỗi validation @IsIn(['abstract','title','content']). | Đã đăng nhập |
| ITC_1.6(BVA) | checkGrammar | Kiểm tra biên cực ngắn (1 ký tự) | Gửi Body với text có độ dài đúng 1 ký tự ("a"), type hợp lệ. | HTTP 200 OK. Trả kết quả thành công, không báo lỗi. | Đã đăng nhập |
| ITC_1.7(BVA) | checkGrammar | Kiểm tra độ dài chữ rất lớn | Gửi Body với text khoảng 90,000 ký tự (Dưới mức Payload 100kb). | HTTP 200 OK. API xử lý thành công. | Đã đăng nhập |
| ITC_1.8(BVA) | checkGrammar | Vượt giới hạn kích thước Payload | Gửi Body với text vượt quá 100KB (Vài triệu ký tự). | HTTP 413 Payload Too Large. Chặn từ middleware. | Đã đăng nhập |
| ITC_1.9(BVA) | checkGrammar | Biên Enum phân biệt hoa thường | Gửi Body với type = "ABSTRACT" hoặc " Abstract ". | HTTP 400 Bad Request. Lỗi validation @IsIn. | Đã đăng nhập |
| ITC_1.10(BVA) | checkGrammar | Chứa toàn khoảng trắng (Whitespace) | Gửi Body có text = "          " (10 khoảng trắng) và type đúng. | HTTP 400 (do bị Trim) hoặc AI báo không hiểu văn bản. | Đã đăng nhập |
| ITC_1.11(BVA) | checkGrammar | Toàn Emoji hoặc ký tự UTF-8 dị biệt | Gửi Body có text chứa 100 ký tự emoji 😀😎. | HTTP 200 OK. AI không văng lỗi sập server mà tự trả về kết quả 0. | Đã đăng nhập |
| ITC_1.12(BVA) | checkGrammar | Trường Type rỗng hoặc Null | Gửi Body có trường type = "" hoặc type = null. |     | Đã đăng nhập |
| ITC_2.1 | summarize | Tự động tóm tắt bài nộp (Lần đầu) | Truyền submissionId hợp lệ, bài chưa được tóm tắt. | HTTP 200 OK. Trả về tóm tắt AI, và lưu DB. | Đã đăng nhập |
| ITC_2.2 | summarize | Lấy tóm tắt từ DB (Check Cache) | Gọi lại API với đúng submissionId vừa tóm tắt. | HTTP 200 OK. Lấy từ Database nhanh chóng, không sinh bản ghi mới. | Bài đã tóm tắt |
| ITC_2.3 | summarize | Yêu cầu thiếu Token xác thực | Không gọi kèm Bearer Token. | HTTP 401 Unauthorized. Báo lỗi không có quyền truy cập. | Không đăng nhập |
| ITC_2.4 | summarize | Sự cố Google Gemini (Ngoại lệ) | Tắt kết nối internet mạng bot, hoặc cấu hình sai mã AI Key. | HTTP 503 Service Unavailable. ("AI Service is currently unavailable"). | Đứng API AI Key |
| ITC_2.5 | summarize | Bắt validation thiếu param | Gửi truy vấn ID rỗng bị validation. | HTTP 400 Bad Request. Lỗi Validation hệ thống. | Đã đăng nhập |
| ITC_2.6(BVA) | summarize | Dữ liệu đúng biên 8000 ký tự | Gửi Body có abstract/title dài chuẩn 8000. | HTTP 200 OK. Hệ thống nạp hết lên Gemini API. | Đã đăng nhập |
| ITC_2.7(BVA) | summarize | Dữ liệu vượt biên (> 8000 ký tự) | Gửi Body dài 8001+ ký tự. | HTTP 200 OK. Tự động cắt chuỗi (substring) gửi API. | Đã đăng nhập |
| ITC_2.8(BVA) | summarize | Abstract cực ngắn (= 1 ký tự) | Gửi dữ liệu AI lấy Title="A" Abstract="B". | HTTP 200 OK. AI gửi tóm tắt cực ngắn. | Đã đăng nhập |
| ITC_2.9(BVA) | summarize | Biên ID âm và 0 ở submissionId | Truyền submissionId = 0 hoặc -1 (Nếu nhập Body/Param). | HTTP 400 Bad request hoặc 404 Not Found từ DB. | Đã đăng nhập |
| ITC_2.10(BVA)| summarize | Biên ID vượt mức int32 | Truyền submissionId = 2147483648. | HTTP 400/500 lỗi overflow DB/DTO. | Đã đăng nhập |
| ITC_3.1 | regenerate | Tạo lại cho bài báo đã có tóm tắt | Gọi API với submissionId cũ (Bài đã có summary). | HTTP 200 OK. Xóa sạch DB cũ, sinh mới tinh lập tức. | Bài đã tóm tắt |
| ITC_3.2 | regenerate | Tạo lại cho bài chưa có tóm tắt | Gọi API bằng thẻ submissionId hoàn toàn mới. | HTTP 200 OK. Vẫn lưu bản mới, không báo crash do không xóa được tóm tắt. | Bài chưa tự kéo |
| ITC_3.3 | regenerate | Thiếu Token xác thực | Gọi request không có Bearer Token. | HTTP 401 Unauthorized. | Không đăng nhập |
| ITC_3.4(BVA) | regenerate | Timeout API (Thời gian trễ Gateway)| Gọi tái tạo 1 bài cực kì dài bắt AI nghĩ 15-30s. | HTTP 200/504 Timeout không bị cash loop Node. | AI quá tải |
| ITC_3.5(BVA) | regenerate | Spam Button (Race Condition) | Nhấn gọi API Regenerate liên tục 3 lần trong 1 giây. | Hệ thống hoặc chặn hoặc chỉ xuất 1 bản, không lưu rác 3 dòng dữ liệu. | Đã đăng nhập |
| ITC_4.1 | getSummary | Xem chi tiết tóm tắt hợp lệ | Nhập submissionId có sẵn trong DB. | HTTP 200 OK. Rút ra chi tiết JSON tóm tắt. | Bài đã tóm tắt |
| ITC_4.2 | getSummary | Xem chi tiết thông tin ảo | Nhập submissionId không có tóm tắt. | HTTP 404 Not Found. "Summary for submission X not found". | Đã đăng nhập |
| ITC_4.3 | getSummary | Xem tóm tắt thiếu Token | Không có thẻ Bearer. | HTTP 401 Unauthorized. | Không đăng nhập |
| ITC_4.4(BVA) | getSummary | Biên ID độ dài bất thường | Truyền vào url param ID siêu dài (500 chữ). | HTTP 404 Not Found, không làm tràn SQL. | Đã đăng nhập |
| ITC_4.5(BVA) | getSummary | Biên param rỗng trống trải | Gọi /api/ai/summarize/ (Trống path param). | HTTP 404 Not Found. Báo Router thiếu endpoint. | Đã đăng nhập |

---

## 🚀 Postman Request Bodies

*Lưu ý: API AI Service yêu cầu truyền thông tin chuẩn theo mô tả DTO NestJS (Ví dụ: Bearer Token luôn phải có).*

### 1. Hàm kiểm tra Ngữ Pháp (`POST /api/ai/grammar/check` - Dự kiến URL)
```json
// ITC_1.1: Test Data sai luật (lỗi ngữ pháp)
{ 
  "type": "content", 
  "text": "He have go to school yesterday and seeing friends." 
}

// ITC_1.4 & 1.12: Test rỗng chữ/thiếu tham số
{ 
  "type": "", 
  "text": "" 
}

// ITC_1.6: Boundary min - Chữ 1 ký tự
{ 
  "type": "title", 
  "text": "A" 
}

// ITC_1.10: Data lách luật khoảng trắng
{ 
  "type": "abstract", 
  "text": "           " 
}

// ITC_1.11: Data độc hại cho AI Engine
{ 
  "type": "abstract", 
  "text": "🥰🥵☠️ 日本語 テスト 中文 테스트" 
}
```

### 2. Hàm Yêu Cầu Tự Động Tóm Tắt (`POST /api/ai/summarize`)
*(Giả định đây là URL POST nhận dạng `submissionId` qua body. Tùy thuộc vào thiết kế thực tế mà bạn truyền trên Body, hoặc Param).*
```json
// Data cơ bản cho ITC_2.1, ITC_2.2
{
  "submissionId": 12,
  "title": "Quantum Computing the future",
  "abstract": "Quantum computing is a rapidly-emerging technology..."
}

// Data lỗi vượt ranh giới ITC_2.9 & ITC_2.10
{
  "submissionId": -1,
  "title": "A",
  "abstract": "A"
}
```

### 3. Hàm Regenerate/Xem Tóm Tắt (`PUT`/`POST` & `GET`)
Đa phần các thao tác Re-Generate và Get Summary được thiết kế chạy từ Param ID trực tiếp (như Auth Service):
- `GET /api/ai/summary/1` (Hợp lệ)
- `GET /api/ai/summary/0` (Boundary Zero)
- `GET /api/ai/summary/-1` (Boundary Negative)
- `GET /api/ai/summary/2147483648` (Boundary DB Int Overflow)

*(Đối với regenerate có thể gọi `POST /api/ai/summary/1/regenerate`)*. Đừng quên thiết lập **100 Iterations** cho collection test để bắn phá xem Gemini AI có bị limit HTTP 429 Too Many Requests không nhé!
