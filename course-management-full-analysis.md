# PHÂN HỆ QUẢN LÝ KHÓA HỌC
# TÀI LIỆU PHÂN TÍCH NGHIỆP VỤ CHI TIẾT

---

# 1. TỔNG QUAN

## 1.1 Mục tiêu hệ thống

Phân hệ Quản lý khóa học cho phép bộ phận học thuật và quản trị:

- Tạo và quản lý khóa học
- Tổ chức nội dung đào tạo
- Quản lý level/module/lesson
- Quản lý bài kiểm tra
- Quản lý luồng học tập
- Quản lý ghi danh học viên
- Theo dõi tiến độ học tập
- Publish khóa học thương mại
- Quản lý completion và certificate

---

## 1.2 Đối tượng sử dụng

| Vai trò | Mô tả |
|---|---|
| Super Admin | Quản trị toàn hệ thống |
| Academic Admin | Quản lý học thuật |
| Teacher | Quản lý bài giảng |
| Content Creator | Upload học liệu |
| Student | Học viên |

---

# 2. KIẾN TRÚC NGHIỆP VỤ

## 2.1 Cấu trúc khóa học

```text
Course
 ├── Level
 │    ├── Module
 │    │     ├── Lesson
 │    │     ├── Quiz
 │    │     ├── Assignment
 │    │     └── Material
```

---

# 3. QUẢN LÝ KHÓA HỌC

# 3.1 Tạo khóa học

## Mục tiêu

Cho phép tạo khóa học đào tạo trực tuyến.

---

## Các trường thông tin

| Trường | Kiểu dữ liệu | Mô tả |
|---|---|---|
| id | UUID | Mã khóa học |
| code | String | Mã khóa học |
| slug | String | URL friendly |
| name | String | Tên khóa học |
| shortDescription | String | Mô tả ngắn |
| description | HTML | Nội dung giới thiệu |
| thumbnailUrl | String | Ảnh đại diện |
| bannerUrl | String | Banner landing |
| categoryId | UUID | Danh mục |
| level | Enum | Beginner/Intermediate/Advanced |
| language | Enum | VI/EN |
| tags | Array | Danh sách tag |
| teacherId | UUID | Giáo viên |
| duration | Integer | Tổng thời lượng |
| price | Decimal | Giá gốc |
| discountPrice | Decimal | Giá khuyến mãi |
| isFree | Boolean | Miễn phí |
| publishStatus | Enum | Draft/Published/Hidden |
| visibility | Enum | Public/Private |
| startDate | Datetime | Ngày mở khóa |
| endDate | Datetime | Ngày đóng khóa |
| certificateEnabled | Boolean | Có chứng chỉ |
| completionRequired | Boolean | Bắt buộc completion |
| createdAt | Datetime | Ngày tạo |
| updatedAt | Datetime | Ngày cập nhật |

---

## Chức năng

- Tạo khóa học
- Chỉnh sửa khóa học
- Xóa khóa học
- Clone khóa học
- Publish khóa học
- Archive khóa học
- Preview khóa học

---

# 3.2 Clone khóa học

## Chức năng clone

Cho phép clone:

- level
- module
- lesson
- quiz
- question bank
- completion rule
- tài liệu

---

# 3.3 Publish workflow

```text
Draft
  ↓
Review
  ↓
Published
  ↓
Hidden
  ↓
Archived
```

---

# 4. QUẢN LÝ LEVEL

# 4.1 Level Information

| Trường | Kiểu | Mô tả |
|---|---|---|
| id | UUID | Mã level |
| courseId | UUID | Thuộc course |
| name | String | Tên level |
| description | String | Mô tả |
| orderIndex | Integer | Thứ tự |
| isPublished | Boolean | Trạng thái |

---

# 4.2 Chức năng

- Tạo level
- Chỉnh sửa level
- Xóa level
- Kéo thả sắp xếp
- Ẩn/Hiện level

---

# 5. QUẢN LÝ MODULE

# 5.1 Module Information

| Trường | Kiểu | Mô tả |
|---|---|---|
| id | UUID | Mã module |
| levelId | UUID | Thuộc level |
| name | String | Tên module |
| description | String | Mô tả |
| thumbnailUrl | String | Ảnh module |
| estimatedDuration | Integer | Thời lượng |
| orderIndex | Integer | Thứ tự |
| isLocked | Boolean | Khóa module |
| publishStatus | Enum | Trạng thái |

---

# 5.2 Chức năng

- Tạo module
- Chỉnh sửa module
- Xóa module
- Kéo thả sắp xếp
- Thiết lập điều kiện mở module

---

# 6. QUẢN LÝ BÀI HỌC

# 6.1 Lesson Types

| Loại | Mô tả |
|---|---|
| Video Lesson | Bài học video |
| Reading Lesson | Nội dung text |
| Audio Lesson | Nội dung audio |
| PDF Lesson | Tài liệu PDF |
| Quiz Lesson | Bài kiểm tra |
| Assignment | Bài tập |
| Live Lesson | Livestream |

---

# 6.2 Lesson Information

| Trường | Kiểu | Mô tả |
|---|---|---|
| id | UUID | Mã lesson |
| moduleId | UUID | Thuộc module |
| type | Enum | Loại bài học |
| title | String | Tên bài học |
| slug | String | URL |
| shortDescription | String | Mô tả |
| content | HTML | Nội dung |
| videoUrl | String | Link video |
| audioUrl | String | Link audio |
| documentUrl | String | File tài liệu |
| transcript | Text | Subtitle |
| duration | Integer | Thời lượng |
| thumbnailUrl | String | Thumbnail |
| orderIndex | Integer | Thứ tự |
| isPreview | Boolean | Học thử |
| publishStatus | Enum | Trạng thái |
| createdBy | UUID | Người tạo |
| createdAt | Datetime | Ngày tạo |

---

# 6.3 Video Streaming

## Chức năng

- Upload video
- Streaming HLS
- Adaptive bitrate
- Resume progress
- Subtitle
- Playback speed
- Watermark
- Signed URL
- Chống download cơ bản

---

# 6.4 Lesson Completion Rule

## Điều kiện completion

| Điều kiện | Mô tả |
|---|---|
| View Lesson | Chỉ cần mở bài |
| Watch Percentage | Xem đủ % video |
| Pass Quiz | Đạt điểm quiz |
| Submit Assignment | Nộp bài |
| Manual Approval | Giáo viên duyệt |

---

# 7. QUIZ MANAGEMENT

# 7.1 Quiz Information

| Trường | Kiểu | Mô tả |
|---|---|---|
| id | UUID | Mã quiz |
| lessonId | UUID | Thuộc lesson |
| title | String | Tên quiz |
| description | String | Mô tả |
| type | Enum | Listening/Reading |
| duration | Integer | Thời gian |
| passingScore | Integer | Điểm đạt |
| maxAttempt | Integer | Số lần làm |
| randomQuestion | Boolean | Random câu hỏi |
| randomAnswer | Boolean | Random đáp án |
| showAnswer | Boolean | Hiển thị đáp án |
| showResult | Boolean | Hiển thị kết quả |
| publishStatus | Enum | Trạng thái |

---

# 7.2 Question Types

| Type | Mô tả |
|---|---|
| Multiple Choice | Trắc nghiệm |
| Multiple Answer | Chọn nhiều đáp án |
| Fill In Blank | Điền từ |
| Matching | Nối |
| Ordering | Sắp xếp |
| Essay | Tự luận |
| Audio Answer | Trả lời ghi âm |

---

# 7.3 Question Information

| Trường | Kiểu | Mô tả |
|---|---|---|
| id | UUID | Mã câu hỏi |
| questionType | Enum | Loại câu hỏi |
| content | HTML | Nội dung |
| explanation | HTML | Giải thích |
| difficulty | Enum | Easy/Medium/Hard |
| score | Integer | Điểm |
| audioUrl | String | File audio |
| imageUrl | String | Hình ảnh |
| tags | Array | Tag |
| answers | JSON | Danh sách đáp án |

---

# 7.4 Quiz Attempt

## Lưu thông tin

- thời gian bắt đầu
- thời gian kết thúc
- số lần làm
- câu trả lời
- điểm số
- thời gian làm bài
- trạng thái pass/fail

---

# 8. QUESTION BANK

# 8.1 Quản lý ngân hàng câu hỏi

## Chức năng

- Tạo câu hỏi
- Import câu hỏi
- Export câu hỏi
- Clone câu hỏi
- Random đề thi
- Gắn tag
- Phân loại level

---

# 8.2 Import Format

## Hỗ trợ

- Excel
- CSV
- GIFT format
- JSON

---

# 9. ENROLLMENT

# 9.1 Enrollment Information

| Trường | Kiểu | Mô tả |
|---|---|---|
| id | UUID | Mã enrollment |
| userId | UUID | Học viên |
| courseId | UUID | Khóa học |
| enrolledAt | Datetime | Ngày ghi danh |
| expiredAt | Datetime | Hết hạn |
| status | Enum | Active/Expired |
| source | Enum | Payment/Admin/Coupon |
| progress | Decimal | Tiến độ |

---

# 9.2 Chức năng

- Ghi danh thủ công
- Ghi danh tự động
- Gia hạn khóa học
- Hủy ghi danh
- Khóa học viên

---

# 10. LEARNING PROGRESS

# 10.1 Tracking Information

## Hệ thống lưu

- lesson viewed
- video watch duration
- completion status
- quiz result
- last learning position
- learning streak

---

# 10.2 Completion Engine

## Theo dõi

- completion lesson
- completion module
- completion course
- certificate eligibility

---

# 11. CERTIFICATE

# 11.1 Certificate Information

| Trường | Kiểu | Mô tả |
|---|---|---|
| id | UUID | Mã chứng chỉ |
| code | String | Mã verify |
| userId | UUID | Học viên |
| courseId | UUID | Khóa học |
| issuedAt | Datetime | Ngày cấp |
| pdfUrl | String | File PDF |
| verifyUrl | String | URL verify |

---

# 11.2 Chức năng

- Sinh PDF
- QR verify
- Public verify page
- Download certificate
- Share social

---

# 12. SEARCH & FILTER

# 12.1 Search

## Điều kiện

- tên khóa học
- category
- level
- tags
- teacher
- publish status

---

# 12.2 Filter

## Bộ lọc

- level
- giá
- kỹ năng
- trạng thái
- miễn phí/trả phí

---

# 13. PHÂN QUYỀN

# 13.1 RBAC

| Role | Quyền |
|---|---|
| Super Admin | Full access |
| Academic Admin | Quản lý khóa học |
| Teacher | Quản lý bài học |
| Content Creator | Upload nội dung |
| Student | Học tập |

---

# 14. NOTIFICATION

# 14.1 Notification Types

- Push notification
- Email notification
- In-app notification

---

# 14.2 Trigger Event

- publish khóa học
- bài học mới
- quiz mới
- gần hết hạn khóa học
- completion khóa học

---

# 15. REPORTING

# 15.1 Course Analytics

## Dashboard

- số lượng học viên
- tỷ lệ completion
- tỷ lệ pass quiz
- average score
- learning duration
- retention rate
- doanh thu khóa học

---

# 16. YÊU CẦU PHI CHỨC NĂNG

# 16.1 Performance

- API response < 2s
- hỗ trợ concurrent user
- hỗ trợ streaming video
- mobile responsive

---

# 16.2 Security

- JWT authentication
- RBAC
- Signed video URL
- Audit log
- Rate limit
- HTTPS



# LUỒNG NGHIỆP VỤ TỔNG QUAN

```text
Academic Admin
    ↓
Tạo khóa học
    ↓
Tạo Level/Module/Lesson
    ↓
Upload video/tài liệu
    ↓
Tạo Quiz
    ↓
Publish khóa học
    ↓
Học viên ghi danh
    ↓
Học tập & làm quiz
    ↓
Tracking tiến độ
    ↓
Completion khóa học
    ↓
Sinh certificate
```
