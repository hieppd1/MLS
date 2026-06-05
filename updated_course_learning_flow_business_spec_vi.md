# CẬP NHẬT MÔ TẢ NGHIỆP VỤ KHÓA HỌC
# LEARNING FLOW + INTERACTIVE VIDEO LESSON

---

# 1. ĐỊNH HƯỚNG NGHIỆP VỤ MỚI

Hệ thống không còn là LMS kiểu truyền thống:

```text
Video → Học → Quiz
```

Mà chuyển sang mô hình:

```text
Interactive Learning Experience
```

Trong đó:

- Một buổi học kéo dài tối đa khoảng 90 phút
- Không học dạng video dài liên tục
- Nội dung được chia thành nhiều phân đoạn nhỏ
- Mỗi phân đoạn có thể gắn:
  - ngữ pháp
  - từ vựng
  - quiz
  - bài tập
  - tài liệu
  - flashcard
  - PPT
  - note
- Học viên có thể click trực tiếp vào từng mục để nhảy đến đúng timestamp trên video

=> Đây là mô hình:

```text
Interactive Timeline Learning
```

---

# 2. CẤU TRÚC NGHIỆP VỤ MỚI

# 2.1 Course Structure

```text
Course
 ├── Level
 │    ├── Module
 │    │     ├── Session (90 phút)
 │    │     │      ├── Segment 1 (6-8 phút)
 │    │     │      ├── Segment 2
 │    │     │      ├── Segment 3
 │    │     │      └── Segment N
```

---

# 2.2 Session

## Định nghĩa

Một buổi học hoàn chỉnh.

## Quy tắc nghiệp vụ

| Thuộc tính | Quy định |
|---|---|
| Thời lượng tối đa | 90 phút |
| Có video chính | Có |
| Có timeline phân đoạn | Có |
| Có learning assets | Có |
| Có tracking | Có |
| Có progress | Có |

---

# 2.3 Segment

## Định nghĩa

Một phần nhỏ bên trong buổi học.

## Quy tắc nghiệp vụ

| Thuộc tính | Quy định |
|---|---|
| Thời lượng | 6-8 phút |
| Có timestamp | Có |
| Có title | Có |
| Có grammar | Có |
| Có word list | Có |
| Có quiz | Có |
| Có tài liệu | Có |
| Có subtitle | Có |
| Có note | Có |

---

# 3. NGHIỆP VỤ VIDEO INTERACTIVE

# 3.1 Mô hình hoạt động

## Video chính

Một session sẽ có:

- 1 video chính
- timeline phân đoạn
- các block học tập tương tác

---

# 3.2 Timeline Interactive

## UI mô tả

```text
----------------------------------
| VIDEO PLAYER                  |
----------------------------------
| Timeline Segments             |
| [Grammar] [Quiz] [Word]       |
| [PPT] [Exercise] [Note]       |
----------------------------------
```

---

# 3.3 Jump To Timestamp

## Nghiệp vụ

Khi học viên click:

- grammar
- word
- quiz
- note
- exercise

thì hệ thống:

```text
seek video tới timestamp tương ứng
```

Ví dụ:

| Item | Timestamp |
|---|---|
| Grammar 1 | 00:05:20 |
| Word List | 00:08:10 |
| Quiz | 00:12:30 |

---

# 3.4 Learning Asset Mapping

Mỗi asset sẽ gắn với:

- video
- timestamp
- segment

---

# 4. CÁC LOẠI LEARNING ASSET

# 4.1 Grammar Block

## Mục tiêu

Hiển thị phần ngữ pháp tại đúng đoạn video.

## Chức năng

- tiêu đề ngữ pháp
- mô tả
- ví dụ
- highlight keyword
- jump video
- đánh dấu đã học

---

# 4.2 Vocabulary Block

## Chức năng

- từ vựng
- nghĩa
- IPA
- audio pronunciation
- ví dụ
- bookmark
- flashcard
- jump video

---

# 4.3 Exercise Block

## Chức năng

- bài tập nhanh
- multiple choice
- fill in blank
- matching
- drag drop

---

# 4.4 Quiz Block

## Chức năng

- mini quiz theo segment
- random answer
- auto grading
- retry
- explanation

---

# 4.5 PPT Block

## Chức năng

- nhúng slide
- download slide
- preview slide
- sync timestamp

---

# 4.6 Note Block

## Chức năng

- ghi chú giáo viên
- ghi chú học viên
- highlight nội dung quan trọng

---

# 4.7 File Attachment

## Hỗ trợ

- PDF
- DOCX
- PPTX
- XLSX
- Image
- Audio

---

# 5. CẤU TRÚC DỮ LIỆU MỚI

# 5.1 Session

| Field | Type | Description |
|---|---|---|
| id | UUID | ID |
| courseId | UUID | Course |
| title | varchar | Tên buổi học |
| description | text | Mô tả |
| videoUrl | text | Video |
| duration | int | Tổng thời lượng |
| thumbnailUrl | text | Thumbnail |
| orderIndex | int | Thứ tự |
| publishStatus | enum | Status |
| createdAt | datetime | Created time |

---

# 5.2 Segment

| Field | Type | Description |
|---|---|---|
| id | UUID | ID |
| sessionId | UUID | Session |
| title | varchar | Tiêu đề |
| description | text | Mô tả |
| startTime | int | Timestamp bắt đầu |
| endTime | int | Timestamp kết thúc |
| duration | int | Thời lượng |
| orderIndex | int | Thứ tự |
| createdAt | datetime | Created time |

---

# 5.3 LearningAsset

| Field | Type | Description |
|---|---|---|
| id | UUID | ID |
| segmentId | UUID | Segment |
| type | enum | Grammar/Word/Quiz/PPT |
| title | varchar | Tiêu đề |
| description | text | Nội dung |
| startTime | int | Timestamp |
| endTime | int | Timestamp |
| metadata | jsonb | Extra data |
| orderIndex | int | Thứ tự |
| isPublic | boolean | Public |
| createdAt | datetime | Created time |

---

# 6. LEARNING FLOW

# 6.1 Flow học tập

```text
Student mở Session
    ↓
Video bắt đầu phát
    ↓
Timeline hiển thị Segment
    ↓
Student click Grammar
    ↓
Video seek tới timestamp
    ↓
Hiển thị Grammar Block
    ↓
Student làm Quiz
    ↓
Tracking progress
```

---

# 6.2 Completion Logic

## Completion theo:

- watch percentage
- completed segment
- completed quiz
- completed exercise

---

# 7. TRACKING & ANALYTICS

# 7.1 Tracking

## Hệ thống cần lưu

- watch duration
- segment completed
- grammar viewed
- word saved
- quiz score
- replay count
- last timestamp

---

# 7.2 Analytics

## Teacher analytics

- segment được xem nhiều nhất
- segment bị drop nhiều
- quiz fail rate
- replay rate
- average watch duration

---

# 8. CMS QUẢN LÝ NỘI DUNG

# 8.1 Session Editor

Teacher/Admin có thể:

- upload video
- tạo segment
- kéo timeline
- add grammar
- add quiz
- add word
- add PPT
- add exercise
- add note

---

# 8.2 Timeline Editor

## Chức năng

Cho phép:

- drag & drop segment
- chỉnh timestamp
- preview timeline
- sync subtitle

---

# 8.3 Segment Editor

## Chức năng

Teacher có thể:

- chỉnh tiêu đề
- chỉnh timestamp
- add learning asset
- reorder asset
- preview asset

---

# 9. FRONTEND IMPLEMENTATION

# 9.1 Video Player

## Chức năng bắt buộc

- HLS streaming
- seek timestamp
- subtitle
- speed control
- timeline marker
- progress tracking
- resume playback

---

# 9.2 UI Layout

```text
----------------------------------
| Video Player                   |
----------------------------------
| Timeline                       |
----------------------------------
| Segment List                   |
----------------------------------
| Grammar / Word / Quiz / PPT    |
----------------------------------
```

---

# 9.3 Mobile App

## Hỗ trợ

- vertical learning layout
- swipe segment
- mini player
- offline cache
- push notification

---

# 10. BACKEND IMPLEMENTATION

# 10.1 New Modules

## ASP.NET Core

- SessionModule
- SegmentModule
- LearningAssetModule
- TimelineModule
- InteractiveVideoModule

---

# 10.2 API

## Session APIs

```http
GET /api/sessions/{id}
POST /api/sessions
PUT /api/sessions/{id}
```

---

## Segment APIs

```http
GET /api/segments/{id}
POST /api/segments
PUT /api/segments/{id}
```

---

## Learning Asset APIs

```http
POST /api/assets
PUT /api/assets/{id}
DELETE /api/assets/{id}
```

---

# 11. STORAGE & STREAMING

# 11.1 Video Storage

## Đề xuất

- Cloudflare Stream
- AWS S3 + CloudFront
- MinIO + CDN

---

# 11.2 Video Format

## Hỗ trợ

- HLS
- adaptive bitrate
- subtitle VTT
- thumbnail preview

---

# 12. ĐỊNH HƯỚNG KIẾN TRÚC

Đây không còn là:

```text
Traditional LMS
```

Mà là:

```text
Interactive Learning Platform
```

Trong đó:

- Video là trung tâm
- Timeline là learning navigator
- Segment là learning unit
- Asset là learning interaction

---

# 13. KẾT LUẬN

Hệ thống khóa học cần nâng cấp theo mô hình:

```text
Interactive Timeline Learning System
```

bao gồm:

- Session 90 phút
- Segment 6-8 phút
- Interactive timeline
- Jump to timestamp
- Grammar block
- Vocabulary block
- Quiz block
- PPT block
- Exercise block
- Progress tracking
- Interactive CMS editor

để đáp ứng trải nghiệm học tập kiểu:

- Moon.vn
- Edmicro
- Coursera Interactive
- Udemy Interactive Learning

