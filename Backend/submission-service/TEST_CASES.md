# Submission Service - BVA & ITC Test Cases

Tài liệu này tổng hợp toàn bộ các Test Cases cho `submission-service`, đặc biệt nhấn vào các trường hợp Boundary Value Analysis (BVA) cùng với mock request body để dùng trực tiếp trong Postman, bộ test tự động hoặc test thủ công.

---

## 📋 Danh sách Test Cases (BVA + STC)

| Test Case ID | Function Name | Test Case Description | Test Case Procedure (Input) | Expected Results | Pre-conditions |
| --- | --- | --- | --- | --- | --- |
| STC_1.1 | create | Nộp bài mới thành công | Body: title, abstract, trackId, conferenceId hợp lệ + File PDF. | HTTP 201. Trả về object Submission, file URL từ Supabase | User đã login (JWT hợp lệ), Conference đang mở. |
| STC_1.2 | create | Nộp bài khi quá hạn (Deadline) | Gọi API với conferenceId đã qua ngày submissionDeadline. | HTTP 400. Báo lỗi "Hạn nộp bài đã qua: Submission deadline đã qua". | Conference đã đóng cổng nộp bài. |
| STC_1.3 | create | Thiếu file đính kèm | Gửi body đúng nhưng không đính kèm file trong field file. | HTTP 400. Lỗi validation "File bài nộp là bắt buộc". | FileInterceptor đang hoạt động. |
| STC_1.4 | create | Sai định dạng Track/Conference | Truyền trackId hoặc conferenceId không tồn tại trong hệ thống. | HTTP 404/400. Báo lỗi không tìm thấy Track hoặc Hội nghị tương ứng. | Kết nối với Conference Service ổn định. |
| STC_1.5 | create | Tiêu đề quá dài | Nhập title > 500 ký tự (theo DTO). | HTTP 400. Lỗi validation @MaxLength(500). | DTO sử dụng class-validator. |
| STC_1.11 | create | Kiểm tra loại file (MIME Type) | Tải lên file .exe nhưng đổi tên thành .pdf. | HTTP 400. Báo lỗi "Định dạng file không hợp lệ". | Hệ thống check file signature (Magic bytes). |
| STC_1.12 | create | File PDF có mật khẩu | Tải lên file PDF bị khóa bằng mật khẩu (Password Protected). | HTTP 201/400. Tùy thiết kế (Nếu hệ thống cần đọc nội dung để kiểm tra đạo văn thì phải báo lỗi). | |
| BVA_1.1 | create | Kiểm tra biên dưới Title (Min) | Nhập Title có 1 ký tự. Điền đủ các trường khác. | HTTP 201. Lưu thành công. | Thông tin đầy đủ |
| BVA_1.2 | create | Kiểm tra biên dưới Title (Lỗi) | Để trống trường Title (0 ký tự). | HTTP 400. Báo lỗi "title should not be empty". | DB column varchar(500) |
| BVA_1.3 | create | Kiểm tra biên trên Title (Max) | Nhập Title đúng 500 ký tự. | HTTP 201. Lưu thành công. | DB column varchar(500) |
| BVA_1.4 | create | Kiểm tra biên dưới File (Min) | Tải lên file PDF dung lượng cực nhỏ (1KB). | HTTP 201. Upload và lưu thành công. | |
| BVA_1.5 | create | Kiểm tra biên trên File (Max) | Tải lên file PDF dung lượng sát ngưỡng 20MB (20,480 KB). | HTTP 201. Upload và lưu thành công. | |
| BVA_1.6 | create | Kiểm tra biên trên File (Over) | Tải lên file PDF dung lượng vượt ngưỡng (VD: 20.1MB). | HTTP 400. Từ chối file. | |
| BVA_1.7 | create | Kiểm tra biên dưới coAuthors (Min) | Gửi coAuthors là mảng rỗng []. | HTTP 201. Lưu bài nộp thành công. | |
| BVA_1.8 | create | Kiểm tra biên dưới coAuthors (1 item) | Gửi coAuthors có đúng 1 đối tác giả. | HTTP 201. Lưu thành công. | |
| BVA_1.9 | create | Kiểm tra định dạng Track/Conference (0 hoặc âm) | Truyền trackId hoặc conferenceId không tồn tại trong hệ thống. | HTTP 404/400. Báo lỗi không tìm thấy Track hoặc Hội nghị tương ứng. | Kết nối với Conference Service ổn định. |
| BVA_1.10 | create | Kiểm tra bài trùng | Tile, trackId, conferenceId, file PDF trùng lặp | HTTP 400. Thất bại! Bạn đã nộp một bài báo với tiêu đề này trong Track này rồi. | |
| BVA_1.11 | create | Biên dưới Abstract (Min) | Nhập Abstract đúng độ dài tối thiểu (VD: 10 ký tự). | HTTP 201. Thành công. | |
| BVA_1.12 | create | Biên trên Abstract (Max) | Nhập Abstract đúng độ dài tối đa (VD: 2000 ký tự). | HTTP 201. Thành công. | |
| BVA_1.13 | create | Biên trên coAuthors (Max) | Gửi danh sách tác giả đạt ngưỡng tối đa (VD: 15 người). | HTTP 201. Thành công. | |
| BVA_1.14 | create | Biên trên coAuthors (Over) | Gửi danh sách tác giả vượt ngưỡng (Max + 1). | HTTP 400. Báo lỗi số lượng tác giả quá lớn. | |
| BVA_1.15 | create | Biên thời gian (Sát Deadline) | Nộp bài trước giờ đóng cổng 1 giây. | HTTP 201. Thành công. | |
| BVA_1.16 | create | Biên thời gian (Vừa quá Deadline) | Nộp bài sau khi đóng cổng đúng 1 giây. | HTTP 400. Báo lỗi hết hạn. | |
| STC_2.1 | update | Cập nhật thông tin text thành công (Không file) | PATCH /submissions/:id body: {"title":"New Title","abstract":"New Abstract"}. | HTTP 200. Thông tin bài nộp được cập nhật. Không tạo bản ghi mới trong submission_versions. | Bài nộp tồn tại, User là chủ sở hữu. |
| STC_2.2 | update | Cập nhật kèm file mới thành công | PATCH /submissions/:id đính kèm file PDF mới và body có thay đổi thông tin. | HTTP 200. Thông tin mới được lưu. Tạo 1 bản ghi mới trong submission_versions. | Bài nộp tồn tại. Supabase hoạt động bình thường. |
| STC_2.3 | update | Cập nhật khi đã hết hạn chỉnh sửa | PATCH /submissions/:id khi hội nghị đã qua ngày submissionDeadline. | HTTP 400. Báo lỗi "Hội nghị đã đóng cổng chỉnh sửa bài nộp". | Dữ liệu deadline từ Conference Service đã quá hạn. |
| STC_2.4 | update | Sai quyền sở hữu (Security) | User B dùng JWT của mình để PATCH bài nộp của User A. | HTTP 403. Báo lỗi "Bạn không có quyền chỉnh sửa bài nộp này". | ID bài nộp hợp lệ nhưng authorId không khớp với sub trong JWT. |
| STC_2.5 | update | Cập nhật bài nộp không tồn tại | Gọi PATCH với một UUID ngẫu nhiên không có trong DB. | HTTP 404. Báo lỗi "Submission với ID ... không tồn tại". | UUID đúng định dạng nhưng bài nộp không có thực. |
| STC_2.6 | update | Cập nhật bài nộp đã bị xóa | Gọi PATCH vào bài nộp có deletedAt khác null. | HTTP 404. Hệ thống không tìm thấy bài nộp để cập nhật. | Bài nộp đã bị xóa mềm trước đó. |
| STC_2.7 | update | Validation: Tiêu đề quá dài | Body có title vượt quá 500 ký tự. | HTTP 400. Lỗi validation @MaxLength(500). | DTO UpdateSubmissionDto có validator. |
| STC_2.8 | update | Lỗi upload file lên Supabase | Tắt kết nối mạng hoặc sai Key Supabase, sau đó thực hiện PATCH kèm file. | HTTP 500/400. Trạng thái Database không thay đổi (Transaction rollback thành công). | Logic sử dụng queryRunner trong service. |
| STC_2.9 | update | Cập nhật bài nộp đã được ACCEPTED | PATCH bài nộp khi trạng thái không còn là SUBMITTED. | HTTP 400. Báo lỗi không cho phép sửa bài khi đã vào giai đoạn Review hoặc đã có kết quả. | status bài nộp khác SUBMITTED. |
| STC_2.10 | update | Ghi đè file đồng thời (Race Condition) | 2 tác giả cùng lúc nhấn Update file cho cùng 1 bài nộp. | HTTP 200/409. Hệ thống xử lý tuần tự, bản ghi cuối cùng phải khớp với file cuối trên Storage. | Dùng Database Lock hoặc Transaction. |
| STC_2.11 | update | Kiểm tra File bị lỗi (Corrupt) | Tải lên một file PDF bị hỏng cấu hình (không thể mở). | HTTP 400. Hệ thống phát hiện file corrupt và yêu cầu tải lại. | |
| BVA_2.1 | update | Biên trên Title (Max) | Cập nhật Title mới đúng 500 ký tự. | HTTP 200. Cập nhật thành công. | Bài nộp tồn tại, User là chủ sở hữu. |
| BVA_2.2 | update | Biên trên File (Max) | Thay thế file cũ bằng file mới sát ngưỡng 20MB. | HTTP 200. Tạo version mới thành công. | |
| BVA_2.3 | update | Biên trên File (Over) | Thay thế file cũ bằng file mới > 20MB. | HTTP 400. Hệ thống từ chối file. | |
| BVA_2.4 | update | Biên thời gian (Sát Deadline) | Gửi request update trước Deadline 1 giây. | HTTP 200. Cập nhật thành công. | Conference đang mở cổng submission. |
| BVA_2.5 | update | Biên thời gian (Quá Deadline) | Gửi request update sau Deadline 1 giây. | HTTP 400. Báo lỗi hội nghị đã đóng. | Deadline đã trôi qua. |
| BVA_2.6 | update | Biên trạng thái (Status) | Update bài nộp khi status vừa chuyển từ SUBMITTED sang REVIEWING. | HTTP 400. Không cho phép sửa khi đang chấm. | Status bài nộp là REVIEWING. |
| STC_3.1 | findAll | Liệt kê tất cả bài nộp (Mặc định) | GET /submissions. | HTTP 200. Trả về danh sách bài nộp, default page 1, limit 10. | Có dữ liệu trong bảng submissions. |
| STC_3.2 | findAll | Kiểm tra phân trang (Pagination) | GET /submissions?page=2&limit=5. | HTTP 200. Trả về đúng 5 bản ghi của trang 2. Metadata chính xác. | Hệ thống có ít nhất 6 bài nộp. |
| STC_3.3 | findAll | Lọc bài nộp theo Track | GET /submissions?trackId=1. | HTTP 200. Tất cả bài nộp trả về có trackId=1. | Có bài nộp thuộc Track 1. |
| STC_3.4 | findAll | Lọc bài nộp theo Conference | GET /submissions?conferenceId=10. | HTTP 200. Chỉ hiển thị bài nộp thuộc conferenceId=10. | Có bài nộp thuộc Conference 10. |
| STC_3.5 | findAll | Lọc bài nộp theo trạng thái (Status) | GET /submissions?status=ACCEPTED. | HTTP 200. Chỉ hiển thị các bài nộp ACCEPTED. | Có bài nộp đã được chấp nhận. |
| STC_3.6 | findAll | Tìm kiếm theo từ khóa (Search) | GET /submissions?search=AI. | HTTP 200. Trả về các bài nộp có tiêu đề hoặc abstract chứa "AI". | Có bài nộp chứa từ khóa "AI". |
| STC_3.7 | findAll | Kết hợp nhiều bộ lọc | GET /submissions?trackId=1&status=SUBMITTED&limit=20. | HTTP 200. Trả về danh sách thỏa mãn các điều kiện. | Có dữ liệu khớp với bộ lọc. |
| STC_3.8 | findAll | Kiểm tra ẩn bài nộp đã xóa (Soft-delete) | GET /submissions. | HTTP 200. Danh sách không bao gồm bài có deletedAt != null. | Có ít nhất 1 bài đã bị xóa mềm. |
| STC_3.9 | findAll | Truyền tham số sai kiểu dữ liệu | GET /submissions?page=abc hoặc limit=0. | HTTP 400. Báo lỗi validation do @Min(1) và @IsInt(). | ValidationPipe toàn cục. |
| STC_3.10 | findAll | Truyền Status không hợp lệ | GET /submissions?status=INVALID_STATUS. | HTTP 400. Lỗi validation @IsEnum(SubmissionStatus). | DTO có @IsEnum. |
| STC_3.11 | findAll | Kiểm tra quyền truy cập (Author) | Token Author gọi API. | HTTP 200. Chỉ hiển thị các bài nộp do user đó tạo. | User đã login và có bài nộp. |
| STC_3.12 | findAll | Kiểm tra quyền truy cập (Admin/Chair) | Token Admin gọi API. | HTTP 200. Hiển thị toàn bộ bài nộp. | User có role Admin/Chair. |
| BVA_3.1 | findAll | Kiểm tra biên dữ liệu rỗng | DB không có bài nào. | HTTP 200. Trả về mảng rỗng [] và total: 0. | Database trống. |
| BVA_3.2 | findAll | Kiểm tra biên dữ liệu (Trang cuối) | Query page = tổng số trang. | HTTP 200. Trả về các bài nộp còn lại cuối cùng. | Đã biết tổng số trang. |
| BVA_3.3 | findAll | Vượt quá tổng số trang | Query page > tổng số trang. | HTTP 200. Trả về mảng rỗng [] không lỗi. | |
| STC_4.1 | findOne | Truy vấn bài nộp hiện có thành công | GET /submissions/:id với UUID hợp lệ của bài hoạt động. | HTTP 200. Trả về JSON chi tiết: title, abstract, status, fileUrl, versions. | Bài nộp tồn tại, isActive = true. |
| STC_4.2 | findOne | Truy vấn bài nộp không tồn tại | GET /submissions/:id với UUID ngẫu nhiên. | HTTP 404. Báo lỗi "Submission với ID ... không tồn tại". | UUID đúng định dạng nhưng không có trong DB. |
| STC_4.3 | findOne | Sai định dạng ID (Validation) | GET /submissions/123. | HTTP 400. Báo lỗi "Validation failed (uuid is expected)". | ParseUUIDPipe trong Controller. |
| STC_4.4 | findOne | Truy vấn bài nộp đã bị xóa mềm | GET /submissions/:id với deletedAt != null. | HTTP 404. Không tìm thấy do filter deletedAt: IsNull(). | Bài nộp đã bị xóa. |
| STC_4.5 | findOne | Kiểm tra quyền truy cập (Ownership) | Token User B xem bài của User A. | HTTP 403 hoặc 200 (tùy yêu cầu). | Có 2 user khác nhau. |
| STC_4.6 | findOne | Kiểm tra trạng thái bài nộp (Inactive) | Truy vấn bài nộp isActive = false. | HTTP 404. Hệ thống coi như không tồn tại. | Bài nộp bị khóa. |
| BVA_4.1 | findOne | Kiểm tra biên Soft-delete | Truy cập ID vừa softDelete. | HTTP 404. Không tồn tại. | Bài nộp vừa bị xóa mềm. |
| BVA_4.2 | findOne | Bài nộp ở biên trạng thái isActive | Truy cập ID isActive = false. | HTTP 404. | Bài nộp bị khóa/ẩn. |
| BVA_4.3 | findOne | Kiểm tra biên Version History (0 version) | Truy cập bài nộp mới tạo chưa update. | HTTP 200. versions = []. | Bài nộp mới tạo. |
| BVA_4.4 | findOne | Kiểm tra biên Version History (Nhiều version) | Truy cập bài đã nhiều lần chỉnh sửa. | HTTP 200. Returs versions đầy đủ. | Bài nộp có lịch sử. |
| STC_5.1 | updateStatus | Phê duyệt bài nộp thành công (Admin) | PATCH /submissions/:id/status body: {"status":"ACCEPTED"}, token Admin. | HTTP 200. Status đổi thành ACCEPTED. Email "Accepted" gửi tác giả. | Bài tồn tại, SUBMITTED hoặc REVIEWING. |
| STC_5.2 | updateStatus | Từ chối bài nộp kèm ghi chú | PATCH /submissions/:id/status body: {"status":"REJECTED","note":"Nội dung chưa phù hợp"}. | HTTP 200. Status REJECTED, email có ghi chú. | Bài tồn tại. |
| STC_5.3 | updateStatus | Sai quyền hạn (Author thử đổi status) | Token Author gọi API. | HTTP 403. Báo lỗi "Bạn không có quyền thực hiện hành động này". | Chỉ Admin/Chair mới được phép. |
| STC_5.4 | updateStatus | Cập nhật status cho bài không tồn tại | PATCH with random UUID. | HTTP 404. Báo lỗi "Submission với ID ... không tồn tại". | UUID đúng định dạng. |
| STC_5.5 | updateStatus | Chuyển sang status không hợp lệ | body.status="FLYING". | HTTP 400. Lỗi validation @IsEnum. | DTO UpdateStatusDto có validator. |
| STC_5.6 | updateStatus | Cập nhật status cho bài đã bị xóa mềm | PATCH deleted submission. | HTTP 404. Không tìm thấy. | Bài đã xóa mềm. |
| STC_5.7 | updateStatus | Chuyển trạng thái sang CAMERA_READY thủ công | Admin set status CAMERA_READY. | HTTP 400. Lỗi nếu logic chỉ cho phép khi Author upload file. | Theo state-machine. |
| STC_5.8 | updateStatus | Lỗi gửi email (Resend API) | Ngắt mạng hoặc sai API key khi đổi status. | HTTP 200 hoặc 500 tùy thiết kế. DB rollback nếu dùng transaction. | EmailService được gọi. |
| STC_5.9 | updateStatus | Chặn nhảy cóc trạng thái | Chuyển thẳng từ SUBMITTED sang CAMERA_READY (bỏ qua Accept). | HTTP 400. Báo lỗi "Quy trình chuyển đổi trạng thái không hợp lệ". | Logic State Machine được thiết lập. |
| STC_5.10 | updateStatus | Chặn quay ngược trạng thái | Bài đã CAMERA_READY, Admin cố ý đổi ngược về REVIEWING. | HTTP 400. Không cho phép quay lại khi đã nộp bản hoàn thiện. | |
| BVA_5.1 | updateStatus | Biên Enum: Giá trị đầu tiên | status=SUBMITTED. | HTTP 200. Status được cập nhật/giữ nguyên. | Bài tồn tại. |
| BVA_5.2 | updateStatus | Biên Enum: Giá trị cuối cùng | status=CAMERA_READY. | HTTP 200. Cập nhật thành công. | Bài đã ACCEPTED. |
| BVA_5.3 | updateStatus | Biên Enum: Giá trị ngoài danh mục | status="INVALID_STATUS". | HTTP 400. "status must be a valid enum value". | DTO có @IsEnum. |
| BVA_5.4 | updateStatus | Biên độ dài Ghi chú (Min) | note chỉ 1 ký tự. | HTTP 200. Cập nhật thành công. | Admin thực hiện. |
| BVA_5.5 | updateStatus | Biên độ dài Ghi chú (Max) | note 1000 ký tự. | HTTP 200. Cập nhật thành công. | DB có giới hạn. |
| BVA_5.6 | updateStatus | Biên độ dài Ghi chú (Over) | note 1001 ký tự. | HTTP 400. Validation fail. | DTO @MaxLength. |
| BVA_5.7 | updateStatus | Biên kiểm quyền hạn (Role) | Token Author gọi API. | HTTP 403. Báo lỗi. | User không phải Admin/Chair. |
| BVA_5.8 | updateStatus | Biên kiểm quyền hạn (Role) | Token Admin/Chair gọi API. | HTTP 200. Cập nhật thành công. | User là Admin/Chair. |
| STC_6.1 | softDelete | Xóa mềm bài nộp thành công (Author) | DELETE /submissions/:id token owner. | HTTP 200. Message "Xóa bài nộp thành công". | Bài tồn tại, deletedAt = NULL. |
| STC_6.2 | softDelete | Kiểm tra tính ẩn sau khi xóa (findOne) | GET /submissions/:id của bài đã xóa. | HTTP 404. Không tìm thấy. | Bài đã soft-delete. |
| STC_6.3 | softDelete | Sai quyền hạn (Security) | User B xóa bài của User A. | HTTP 403. Báo lỗi "Bạn không có quyền xóa bài nộp này". | ID bài hợp lệ nhưng sai Author. |
| STC_6.4 | softDelete | Xóa bài nộp không tồn tại | DELETE random UUID. | HTTP 404. "Submission với ID ... không tồn tại". | UUID hợp lệ. |
| STC_6.5 | softDelete | Kiểm tra quan hệ Version History | Kiểm tra submission_versions sau khi xóa. | Submission_versions vẫn tồn tại. | Bài nộp có lịch sử phiên bản. |
| BVA_6.1 | softDelete | Kiểm tra biên UUID (Min length) | ID chỉ 1 ký tự hoặc rỗng. | HTTP 400. Báo lỗi UUID. | |
| BVA_6.2 | softDelete | Xóa bản ghi mới nhất (Biên thời gian) | Tạo bài và xóa ngay < 1s. | HTTP 200. deletedAt được cập nhật. | Bài vừa tạo. |
| BVA_6.3 | softDelete | Xóa bản ghi đã bị xóa (Biên logic) | Gọi API xóa lần 2 cùng ID. | HTTP 404. Báo lỗi "Submission không tồn tại". | Bài đã có deletedAt. |
| BVA_6.4 | softDelete | Kiểm tra biên quyền hạn (Role) | User không phải chủ sở hữu xóa. | HTTP 403. Báo lỗi. | User B xóa User A. |
| BVA_6.5 | softDelete | Kiểm tra biên trạng thái (Active) | Xóa bài isActive = false. | HTTP 404. Không tìm thấy. | Submission bị khóa. |
| BVA_6.6 | softDelete | Kiểm tra biên tích hợp (Storage) | Xóa bài có file lớn 20MB. | HTTP 200. Bản ghi ẩn, file Storage giữ nguyên. | Bài có file 20MB. |
| BVA_6.7 | softDelete | Kiểm tra biên quan hệ (Versions) | Xóa bài có 10 bản ghi versions. | HTTP 200. Submission ẩn, versions vẫn tồn tại. | Bài có nhiều lịch sử. |
| STC_7.1 | countSubmissionsByAuthorId | Đếm cho tác giả có nhiều bài nộp | GET /submissions/author/:authorId/count với author có 3 bài active. | HTTP 200. {"message":"...","data":{"count":3}}. | DB có 3 bài active cho author. |
| STC_7.2 | countSubmissionsByAuthorId | Đếm cho tác giả chưa nộp bài nào | authorId hợp lệ nhưng chưa nộp bài. | HTTP 200. {"data":{"count":0}}. | authorId tồn tại ở Identity. |
| STC_7.3 | countSubmissionsByAuthorId | Kiểm tra quyền truy cập (Security) | Không đính kèm Bearer Token. | HTTP 401. "Unauthorized". | JwtAuthGuard bật. |
| BVA_7.1 | countSubmissionsByAuthorId | Biên dưới (0 bài nộp) | authorId của User mới. | HTTP 200. count:0. | User tồn tại. |
| BVA_7.2 | countSubmissionsByAuthorId | Biên dưới (1 bài nộp) | authorId có đúng 1 bài. | HTTP 200. count:1. | User có 1 bài active. |
| BVA_7.3 | countSubmissionsByAuthorId | Biên trên (Ngưỡng giới hạn) | User nộp đủ 5 bài. | HTTP 200. count:5. | User đã nộp 5 bài. |
| BVA_7.4 | countSubmissionsByAuthorId | Biên dữ liệu bị xóa (Soft-delete) | User có 1 bài active và 1 bài soft-deleted. | HTTP 200. count:1. | deletedAt != null cho bài thứ 2. |
| BVA_7.5 | countSubmissionsByAuthorId | Biên dữ liệu không hoạt động | User có 1 active và 1 isActive=false. | HTTP 200. count:1. | Bài thứ 2 isActive=false. |
| BVA_7.6 | countSubmissionsByAuthorId | Biên định dạng ID (Min) | authorId = 0 (nếu ID bắt đầu từ 1). | HTTP 200 hoặc 400. | |
| BVA_7.7 | countSubmissionsByAuthorId | Biên định dạng ID (Max) | authorId = BigInt maximum. | HTTP 200. Trả kết quả chính xác. | |
| BVA_7.8 | countSubmissionsByAuthorId | Sai kiểu dữ liệu ID | authorId = "abc". | HTTP 400. "numeric string is expected". | ParseIntPipe. |
| STC_8.1 | getAnonymizedReviews | Xem review thành công (Bài đã có kết quả) | GET /submissions/:id/reviews với ID bài ACCEPTED. | HTTP 200. Trả mảng review gồm score, commentForAuthor, recommendation. | Bài tồn tại, Author đã login. |
| STC_8.2 | getAnonymizedReviews | Ẩn review khi chưa có kết quả cuối | API khi status SUBMITTED/REVIEWING. | HTTP 200. Trả mảng rỗng []. | Bài đang chấm. |
| STC_8.3 | getAnonymizedReviews | Kiểm tra quyền sở hữu (Security) | Token User B xem review bài User A. | HTTP 403. Báo lỗi. | ID bài hợp lệ nhưng sai tác giả. |
| STC_8.4 | getAnonymizedReviews | Bài nộp không tồn tại | API với UUID ngẫu nhiên. | HTTP 404. Báo lỗi "Submission với ID ... không tồn tại". | UUID hợp lệ. |
| BVA_8.1 | getAnonymizedReviews | Biên trạng thái (Hợp lệ) | API ngay khi status vừa chuyển sang ACCEPTED. | HTTP 200. Trả review ẩn danh. | Admin vừa cập nhật status. |
| BVA_8.2 | getAnonymizedReviews | Biên số lượng Review (1 item) | Bài có đúng 1 review. | HTTP 200. Mảng có 1 phần tử. | |
| BVA_8.3 | getAnonymizedReviews | Biên số lượng Review (Max) | Bài có 5-10 reviews. | HTTP 200. Trả đầy đủ danh sách. | |
| BVA_8.4 | getAnonymizedReviews | Biên định dạng nội dung (Rỗng) | Reviewer để trống commentForAuthor. | HTTP 200. Trả object score và comment null/rỗng. | Reviewer không nhập comment. |
| STC_9.1 | getSubmissionIdsByTrackId | Lấy danh sách ID thành công | Track hợp lệ. | HTTP 200. Trả mảng UUID của các bài. | Có 3 bài thuộc trackId trong DB. |
| STC_9.2 | getSubmissionIdsByTrackId | Track không có bài nộp nào | Track hợp lệ nhưng no submissions. | HTTP 200. Trả mảng rỗng []. | Track tồn tại. |
| STC_9.3 | getSubmissionIdsByTrackId | Sai định dạng Track ID | trackId là chuỗi ký tự. | HTTP 400. Validation numeric string. | ParseIntPipe. |
| BVA_9.1 | getSubmissionIdsByTrackId | Biên dưới TrackId (Min) | trackId = 1. | HTTP 200. Trả danh sách ID nếu có. | TrackId =1 tồn tại. |
| BVA_9.2 | getSubmissionIdsByTrackId | Biên dưới TrackId (Lỗi) | trackId = 0 hoặc âm. | HTTP 400. Validation. | |
| BVA_9.3 | getSubmissionIdsByTrackId | Biên số lượng ID (0 item) | Track hợp lệ nhưng no submissions. | HTTP 200. Trả mảng rỗng []. | |
| BVA_9.4 | getSubmissionIdsByTrackId | Biên trạng thái dữ liệu | Track có 1 active và 1 inactive. | HTTP 200. Chỉ chứa ID active. | |
| BVA_9.5 | getSubmissionIdsByTrackId | Biên dữ liệu bị xóa | Track có 1 bài regular và 1 softDeleted. | HTTP 200. Không bao gồm ID đã xóa. | |
| STC_10.1 | uploadCameraReady | Tải bản hoàn thiện thành công | PATCH /submissions/:id/camera-ready kèm file PDF bản cuối. | HTTP 200. Status chuyển sang CAMERA_READY, lưu cameraReadyFileUrl. | Bài ở status ACCEPTED. |
| STC_10.2 | uploadCameraReady | Thiếu file đính kèm | Gọi API không có file. | HTTP 400. Báo lỗi "File bản hoàn thiện là bắt buộc". | FileInterceptor đang hoạt động. |
| STC_10.3 | uploadCameraReady | Sai quyền sở hữu (Security) | User B upload cho User A. | HTTP 403. Báo lỗi. | ID bài hợp lệ nhưng không phải của User B. |
| STC_10.4 | uploadCameraReady | Kiểm tra giới hạn dung lượng file | Upload file PDF > 20MB. | HTTP 400. File quá lớn bị từ chối. | MulterModule giới hạn fileSize. |
| STC_10.5 | uploadCameraReady | Bài nộp không tồn tại | API với UUID ngẫu nhiên. | HTTP 404. Báo lỗi "Submission với ID ... không tồn tại". | UUID đúng định dạng. |
| STC_10.6 | uploadCameraReady | Kiểm tra tính nhất quán dữ liệu | Sau khi upload Camera Ready thành công, gọi API findOne. | HTTP 200. Trường cameraReadyFileUrl phải có dữ liệu và status phải là CAMERA_READY. | |
| BVA_10.1 | uploadCameraReady | Biên trạng thái (Hợp lệ) | Upload khi status vừa chuyển sang ACCEPTED. | HTTP 200. Upload thành công. | Admin vừa phê duyệt. |
| BVA_10.2 | uploadCameraReady | Biên trạng thái (Lỗi) | Upload khi status là REVIEWING. | HTTP 400. Báo lỗi trạng thái không hợp lệ. | Bài chưa có kết quả cuối. |
| BVA_10.3 | uploadCameraReady | Biên trạng thái (Đã nộp rồi) | Upload lại khi status đã CAMERA_READY. | HTTP 200. Ghi đè file cũ thành công. | Cho phép cập nhật bản cuối. |
| BVA_10.4 | uploadCameraReady | Biên dung lượng File (Min) | Upload file PDF 1KB. | HTTP 200. Lưu thành công. | |
| BVA_10.5 | uploadCameraReady | Biên dung lượng File (Max) | Upload file sát ngưỡng 20MB. | HTTP 200. Lưu thành công. | Cấu hình giới hạn 20MB. |
| BVA_10.6 | uploadCameraReady | Biên dung lượng File (Over) | Upload file > 20MB. | HTTP 413/400. Từ chối. | |
| BVA_10.7 | uploadCameraReady | Biên thời gian (Sát Deadline) | Upload trước Deadline 1 giây. | HTTP 200. Chấp nhận. | Theo cấu hình Conference. |
| BVA_10.8 | uploadCameraReady | Biên thời gian (Trễ) | Upload sau Deadline 1 giây. | HTTP 400. Báo lỗi đóng cổng. | |

---

## 🚀 Mock Request Bodies & Test Data

### 1. Create Submission (`POST /submissions`)

#### Payload cơ bản hợp lệ
```json
{
  "title": "A Study on Neural Network Pruning",
  "abstract": "This paper evaluates pruning strategies for large-scale neural networks.",
  "trackId": 1,
  "conferenceId": 10,
  "coAuthors": [
    { "name": "Nguyễn Văn B", "email": "coauthor1@example.com" }
  ]
}
```

#### BVA_1.1: Title 1 ký tự
```json
{
  "title": "A",
  "abstract": "Short abstract for boundary test.",
  "trackId": 1,
  "conferenceId": 10,
  "coAuthors": []
}
```

#### BVA_1.2: Title rỗng
```json
{
  "title": "",
  "abstract": "Abstract is present.",
  "trackId": 1,
  "conferenceId": 10,
  "coAuthors": []
}
```

#### BVA_1.3: Title đúng 500 ký tự
```json
{
  "title": "${'A'.repeat(500)}",
  "abstract": "Abstract for max title boundary.",
  "trackId": 1,
  "conferenceId": 10,
  "coAuthors": []
}
```

#### BVA_1.4: File PDF 1KB
- Sử dụng file PDF dummy `one_kb.pdf` ~1024 bytes.
- Upload với field `file`.

#### BVA_1.5: File PDF 20MB
- Sử dụng file `max_20mb.pdf` có kích thước gần 20,480 KB.
- Upload field `file`.

#### BVA_1.6: File PDF 20.1MB
- Sử dụng file `over_20mb.pdf` > 20,480 KB.
- Upload nên trả HTTP 400.

#### BVA_1.7: coAuthors rỗng
```json
{
  "title": "Author-only submission",
  "abstract": "Testing no co-authors.",
  "trackId": 1,
  "conferenceId": 10,
  "coAuthors": []
}
```

#### BVA_1.8: coAuthors 1 item
```json
{
  "title": "Single co-author submission",
  "abstract": "Testing exactly one co-author.",
  "trackId": 1,
  "conferenceId": 10,
  "coAuthors": [
    { "name": "Trần Văn C", "email": "coauthor-single@example.com" }
  ]
}
```

#### BVA_1.9: trackId / conferenceId không tồn tại
```json
{
  "title": "Invalid track/conference",
  "abstract": "Use invalid numeric IDs.",
  "trackId": 999999,
  "conferenceId": 999999,
  "coAuthors": []
}
```

#### BVA_1.10: Submission trùng lặp
- Tạo một submission hợp lệ với `title = "Duplicate Title"`, `trackId=1`, `conferenceId=10`, `file=duplicate.pdf`.
- Gọi lại với payload tương tự để kiểm tra thông báo trùng lặp.

### 2. Update Submission (`PATCH /submissions/:id`)

#### Text-only update (STC_2.1)
```json
{
  "title": "Updated Paper Title",
  "abstract": "Updated abstract content."
}
```

#### File replacement update (STC_2.2)
- Gửi `multipart/form-data` với field `file` chứa PDF mới và body trên.

#### BVA_2.1: Update Title 500 ký tự
```json
{
  "title": "${'B'.repeat(500)}"
}
```

#### BVA_2.2 / BVA_2.3: File update tại biên
- `file`: `max_20mb.pdf` để thành công.
- `file`: `over_20mb.pdf` để nhận 400.

#### BVA_2.4 / BVA_2.5: Deadline
- Đặt `conference.submissionDeadline` trước/sau 1 giây so với giờ test.

#### BVA_2.6: Status REVIEWING
- Thử PATCH khi `submission.status = REVIEWING`.

### 3. Find All Submissions (`GET /submissions`)

#### Mặc định
- `GET /submissions`

#### Phân trang
- `GET /submissions?page=2&limit=5`

#### Match filter
- `GET /submissions?trackId=1`
- `GET /submissions?conferenceId=10`
- `GET /submissions?status=ACCEPTED`
- `GET /submissions?search=AI`
- `GET /submissions?trackId=1&status=SUBMITTED&limit=20`

#### Validation sai kiểu
- `GET /submissions?page=abc`
- `GET /submissions?limit=0`
- `GET /submissions?status=INVALID_STATUS`

#### Author / Admin access
- Token Author: chỉ thấy submissions của chính user.
- Token Admin/Chair: thấy toàn bộ submissions.

### 4. Get Submission Details (`GET /submissions/:id`)

#### Hợp lệ
- `GET /submissions/{validSubmissionId}`

#### Không tồn tại
- `GET /submissions/{random-uuid}`

#### ID sai định dạng
- `GET /submissions/123`

#### Soft-delete / inactive
- `GET /submissions/{softDeletedId}` => 404
- `GET /submissions/{inactiveId}` => 404

#### Version history
- Mới tạo: versions = []
- Nhiều phiên bản: versions.length >= 2

### 5. Update Submission Status (`PATCH /submissions/:id/status`)

#### Accept
```json
{
  "status": "ACCEPTED"
}
```

#### Reject with note
```json
{
  "status": "REJECTED",
  "note": "Nội dung chưa phù hợp"
}
```

#### Invalid enum
```json
{
  "status": "FLYING"
}
```

#### Note boundary
```json
{
  "status": "REJECTED",
  "note": "A"
}
```

```json
{
  "status": "REJECTED",
  "note": "${'N'.repeat(1000)}"
}
```

#### Status camera ready boundary
- `status = "CAMERA_READY"` trên bài đã ACCEPTED.

### 6. Soft Delete Submission (`DELETE /submissions/:id`)

#### Successful
- `DELETE /submissions/{existingSubmissionId}`

#### Soft delete behavior
- `GET /submissions/{deletedSubmissionId}` => 404
- versions vẫn tồn tại trong DB.

#### Invalid UUID
- `DELETE /submissions/1`

#### Double delete
- `DELETE /submissions/{deletedId}` lần 2 => 404

#### Inactive record
- `DELETE /submissions/{inactiveId}` => 404

### 7. Count Submissions By Author (`GET /submissions/author/:authorId/count`)

#### Existing author
- `GET /submissions/author/123/count` => count = 3

#### Author no submissions
- `GET /submissions/author/456/count` => count = 0

#### No token
- `GET /submissions/author/123/count` không kèm Bearer => 401

#### ID invalid
- `GET /submissions/author/abc/count` => 400

### 8. Get Anonymized Reviews (`GET /submissions/:id/reviews`)

#### Accepted submission
- `GET /submissions/{acceptedSubmissionId}/reviews`

#### In progress submission
- `GET /submissions/{reviewingSubmissionId}/reviews` => []

#### Unauthorized user
- Token User B xem User A => 403

#### No submission
- `GET /submissions/{random-uuid}/reviews` => 404

### 9. Get Submission IDs By Track (`GET /submissions/track/:trackId/ids`)

#### Existing track
- `GET /submissions/track/1/ids`

#### Empty track
- `GET /submissions/track/999/ids` => []

#### Invalid trackId
- `GET /submissions/track/abc/ids` => 400
- `GET /submissions/track/0/ids` => 400 if @Min(1)

#### Soft-delete / inactive filter
- Chỉ trả về submissions isActive=true và deletedAt=NULL

### 10. Upload Camera Ready (`PATCH /submissions/:id/camera-ready`)

#### Valid file
- Upload `camera_ready_1kb.pdf`, `camera_ready_max20mb.pdf`, `camera_ready_over20mb.pdf`.

#### Required file
- Không đính kèm file => 400.

#### Wrong owner
- Token User B upload cho User A => 403.

#### Status boundary
- `REVIEWING` => 400
- `ACCEPTED` => 200
- `CAMERA_READY` (upload lại) => 200 ghi đè.

#### Deadline boundary
- Upload 1s trước deadline => 200
- Upload 1s sau deadline => 400

---

## 📌 Gợi ý tạo mock file PDF

- `one_kb.pdf`: file PDF dummy với kích thước ~1KB.
- `max_20mb.pdf`: file PDF dummy với kích thước ~20,480 KB.
- `over_20mb.pdf`: file PDF dummy với kích thước ~20,500 KB.
- `duplicate.pdf`: cùng file để kiểm tra trùng lặp nội dung.
- `camera_ready_1kb.pdf`, `camera_ready_max20mb.pdf`, `camera_ready_over20mb.pdf`.

---

## 💡 Lưu ý

- Các test BVA đa phần dùng `trackId`, `conferenceId`, `authorId` và `submission.status` phù hợp.
- Đảm bảo token dùng cho Author khác và Admin/Chair tương ứng với quyền kiểm tra.
- Dùng request body JSON với dữ liệu `title` / `abstract` đúng biên để tối đa hóa phủ BVA.
- Với các gọi file, chọn `Content-Type: multipart/form-data` và field `file`.
