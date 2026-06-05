# PHỤ LỤC HỢP ĐỒNG
## DANH SÁCH YÊU CẦU CHỨC NĂNG HỆ THỐNG
### Nền Tảng Học Tiếng Việt Trực Tuyến — MLS (My Language School)

---

| | |
|---|---|
| **Tên tài liệu** | Phụ lục Yêu cầu Chức năng Hệ thống |
| **Mã tài liệu** | MLS-PHU-LUC-01 |
| **Phiên bản** | V3.0 |
| **Ngày lập** | 07/06/2025 |
| **Thuộc hợp đồng số** | _________________________ |
| **Bên cung cấp** | _________________________ |
| **Bên sử dụng** | _________________________ |

---

## QUY ƯỚC

| Ký hiệu | Ý nghĩa |
|---|---|
| **[CAO]** | Chức năng bắt buộc — MVP (triển khai trong Phase 1–4) |
| **[TRUNG BÌNH]** | Chức năng quan trọng (triển khai trong Phase 5–6) |
| **[THẤP]** | Chức năng nâng cao — có thể bổ sung sau MVP |
| **[NGOÀI PHẠM VI]** | Không nằm trong phạm vi hợp đồng này |

---

## I. TỔNG QUAN HỆ THỐNG

Hệ thống **MLS** là nền tảng học tiếng Việt trực tuyến dành cho người nước ngoài và Việt kiều, hỗ trợ mô hình **multi-tenant** (nhiều trung tâm đào tạo độc lập trên cùng một hệ thống). Hệ thống bao gồm:

- **Cổng học viên (Web + Mobile)**: Học video, làm bài kiểm tra, theo dõi tiến độ
- **Hệ thống quản trị (Admin Panel)**: Quản lý nội dung, người dùng, doanh thu
- **API Backend**: ASP.NET Core 10, kiến trúc Clean Architecture + CQRS
- **Cơ sở dữ liệu**: PostgreSQL 18, phân tách schema theo từng tenant
- **AI Evaluation Service**: Python FastAPI, tích hợp GPT-4o

**Chương trình học:** 6 cấp độ (Level 1 – Nhập môn đến Level 6 – Nâng cao)

**4 kỹ năng đánh giá:** Nghe – Nói – Đọc – Viết

---

## II. MODULE 1 — QUẢN LÝ NGƯỜI DÙNG & XÁC THỰC

### 2.1 Đăng ký & Đăng nhập

| Mã YC | Tên chức năng | Mô tả chi tiết | Ưu tiên |
|---|---|---|---|
| AUTH-01 | Đăng ký bằng Email | Học viên tạo tài khoản bằng email + mật khẩu. Mật khẩu mã hóa bằng BCrypt. | **[CAO]** |
| AUTH-02 | Đăng nhập bằng Email | Xác thực email + mật khẩu, trả về Access Token (JWT, TTL 15 phút) và Refresh Token (TTL 30 ngày). | **[CAO]** |
| AUTH-03 | Đăng nhập Google OAuth 2.0 | Học viên đăng nhập bằng tài khoản Google. Tự động tạo tài khoản nếu chưa tồn tại. | **[CAO]** |
| AUTH-04 | Làm mới Access Token | Dùng Refresh Token để cấp Access Token mới mà không cần đăng nhập lại (Refresh Token Rotation). | **[CAO]** |
| AUTH-05 | Đăng xuất | Vô hiệu hóa Refresh Token hiện tại, xóa session trên thiết bị. | **[CAO]** |
| AUTH-06 | Đăng xuất toàn bộ thiết bị | Vô hiệu hóa tất cả Refresh Token của người dùng trên mọi thiết bị. | **[CAO]** |

### 2.2 Xác minh & Phục hồi tài khoản

| Mã YC | Tên chức năng | Mô tả chi tiết | Ưu tiên |
|---|---|---|---|
| AUTH-07 | Xác minh email (OTP 6 số) | Sau đăng ký, hệ thống gửi mã OTP 6 chữ số qua email. OTP có TTL 24 giờ. Người dùng nhập OTP để kích hoạt tài khoản. | **[CAO]** |
| AUTH-08 | Giới hạn gửi OTP | Tối đa 3 lần gửi OTP/15 phút/IP để chống spam. | **[CAO]** |
| AUTH-09 | Quên mật khẩu | Người dùng nhập email, hệ thống gửi link đặt lại mật khẩu (có TTL). | **[CAO]** |
| AUTH-10 | Đặt lại mật khẩu | Người dùng dùng link/token để thiết lập mật khẩu mới. Token dùng một lần. | **[CAO]** |
| AUTH-11 | Đổi mật khẩu | Người dùng đã đăng nhập tự đổi mật khẩu (cần nhập mật khẩu cũ để xác nhận). | **[CAO]** |
| AUTH-12 | OTP qua SMS | Gửi mã OTP qua SMS (tích hợp Esms.vn) làm phương thức xác thực thứ hai. | **[TRUNG BÌNH]** |

### 2.3 Quản lý phiên đăng nhập & Thiết bị

| Mã YC | Tên chức năng | Mô tả chi tiết | Ưu tiên |
|---|---|---|---|
| AUTH-13 | Theo dõi thiết bị | Ghi nhận thiết bị đăng nhập: loại thiết bị, trình duyệt, địa chỉ IP, thời gian, vị trí địa lý. | **[CAO]** |
| AUTH-14 | Xem danh sách thiết bị đang đăng nhập | Người dùng xem các phiên đang hoạt động, phân biệt thiết bị hiện tại và thiết bị khác. | **[CAO]** |
| AUTH-15 | Thu hồi phiên trên thiết bị cụ thể | Người dùng chủ động đăng xuất khỏi một thiết bị bất kỳ trong danh sách. | **[CAO]** |

### 2.4 Hồ sơ người dùng

| Mã YC | Tên chức năng | Mô tả chi tiết | Ưu tiên |
|---|---|---|---|
| AUTH-16 | Xem & cập nhật hồ sơ | Người dùng xem và chỉnh sửa thông tin cá nhân: họ tên, số điện thoại, ngày sinh, quốc tịch. | **[CAO]** |
| AUTH-17 | Tải lên ảnh đại diện | Upload ảnh đại diện (JPEG/PNG, tối đa 5MB). Hệ thống resize và lưu trữ trên server. | **[CAO]** |
| AUTH-18 | Xem tổng quan học tập trên hồ sơ | Hiển thị: cấp độ hiện tại, điểm XP, huy hiệu đạt được, khoá học đang học. | **[CAO]** |

### 2.5 Phân quyền (RBAC)

| Mã YC | Tên chức năng | Mô tả chi tiết | Ưu tiên |
|---|---|---|---|
| AUTH-19 | Hệ thống vai trò | 3 vai trò chính: **SuperAdmin** (quản trị hệ thống), **Admin** (quản trị tenant), **ContentManager** (quản lý nội dung), **Student** (học viên). | **[CAO]** |
| AUTH-20 | Phân quyền theo vai trò | Admin: tạo khoá học, upload video/tài liệu, duyệt nội dung. ContentManager: tạo & upload nhưng cần Admin duyệt trước khi publish. Student: học và làm bài. | **[CAO]** |
| AUTH-21 | Quản lý vai trò (Admin) | Admin có thể gán/thu hồi vai trò cho người dùng trong tenant của mình. | **[CAO]** |

---

## III. MODULE 2 — QUẢN LÝ NỘI DUNG (CUSTOM CMS)

### 3.1 Quản lý khoá học

| Mã YC | Tên chức năng | Mô tả chi tiết | Ưu tiên |
|---|---|---|---|
| CMS-01 | Tạo khoá học mới | Admin/ContentManager tạo khoá học: tên, mô tả, cấp độ (Level 1-6), ảnh thumbnail, giáo viên phụ trách, giá, trạng thái. | **[CAO]** |
| CMS-02 | Chỉnh sửa khoá học | Cập nhật toàn bộ thông tin khoá học bất kỳ lúc nào. | **[CAO]** |
| CMS-03 | Publish / Unpublish khoá học | Quy trình duyệt: ContentManager submit → Admin review → Approve → Published. Admin có thể publish trực tiếp. | **[CAO]** |
| CMS-04 | Publish / Unpublish hàng loạt | Admin chọn nhiều khoá học và publish/unpublish cùng lúc. | **[TRUNG BÌNH]** |
| CMS-05 | Cài đặt học thử miễn phí | Admin đánh dấu các bài học cụ thể là "Học thử miễn phí" — hiển thị cho người chưa mua. | **[CAO]** |
| CMS-06 | Xoá khoá học | Xoá khoá học (soft delete). Kiểm tra điều kiện: không có học viên đang học. | **[CAO]** |

### 3.2 Quản lý module & bài học

| Mã YC | Tên chức năng | Mô tả chi tiết | Ưu tiên |
|---|---|---|---|
| CMS-07 | Tạo module trong khoá học | Nhóm các bài học thành module (chương). Mỗi khoá học có nhiều module, mỗi module có nhiều bài học. | **[CAO]** |
| CMS-08 | Sắp xếp thứ tự module | Kéo thả để sắp xếp lại thứ tự module trong khoá học. | **[TRUNG BÌNH]** |
| CMS-09 | Tạo bài học | Admin tạo bài học: tên, mô tả, loại (Video / Tài liệu / Quiz / Speaking / Writing), thứ tự, có học thử không. | **[CAO]** |
| CMS-10 | Sắp xếp thứ tự bài học | Kéo thả để sắp xếp lại thứ tự bài học trong module. | **[TRUNG BÌNH]** |
| CMS-11 | Upload tài liệu PDF | Admin upload tài liệu PDF đính kèm bài học. Hỗ trợ nhiều file/bài. | **[CAO]** |
| CMS-12 | Upload file audio | Admin upload file audio đính kèm bài học (bài nghe). | **[CAO]** |
| CMS-13 | Upload phụ đề SRT | Admin upload file phụ đề SRT. Hệ thống tự động chuyển đổi sang WebVTT. Hiển thị trên video player. | **[TRUNG BÌNH]** |
| CMS-14 | Hàng đợi duyệt nội dung | Admin xem danh sách nội dung chờ duyệt, review và approve/reject từng item. | **[TRUNG BÌNH]** |

---

## IV. MODULE 3 — VIDEO LEARNING

### 4.1 Upload & Xử lý video

| Mã YC | Tên chức năng | Mô tả chi tiết | Ưu tiên |
|---|---|---|---|
| VID-01 | Upload video thô | Admin upload video gốc (MP4, MOV, AVI). File lưu vào thư mục `raw/` của bài học. | **[CAO]** |
| VID-02 | Tự động transcode HLS | Sau khi upload, hệ thống tự động (Hangfire job) gọi FFmpeg để transcode sang 3 bitrate: 360p, 720p, 1080p — định dạng HLS (.m3u8 + .ts segments). | **[CAO]** |
| VID-03 | Master playlist HLS | Sinh file `master.m3u8` chứa 3 quality streams để player tự động chọn chất lượng phù hợp. | **[CAO]** |
| VID-04 | Theo dõi trạng thái transcode | Hệ thống cập nhật trạng thái video: PENDING → PROCESSING → READY / FAILED. Admin thấy trạng thái realtime. | **[CAO]** |
| VID-05 | Thumbnail tự động | FFmpeg tự động trích xuất thumbnail tại giây thứ 5 của video. | **[TRUNG BÌNH]** |

### 4.2 Phát video bảo mật

| Mã YC | Tên chức năng | Mô tả chi tiết | Ưu tiên |
|---|---|---|---|
| VID-06 | Kiểm tra quyền truy cập video | Trước khi phát video, API kiểm tra học viên đã đăng ký khoá học hoặc bài học là "học thử miễn phí". | **[CAO]** |
| VID-07 | Signed Token cho HLS stream | Cấp JWT token có TTL 2 giờ, gắn với `user_id` + `lesson_id`. Mọi request HLS segment đều phải kèm token hợp lệ. | **[CAO]** |
| VID-08 | Không truy cập trực tiếp URL | File video không có URL công khai. Mọi truy cập phải qua API gateway có xác thực. | **[CAO]** |
| VID-09 | Vô hiệu hóa tải xuống | HLS segmented (không có file hoàn chỉnh để tải). Frontend tắt tất cả điều khiển native của trình duyệt. | **[CAO]** |

### 4.3 Video Player (Frontend)

| Mã YC | Tên chức năng | Mô tả chi tiết | Ưu tiên |
|---|---|---|---|
| VID-10 | Custom HLS Player | Player tự xây dựng bằng HLS.js — không dùng player của bên thứ ba. Giao diện dark theme, responsive. | **[CAO]** |
| VID-11 | Play / Pause | Nút play/pause. Phím tắt: Spacebar. | **[CAO]** |
| VID-12 | Seek bar (kéo thả) | Kéo thả để tua đến vị trí bất kỳ trong video. Hiển thị vùng buffer. | **[CAO]** |
| VID-13 | Tua nhanh / Tua chậm ±10s | Nút tua lùi 10 giây và tiến 10 giây. Phím tắt: ← (5s) và → (5s). | **[CAO]** |
| VID-14 | Điều chỉnh âm lượng | Slider âm lượng, 3 trạng thái icon (tắt tiếng, nhỏ, lớn). Phím tắt: M (mute), ↑ ↓. | **[CAO]** |
| VID-15 | Điều chỉnh tốc độ phát | Hỗ trợ tốc độ: 0.5×, 0.75×, 1× (Bình thường), 1.25×, 1.5×, 1.75×, 2×. | **[CAO]** |
| VID-16 | Chọn chất lượng video | Người dùng chọn thủ công: Tự động / 360p / 720p / 1080p. | **[CAO]** |
| VID-17 | Toàn màn hình | Nút phóng to toàn màn hình. Phím tắt: F. | **[CAO]** |
| VID-18 | Picture-in-Picture (PiP) | Phát video ở cửa sổ nổi phía trên các ứng dụng khác. Phím tắt: P. | **[TRUNG BÌNH]** |
| VID-19 | Phụ đề (CC) | Hiển thị/ẩn phụ đề tiếng Việt hoặc tiếng Anh (nếu có file .vtt). | **[TRUNG BÌNH]** |
| VID-20 | Tự động ẩn thanh điều khiển | Thanh điều khiển tự ẩn sau 3 giây khi video đang phát. Hiện lại khi di chuột. | **[CAO]** |
| VID-21 | Ngăn chặn chuột phải | Tắt context menu (click chuột phải) trên video. | **[CAO]** |

### 4.4 Tính năng học tập trong video

| Mã YC | Tên chức năng | Mô tả chi tiết | Ưu tiên |
|---|---|---|---|
| VID-22 | Lưu vị trí xem (Resume) | Hệ thống tự lưu vị trí xem (mỗi 10 giây gọi API). Lần sau mở lại, hiện banner "Tiếp tục từ mm:ss" — tự tắt sau 8 giây. | **[CAO]** |
| VID-23 | Đánh dấu bookmark | Người dùng đánh dấu vị trí quan trọng trong video (hiển thị dấu vàng trên seek bar). Phím tắt: B. | **[CAO]** |
| VID-24 | Ghi chú theo timestamp | Người dùng ghi chú tại vị trí đang xem (video tự pause). Danh sách ghi chú có thể click để seek đến vị trí đó. Phím tắt: N. | **[CAO]** |
| VID-25 | Phím tắt seek theo % | Phím 1–9 seek đến 10%–90% của video. Phím 0 quay về đầu. | **[TRUNG BÌNH]** |
| VID-26 | Theo dõi tiến độ xem | API ghi nhận % video đã xem. Bài học được đánh dấu "Hoàn thành" khi xem đủ 80%. | **[CAO]** |

### 4.5 Bảo vệ tài liệu PDF

| Mã YC | Tên chức năng | Mô tả chi tiết | Ưu tiên |
|---|---|---|---|
| VID-27 | Stream PDF inline | PDF được stream trực tiếp trong trình duyệt, không cho phép tải xuống. | **[CAO]** |
| VID-28 | Watermark động trên PDF | Tự động thêm watermark: "Tài liệu của [Họ tên] — [UserID] — [Ngày]" vào mỗi trang PDF. | **[CAO]** |
| VID-29 | Bảo mật header PDF | Response header: `Content-Disposition: inline`, `Cache-Control: no-store`. | **[CAO]** |

---

## V. MODULE 4 — BÀI KIỂM TRA ĐẦU VÀO (PLACEMENT TEST)

| Mã YC | Tên chức năng | Mô tả chi tiết | Ưu tiên |
|---|---|---|---|
| PLT-01 | Quy trình 4 phần | Bài kiểm tra 4 phần theo thứ tự: (1) Nghe hiểu – MCQ, (2) Đọc hiểu – MCQ, (3) Nói – ghi âm, (4) Viết – nhập văn bản. | **[CAO]** |
| PLT-02 | Ghi âm bài nói | Sử dụng MediaRecorder API để ghi âm câu trả lời của học viên. Thời gian chuẩn bị 30 giây, thời gian ghi âm theo đề. | **[CAO]** |
| PLT-03 | Upload và chấm điểm AI | File ghi âm được upload và gửi tới AI Service để chấm điểm bằng GPT-4o Audio. | **[CAO]** |
| PLT-04 | Chấm điểm bài viết AI | Nội dung bài viết được gửi tới AI Service để chấm bằng GPT-4o mini. | **[CAO]** |
| PLT-05 | Màn hình chờ chấm điểm | Hiển thị animation "Đang phân tích..." trong khi AI xử lý. Polling API để cập nhật kết quả. | **[CAO]** |
| PLT-06 | Kết quả & gợi ý cấp độ | Hiển thị điểm 4 kỹ năng (Radar chart), tổng điểm và gợi ý: "Level 3 — Sơ trung cấp". | **[CAO]** |
| PLT-07 | Điều hướng sau kiểm tra | Nút "Xem lộ trình học" → chuyển đến danh sách khoá học phù hợp với Level được gợi ý. | **[CAO]** |
| PLT-08 | Lưu kết quả placement | Kết quả lưu vào hồ sơ học viên, dùng làm baseline cho Radar chart kỹ năng. | **[CAO]** |

---

## VI. MODULE 5 — QUIZ ENGINE

### 6.1 Ngân hàng câu hỏi

| Mã YC | Tên chức năng | Mô tả chi tiết | Ưu tiên |
|---|---|---|---|
| QUZ-01 | Tạo câu hỏi MCQ | Tạo câu hỏi trắc nghiệm 4 đáp án, đánh dấu đáp án đúng, thêm giải thích. | **[CAO]** |
| QUZ-02 | Tạo câu hỏi điền từ | Câu hỏi dạng điền vào chỗ trống. | **[CAO]** |
| QUZ-03 | Tạo câu hỏi nói | Câu hỏi yêu cầu học viên ghi âm câu trả lời (chấm điểm bằng AI). | **[CAO]** |
| QUZ-04 | Tạo câu hỏi viết | Câu hỏi yêu cầu học viên nhập văn bản (chấm điểm bằng AI). | **[CAO]** |
| QUZ-05 | Phân loại câu hỏi | Câu hỏi được phân loại theo: kỹ năng (Nghe/Nói/Đọc/Viết), cấp độ, chủ đề. | **[TRUNG BÌNH]** |

### 6.2 Bài kiểm tra

| Mã YC | Tên chức năng | Mô tả chi tiết | Ưu tiên |
|---|---|---|---|
| QUZ-06 | Tạo bài kiểm tra | Admin tạo bài kiểm tra bằng cách chọn câu hỏi từ ngân hàng. Cài đặt: thời gian, số lần làm tối đa, điểm qua/rớt. | **[CAO]** |
| QUZ-07 | Bắt đầu làm bài | Học viên bắt đầu lượt làm bài (attempt). Hệ thống tạo bản ghi attempt, ghi nhận thời gian bắt đầu. | **[CAO]** |
| QUZ-08 | Trả lời & Nộp bài | Học viên trả lời từng câu, hệ thống lưu tạm. Học viên nộp bài → hệ thống chấm điểm MCQ/điền từ tự động, gửi AI chấm câu nói/viết. | **[CAO]** |
| QUZ-09 | Đếm giờ (Timer) | Hiển thị đồng hồ đếm ngược nếu quiz có giới hạn thời gian. Tự động nộp khi hết giờ. | **[CAO]** |
| QUZ-10 | Màn hình kết quả | Hiển thị: tổng điểm, điểm từng kỹ năng (Radar chart), kết quả từng câu (đúng/sai + giải thích), animation chúc mừng nếu đạt. | **[CAO]** |
| QUZ-11 | Lịch sử làm bài | Học viên xem lại các lần đã làm, điểm số, thời gian. | **[TRUNG BÌNH]** |
| QUZ-12 | Giới hạn số lần làm | Hệ thống kiểm soát số lần làm bài tối đa theo cấu hình của từng quiz. | **[CAO]** |

---

## VII. MODULE 6 — THƯƠNG MẠI & THANH TOÁN

### 7.1 Danh mục sản phẩm

| Mã YC | Tên chức năng | Mô tả chi tiết | Ưu tiên |
|---|---|---|---|
| COM-01 | Bán theo Level đơn lẻ | Học viên mua riêng từng Level (1–6). | **[CAO]** |
| COM-02 | Bán combo nhiều Level | Gói combo (ví dụ: 3 Level hoặc 6 Level) với giá ưu đãi hơn mua lẻ. | **[CAO]** |
| COM-03 | Thiết lập giá và ưu đãi | Admin cài đặt giá gốc, giá khuyến mãi, phần trăm tiết kiệm, thời gian ưu đãi. | **[CAO]** |
| COM-04 | Mã giảm giá (Coupon) | Admin tạo mã coupon: % hoặc số tiền, giới hạn số lần dùng, ngày hết hạn. Học viên nhập mã tại checkout. | **[CAO]** |

### 7.2 Thanh toán

| Mã YC | Tên chức năng | Mô tả chi tiết | Ưu tiên |
|---|---|---|---|
| COM-05 | Thanh toán VNPay QR | Tích hợp VNPay — quét QR ngân hàng. | **[CAO]** |
| COM-06 | Thanh toán MoMo | Tích hợp ví điện tử MoMo. | **[CAO]** |
| COM-07 | Thanh toán Stripe | Tích hợp Stripe cho thẻ quốc tế (Visa/Mastercard). | **[TRUNG BÌNH]** |
| COM-08 | Xác nhận chuyển khoản thủ công | Admin xác nhận đơn hàng thanh toán qua chuyển khoản ngân hàng. | **[CAO]** |
| COM-09 | Webhook xác nhận thanh toán | Nhận webhook từ cổng thanh toán, tự động kích hoạt quyền truy cập khoá học sau khi thanh toán thành công. | **[CAO]** |
| COM-10 | Xuất hoá đơn PDF | Hệ thống tự động tạo hoá đơn PDF sau mỗi giao dịch thành công. | **[TRUNG BÌNH]** |
| COM-11 | Lịch sử đơn hàng | Học viên xem lịch sử mua hàng: đơn hàng, trạng thái, ngày, số tiền. | **[CAO]** |

### 7.3 Giao diện mua hàng

| Mã YC | Tên chức năng | Mô tả chi tiết | Ưu tiên |
|---|---|---|---|
| COM-12 | Trang định giá 3 cột | Hiển thị 3 gói: Level đơn lẻ / Combo 3 Level (POPULAR) / Combo 6 Level (BEST VALUE). | **[CAO]** |
| COM-13 | Banner upsell sticky | Thanh sticky ở cuối trang khi học viên chưa đăng ký, nhắc nhở mở khoá nội dung. | **[TRUNG BÌNH]** |
| COM-14 | Overlay khoá nội dung | Bài học chưa mua hiển thị overlay có nút "Xem gói học" và "Học thử miễn phí". | **[CAO]** |

---

## VIII. MODULE 7 — CHỨNG CHỈ

| Mã YC | Tên chức năng | Mô tả chi tiết | Ưu tiên |
|---|---|---|---|
| CRT-01 | Cấp chứng chỉ hoàn thành | Sau khi học viên hoàn thành 100% khoá học, hệ thống tự động cấp chứng chỉ. | **[CAO]** |
| CRT-02 | Chứng chỉ PDF cá nhân hoá | Chứng chỉ PDF chứa: tên học viên, tên khoá học, ngày hoàn thành, mã xác thực duy nhất. | **[CAO]** |
| CRT-03 | Tải xuống chứng chỉ | Học viên tải file PDF chứng chỉ từ trang hồ sơ. | **[CAO]** |
| CRT-04 | Xác thực chứng chỉ trực tuyến | Nhà tuyển dụng/tổ chức nhập mã chứng chỉ để xác minh tính hợp lệ qua website. | **[TRUNG BÌNH]** |

---

## IX. MODULE 8 — PHÂN TÍCH HỌC TẬP (ANALYTICS)

### 9.1 Analytics học viên

| Mã YC | Tên chức năng | Mô tả chi tiết | Ưu tiên |
|---|---|---|---|
| ANL-01 | Biểu đồ kỹ năng (Radar Chart) | Hiển thị điểm 4 kỹ năng (Nghe/Nói/Đọc/Viết) theo thang 0–100. So sánh với thời điểm bắt đầu. | **[CAO]** |
| ANL-02 | Lịch học (Streak Calendar) | Lưới lịch hiển thị ngày đã học (xanh) và ngày bỏ lỡ (xám) trong 4 tuần gần nhất. | **[CAO]** |
| ANL-03 | Chuỗi ngày học liên tiếp (Streak) | Đếm và hiển thị số ngày học liên tiếp. Cập nhật mỗi ngày. Chuỗi dài nhất được ghi nhận. | **[CAO]** |
| ANL-04 | Tổng thời gian học | Tổng số giờ/phút học tích lũy. Thống kê theo tháng. | **[CAO]** |
| ANL-05 | Tiến độ khoá học | % hoàn thành từng khoá học, số bài đã xem / tổng số bài. | **[CAO]** |
| ANL-06 | Thời gian học theo ngày | Biểu đồ/progress bar hiển thị thời gian học hôm nay so với mục tiêu hàng ngày. | **[TRUNG BÌNH]** |

### 9.2 Analytics Admin

| Mã YC | Tên chức năng | Mô tả chi tiết | Ưu tiên |
|---|---|---|---|
| ANL-07 | Dashboard doanh thu | Tổng doanh thu, doanh thu theo kỳ (ngày/tuần/tháng), biểu đồ đường/cột. | **[TRUNG BÌNH]** |
| ANL-08 | Báo cáo học viên | Số học viên mới, học viên active, tỷ lệ hoàn thành khoá học theo thời gian. | **[TRUNG BÌNH]** |
| ANL-09 | Analytics theo khoá học | Xếp hạng khoá học theo lượt đăng ký, tỷ lệ hoàn thành, đánh giá trung bình. | **[TRUNG BÌNH]** |

---

## X. MODULE 9 — GAMIFICATION (TRÒ CHƠI HÓA)

| Mã YC | Tên chức năng | Mô tả chi tiết | Ưu tiên |
|---|---|---|---|
| GAM-01 | Hệ thống điểm XP | Học viên tích lũy điểm XP khi: hoàn thành bài học, nộp quiz, giữ streak, nhận badge. | **[TRUNG BÌNH]** |
| GAM-02 | Huy hiệu thành tích (Badges) | Huy hiệu tự động cấp khi đạt điều kiện: hoàn thành Level, duy trì streak, đạt điểm quiz cao. Huy hiệu chưa đạt hiển thị grayscale + điều kiện mở. | **[TRUNG BÌNH]** |
| GAM-03 | Bảng xếp hạng tuần | Xếp hạng học viên theo điểm XP trong tuần hiện tại. Hiển thị top 10 + thứ hạng cá nhân. | **[TRUNG BÌNH]** |
| GAM-04 | Hiển thị điểm & hạng | Dashboard học viên hiển thị: tổng điểm XP, hạng hiện tại trong tuần. | **[TRUNG BÌNH]** |
| GAM-05 | Quản lý huy hiệu (Admin) | Admin tạo, sửa, xoá huy hiệu. Cấu hình điều kiện cấp tự động. | **[TRUNG BÌNH]** |

---

## XI. MODULE 10 — AI RECOMMENDATION & EVALUATION

| Mã YC | Tên chức năng | Mô tả chi tiết | Ưu tiên |
|---|---|---|---|
| AI-01 | Chấm điểm bài nói (GPT-4o Audio) | AI Service (Python FastAPI) nhận file audio, gọi GPT-4o Audio để đánh giá: phát âm, ngữ điệu, ngữ pháp. Trả về điểm 0–100 và nhận xét. | **[CAO]** |
| AI-02 | Chấm điểm bài viết (GPT-4o mini) | AI Service nhận văn bản, gọi GPT-4o mini để đánh giá: ngữ pháp, từ vựng, cấu trúc câu. Trả về điểm và nhận xét. | **[CAO]** |
| AI-03 | Rate limiting AI | Giới hạn số request AI/giây để kiểm soát chi phí. Logging chi phí mỗi request. | **[CAO]** |
| AI-04 | Gợi ý bài học tiếp theo | Dựa trên tiến độ và điểm số, hệ thống gợi ý bài học phù hợp theo quy tắc định sẵn (rule-based). | **[TRUNG BÌNH]** |

---

## XII. MODULE 11 — HỖ TRỢ & GIAO TIẾP

### 12.1 Hỏi đáp trong bài học

| Mã YC | Tên chức năng | Mô tả chi tiết | Ưu tiên |
|---|---|---|---|
| COM-Q-01 | Đặt câu hỏi trong bài học | Học viên đặt câu hỏi trong tab "Hỏi đáp" của bài học. Câu hỏi gắn với bài học cụ thể. | **[TRUNG BÌNH]** |
| COM-Q-02 | Trả lời & phản hồi | Admin/ContentManager trả lời câu hỏi. Học viên nhận thông báo khi có phản hồi. | **[TRUNG BÌNH]** |
| COM-Q-03 | Like câu hỏi/trả lời | Học viên like câu hỏi/câu trả lời hữu ích. Sắp xếp theo lượt like. | **[THẤP]** |

### 12.2 Thông báo

| Mã YC | Tên chức năng | Mô tả chi tiết | Ưu tiên |
|---|---|---|---|
| COM-N-01 | Thông báo trong ứng dụng | Chuông thông báo trên header, hiển thị số thông báo chưa đọc (badge đỏ). Dropdown danh sách thông báo. | **[TRUNG BÌNH]** |
| COM-N-02 | Thông báo email | Gửi email tự động: chào mừng, nhắc nhở streak, hoàn thành khoá học, chứng chỉ. | **[TRUNG BÌNH]** |
| COM-N-03 | Push notification (Mobile) | Thông báo đẩy qua FCM cho ứng dụng mobile: nhắc học hàng ngày, streak sắp mất. | **[THẤP]** |
| COM-N-04 | Thông báo broadcast (Admin) | Admin gửi thông báo hàng loạt đến tất cả hoặc nhóm học viên. | **[TRUNG BÌNH]** |

---

## XIII. MODULE 12 — ADMIN PANEL

### 13.1 Tổng quan quản trị

| Mã YC | Tên chức năng | Mô tả chi tiết | Ưu tiên |
|---|---|---|---|
| ADM-01 | Dashboard Admin | Tổng quan: số học viên, doanh thu, khoá học, hoạt động gần đây. | **[CAO]** |
| ADM-02 | Quản lý người dùng | Xem danh sách học viên, tìm kiếm, lọc theo vai trò/trạng thái, xem hồ sơ chi tiết, khoá/mở khoá tài khoản. | **[CAO]** |
| ADM-03 | Quản lý vai trò | Xem danh sách vai trò, gán/thu hồi vai trò cho người dùng. | **[CAO]** |
| ADM-04 | Cài đặt tenant | Admin cấu hình: logo, màu sắc thương hiệu, tên hiển thị, domain, thông tin liên hệ. | **[CAO]** |

### 13.2 Quản lý nội dung (Admin)

| Mã YC | Tên chức năng | Mô tả chi tiết | Ưu tiên |
|---|---|---|---|
| ADM-05 | Danh sách khoá học | Bảng khoá học với cột: tên, Level, trạng thái, số học viên, doanh thu. Tìm kiếm + lọc. | **[CAO]** |
| ADM-06 | Chỉnh sửa khoá học & Module | Giao diện tạo/sửa khoá học, thêm/sửa module và bài học. | **[CAO]** |
| ADM-07 | Upload & quản lý nội dung bài học | Upload video, tài liệu PDF, file audio cho từng bài học. Theo dõi trạng thái transcode. | **[CAO]** |
| ADM-08 | Hàng đợi duyệt nội dung | Xem và phê duyệt/từ chối nội dung từ ContentManager. | **[TRUNG BÌNH]** |

### 13.3 Quản lý thương mại (Admin)

| Mã YC | Tên chức năng | Mô tả chi tiết | Ưu tiên |
|---|---|---|---|
| ADM-09 | Danh sách đơn hàng | Xem tất cả đơn hàng, trạng thái thanh toán, tìm kiếm theo học viên/ngày/trạng thái. | **[CAO]** |
| ADM-10 | Xác nhận thanh toán thủ công | Admin xác nhận đơn hàng chuyển khoản ngân hàng, kích hoạt quyền học. | **[CAO]** |
| ADM-11 | Quản lý mã giảm giá | Tạo, sửa, xoá, bật/tắt mã coupon. Xem thống kê số lần sử dụng. | **[CAO]** |

---

## XIV. MODULE 13 — HẠ TẦNG & BẢO MẬT

### 14.1 Multi-tenant

| Mã YC | Tên chức năng | Mô tả chi tiết | Ưu tiên |
|---|---|---|---|
| INF-01 | Phân tách dữ liệu theo tenant | Mỗi trung tâm đào tạo có schema PostgreSQL riêng biệt (tenant isolation). Dữ liệu không chia sẻ giữa các tenant. | **[CAO]** |
| INF-02 | Middleware nhận diện tenant | Hệ thống tự động xác định tenant từ subdomain hoặc header `X-Tenant-Slug`. | **[CAO]** |
| INF-03 | Quản lý tenant (SuperAdmin) | SuperAdmin tạo, sửa, bật/tắt tenant. Khởi tạo schema tự động cho tenant mới. | **[CAO]** |

### 14.2 Bảo mật

| Mã YC | Tên chức năng | Mô tả chi tiết | Ưu tiên |
|---|---|---|---|
| SEC-01 | JWT Authentication | Access Token TTL 15 phút, Refresh Token TTL 30 ngày với cơ chế rotation (mỗi lần dùng cấp token mới). | **[CAO]** |
| SEC-02 | Rate limiting API | Giới hạn request per IP và per user để chống tấn công brute-force và DDoS nhỏ. | **[CAO]** |
| SEC-03 | Validate đầu vào | Toàn bộ input người dùng được validate bằng FluentValidation. Dùng parameterized queries (EF Core) chống SQL injection. | **[CAO]** |
| SEC-04 | Security headers | Cấu hình HSTS, X-Frame-Options, Content-Security-Policy cho toàn bộ API response. | **[CAO]** |
| SEC-05 | HTTPS bắt buộc | Toàn bộ giao tiếp client-server qua HTTPS. | **[CAO]** |

### 14.3 Hạ tầng

| Mã YC | Tên chức năng | Mô tả chi tiết | Ưu tiên |
|---|---|---|---|
| INF-04 | Background Jobs (Hangfire) | Xử lý tác vụ nền: transcode video, gửi email, tính điểm analytics. Có giao diện theo dõi job. | **[CAO]** |
| INF-05 | Cache (Redis) | Cache phiên xác thực, kết quả truy vấn thường xuyên để tăng hiệu năng. | **[CAO]** |
| INF-06 | Message Queue (RabbitMQ) | Hàng đợi xử lý sự kiện: gửi bài AI chấm điểm, cập nhật analytics, thông báo. | **[CAO]** |
| INF-07 | Health check endpoint | `GET /health` trả về trạng thái hệ thống (DB, Redis, RabbitMQ). | **[CAO]** |
| INF-08 | Logging tập trung (Serilog) | Ghi log có cấu trúc toàn bộ request/error. | **[CAO]** |
| INF-09 | Docker Compose | Toàn bộ dịch vụ (API, Frontend, PostgreSQL, Redis, RabbitMQ) chạy được bằng `docker-compose up`. | **[CAO]** |

---

## XV. GIAO DIỆN NGƯỜI DÙNG (FRONTEND)

### 15.1 Màn hình xác thực

| Mã YC | Tên chức năng | Mô tả chi tiết | Ưu tiên |
|---|---|---|---|
| UI-01 | Trang đăng ký | Giao diện split-screen: bên trái thông tin giới thiệu, bên phải form đăng ký (họ tên, email, mật khẩu, nút Google). | **[CAO]** |
| UI-02 | Trang đăng nhập | Giao diện split-screen: bên trái thông tin, bên phải form đăng nhập (email, mật khẩu, nút Google). | **[CAO]** |
| UI-03 | Trang quên mật khẩu | Form nhập email, gửi link đặt lại mật khẩu. | **[CAO]** |
| UI-04 | Trang đặt lại mật khẩu | Form nhập mật khẩu mới (2 lần) sau khi click link email. | **[CAO]** |
| UI-05 | Trang xác minh email | 6 ô nhập OTP riêng biệt, auto-focus, hỗ trợ dán (paste) mã. | **[CAO]** |

### 15.2 Màn hình chính

| Mã YC | Tên chức năng | Mô tả chi tiết | Ưu tiên |
|---|---|---|---|
| UI-06 | Trang chủ | Hero Banner Carousel (auto-play 4s), Section khoá học nổi bật (tab theo Level), Section tiếp tục học (khi đã login), Section giáo viên. | **[CAO]** |
| UI-07 | Danh sách khoá học `/khoa-hoc` | Hero banner, bộ lọc sticky (Level, tìm kiếm, sắp xếp), lưới khoá học 3 cột, phân trang. | **[CAO]** |
| UI-08 | Chi tiết khoá học `/khoa-hoc/[id]` | Hero dark background, sticky enrollment card (giá, mã giảm giá, nút đăng ký), 3 tab: Giới thiệu / Nội dung / Đánh giá. | **[CAO]** |
| UI-09 | Trang học bài `/hoc/[lessonId]` | Full-viewport dark theme. Video player bên trái, sidebar course outline bên phải (collapsible). Header rút gọn với điều hướng bài trước/tiếp. | **[CAO]** |
| UI-10 | Dashboard học viên `/dashboard` | Banner chào + streak, tiến độ khoá học, biểu đồ kỹ năng (Radar), lịch học, bảng gamification. | **[CAO]** |
| UI-11 | Hồ sơ cá nhân `/profile` | Header với ảnh bìa gradient, avatar, tên, level. 4 tab: Thông tin / Khoá học / Huy hiệu / Cài đặt. | **[CAO]** |
| UI-12 | Quản lý phiên đăng nhập `/settings/sessions` | Danh sách thiết bị đang đăng nhập với icon thiết bị, IP, thời gian, nút thu hồi từng phiên. | **[CAO]** |
| UI-13 | Trang placement test `/placement-test` | Giao diện từng bước (Intro → Nghe → Đọc → Nói → Viết → Kết quả), progress bar phần. | **[CAO]** |
| UI-14 | Kết quả quiz `/quiz/[attemptId]/result` | Tổng điểm, điểm 4 kỹ năng, Radar chart, accordion chi tiết từng câu, nút hành động (làm lại / bài tiếp). | **[CAO]** |
| UI-15 | Trang mua hàng `/mua-hang` | 3 cột gói học (đơn lẻ / Combo / Full), nhập coupon, chọn phương thức thanh toán, nút thanh toán. | **[CAO]** |

### 15.3 Header & Navigation

| Mã YC | Tên chức năng | Mô tả chi tiết | Ưu tiên |
|---|---|---|---|
| UI-16 | Header sticky màu thương hiệu | Header cố định top 56px, nền Brand Blue #1565C0. Logo, nav links, thanh tìm kiếm, chuông thông báo, avatar dropdown. | **[CAO]** |
| UI-17 | Sidebar trái (Desktop, sau đăng nhập) | Sidebar thu gọn 72px chỉ icon, hover hiện tooltip. Liên kết: Bài học mới, Khoá đã kích hoạt, Đã lưu, Đã thích, Bạn bè. | **[TRUNG BÌNH]** |
| UI-18 | Tìm kiếm toàn cục | Input tìm kiếm trên header, focus đổi màu nền từ trắng mờ sang trắng rõ. Kết quả gợi ý dropdown. | **[TRUNG BÌNH]** |

### 15.4 Thiết kế hệ thống (Design System)

| Mã YC | Tên chức năng | Mô tả chi tiết | Ưu tiên |
|---|---|---|---|
| UI-19 | Responsive Design | Giao diện hiển thị tốt trên: Mobile (≥320px), Tablet (≥768px), Desktop (≥1024px). | **[CAO]** |
| UI-20 | Màu thương hiệu nhất quán | Sử dụng bảng màu V3 thống nhất: Brand Blue #1565C0, Accent Orange #FF6B35, Yellow #FFD600, Green #2E7D32. | **[CAO]** |
| UI-21 | Font Be Vietnam Pro | Font chữ chính: Be Vietnam Pro, hỗ trợ đầy đủ dấu tiếng Việt. | **[CAO]** |
| UI-22 | Course Card component | Card khoá học: thumbnail 16:9, badge Level, tên, giáo viên, rating, progress bar (nếu đã enroll), giá. | **[CAO]** |
| UI-23 | Cấp độ màu badge | Badge Level 1–6 màu sắc phân biệt: xám / xanh lá / xanh dương / tím / cam / đỏ. | **[CAO]** |

---

## XVI. ỨNG DỤNG DI ĐỘNG (MOBILE APP)

| Mã YC | Tên chức năng | Mô tả chi tiết | Ưu tiên |
|---|---|---|---|
| MOB-01 | Giai đoạn 1 Mobile | Đăng nhập/Đăng ký, Danh sách khoá học, Video HLS player, Theo dõi tiến độ, Placement Test. | **[TRUNG BÌNH]** |
| MOB-02 | Giai đoạn 2 Mobile | Thanh toán, Push notifications, Gamification (điểm XP, huy hiệu). | **[THẤP]** |

---

## XVII. NGOÀI PHẠM VI HỢP ĐỒNG

Các tính năng sau **không thuộc phạm vi** hợp đồng này:

| STT | Tính năng | Lý do |
|---|---|---|
| 1 | Tích hợp Moodle | Đã loại bỏ hoàn toàn — dùng Custom CMS |
| 2 | AI recommendation dựa trên ML | Cần data lớn — Phase sau MVP |
| 3 | Adaptive Testing (IRT) | Phức tạp, cần data lớn |
| 4 | Video offline (mobile) | DRM phức tạp |
| 5 | Livestream tự xây dựng | Nhúng Zoom/YouTube |
| 6 | MinIO / S3 migration | Local disk cho MVP |
| 7 | Bán sản phẩm vật lý | Ngoài phạm vi vĩnh viễn |
| 8 | Automation marketing phức tạp | Email cơ bản đủ MVP |
| 9 | Đa ngôn ngữ UI | Vietnamese-first, bổ sung sau |
| 10 | Dark mode toàn bộ site | Chỉ dark cho video player |
| 11 | Đăng nhập Facebook / Apple | Chỉ Google + Email |

---

## XVIII. TỔNG HỢP SỐ LƯỢNG YÊU CẦU

| Module | Tổng YC | Ưu tiên CAO | Ưu tiên TRUNG BÌNH | Ưu tiên THẤP |
|---|---|---|---|---|
| Auth & User Management | 21 | 16 | 4 | 1 |
| Custom CMS | 14 | 9 | 5 | 0 |
| Video Learning | 29 | 23 | 6 | 0 |
| Placement Test | 8 | 8 | 0 | 0 |
| Quiz Engine | 12 | 9 | 3 | 0 |
| Thương mại & Thanh toán | 14 | 10 | 3 | 1 |
| Chứng chỉ | 4 | 3 | 1 | 0 |
| Analytics | 9 | 5 | 4 | 0 |
| Gamification | 5 | 0 | 5 | 0 |
| AI Evaluation | 4 | 3 | 1 | 0 |
| Hỗ trợ & Giao tiếp | 7 | 0 | 5 | 2 |
| Admin Panel | 11 | 8 | 3 | 0 |
| Hạ tầng & Bảo mật | 9 | 9 | 0 | 0 |
| Giao diện Frontend | 23 | 17 | 6 | 0 |
| Mobile App | 2 | 0 | 1 | 1 |
| **TỔNG CỘNG** | **172** | **120** | **47** | **5** |

---

## XIX. KẾ HOẠCH TRIỂN KHAI

| Giai đoạn | Nội dung chính | Thời gian dự kiến |
|---|---|---|
| **Phase 0** | Hạ tầng, Docker, CI/CD, Health check | Tuần 1–2 |
| **Phase 1** | Auth & User Management, Frontend auth screens | Tuần 3–6 |
| **Phase 2** | Custom CMS, Video Learning, Video Player | Tuần 7–12 |
| **Phase 3** | Quiz Engine, Placement Test, AI Evaluation | Tuần 11–16 |
| **Phase 4** | Commerce & Payment | Tuần 13–18 |
| **Phase 5** | Gamification, Analytics, Dashboard | Tuần 17–22 |
| **Phase 6** | Chat, Q&A, Notifications | Tuần 20–24 |
| **MVP Release** | — | Tuần 18–20 |
| **Mobile App** | Song song từ Phase 2 | — |

---

## XX. CHỮ KÝ XÁC NHẬN

Hai bên đồng ý rằng tài liệu này là danh sách đầy đủ và chính xác về các yêu cầu chức năng của hệ thống và là phụ lục ràng buộc của hợp đồng.

| | Bên Cung cấp | Bên Sử dụng |
|---|---|---|
| **Họ tên** | | |
| **Chức vụ** | | |
| **Ngày ký** | | |
| **Chữ ký** | | |

---

*Tài liệu này được tạo dựa trên MASTER_DESIGN_V3.md — phiên bản V3.0 ngày 07/06/2025.*
*Mọi thay đổi phạm vi phải có văn bản bổ sung hợp đồng (Change Request) được ký bởi cả hai bên.*
