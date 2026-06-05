# MLS — MASTER DESIGN DOCUMENT V4

> **File duy nhất** tổng hợp kiến trúc, quyết định thiết kế và kế hoạch triển khai.
> Mọi thay đổi hướng đi cập nhật tại đây.
>
> Version: 4.2 — Ngày cập nhật: 19/05/2026
>
> **🔄 V4 Thay đổi chính so với V3:**
> - **Mô hình học tập hoàn toàn mới:** Interactive Timeline Learning (từ Linear LMS)
> - **Lesson → Session + Segment + LearningAsset:** Cấu trúc dữ liệu mới toàn bộ phần học tập
> - **Video Interactive:** Video là trung tâm, timeline segment là navigator học tập
> - **LearningAsset Engine:** Grammar / Vocabulary / Quiz / PPT / Exercise / Note gắn timestamp
> - **Phase plan điều chỉnh:** Bổ sung Phase 2B (Interactive Learning) + Phase 2C (CMS Editor)
> - **Backend/Auth/Infra/Design System/Phase 0-1:** Giữ nguyên từ V3

---

# MỤC LỤC

1. [Tổng quan hệ thống](#1-tổng-quan-hệ-thống)
2. [Phân tích thay đổi V3 → V4](#2-phân-tích-thay-đổi-v3--v4)
3. [Tech stack](#3-tech-stack)
4. [Chiến lược lưu trữ & bảo vệ nội dung](#4-chiến-lược-lưu-trữ--bảo-vệ-nội-dung)
5. [Module breakdown](#5-module-breakdown)
6. [Database schema — Đầy đủ V4](#6-database-schema--đầy-đủ-v4)
7. [API design](#7-api-design)
8. [Bảo mật](#8-bảo-mật)
9. [Frontend Design System](#9-frontend-design-system)
10. [Frontend — Màn hình User-facing](#10-frontend--màn-hình-user-facing)
11. [Video Player + Interactive Timeline — Spec V4](#11-video-player--interactive-timeline--spec-v4)
12. [CMS Editor — Interactive Learning](#12-cms-editor--interactive-learning)
13. [Kế hoạch triển khai — Phase Plan V4](#13-kế-hoạch-triển-khai--phase-plan-v4)
14. [Không làm trong MVP](#14-không-làm-trong-mvp)
15. [Admin Panel Design Standards](#15-admin-panel-design-standards)

---

# 1. TỔNG QUAN HỆ THỐNG

## 1.1 Mục tiêu sản phẩm

Nền tảng học tiếng Việt trực tuyến dạng **Interactive Learning Platform** (không phải LMS truyền thống):

- Học viên học theo buổi học (Session 90 phút), chia thành phân đoạn nhỏ (Segment 6–8 phút)
- Video là trung tâm, timeline phân đoạn là navigator học tập
- Mỗi phân đoạn gắn: ngữ pháp / từ vựng / quiz / bài tập / PPT / ghi chú
- Click vào asset → video seek đến đúng timestamp
- Placement Test → xếp Level 1–6
- AI chấm Speaking & Writing
- Mua khóa học theo level / combo / full
- Chứng chỉ sau hoàn thành Level
- Multi-tenant: nhiều trung tâm dùng chung nền tảng

## 1.2 Kiến trúc tổng thể

```text
                ┌─────────────────────────────────┐
                │   ReactJS Web (NextJS 15)        │
                │   React Native Mobile App        │
                └──────────────┬──────────────────┘
                               │ HTTPS
                ┌──────────────▼──────────────────┐
                │   ASP.NET Core 10 — API          │
                │   (Clean Architecture + CQRS)    │
                └──────────────┬──────────────────┘
                               │
             ┌─────────────────┼─────────────────┐
             │                 │                 │
    ┌────────▼───────┐  ┌──────▼──────┐  ┌──────▼──────┐
    │  PostgreSQL 18 │  │    Redis    │  │  Python     │
    │  (schema/tenant│  │   (cache +  │  │  FastAPI    │
    │   Custom CMS   │  │   sessions) │  │  (AI Score) │
    │   Quiz Engine) │  └─────────────┘  └─────────────┘
    └────────────────┘
             │
    ┌────────▼───────┐
    │   RabbitMQ     │
    │  (events/jobs) │
    └────────────────┘
```

## 1.3 Thành phần tự xây dựng

| Thành phần | Mô tả |
|---|---|
| **Interactive CMS** | Session / Segment / LearningAsset CRUD + Timeline Editor |
| **Interactive Video Engine** | Video + Timeline + Asset Jump-to-timestamp |
| **LearningAsset Engine** | Grammar / Vocabulary / Quiz / PPT / Exercise / Note types |
| **Quiz Engine** | Embedded trong Segment (QuizBlock + ExerciseBlock) |
| **Video Pipeline** | Upload → FFmpeg HLS transcode → Signed token streaming |
| **Auth & RBAC** | JWT + Refresh Token, Google OAuth, OTP |
| **Commerce** | VNPay / MoMo / Stripe / Chuyển khoản |
| **AI Service** | Python FastAPI — Speaking (GPT-4o Audio) + Writing (GPT-4o mini) |
| **Gamification** | Points, Badges, Leaderboard, Streak |
| **Analytics** | Event-driven, segment-level analytics, teacher dashboard |
| **Certificate** | PDF generation + QR verify |
| **Communication** | Q&A, SignalR chat, FCM push, Email |

---

# 2. PHÂN TÍCH THAY ĐỔI V3 → V4

## 2.1 Tóm tắt thay đổi nghiệp vụ

| Khía cạnh | V3 (LMS truyền thống) | V4 (Interactive Timeline Learning) |
|---|---|---|
| **Đơn vị học tập** | Lesson (Video / PDF / Quiz...) | Session (90 phút) → Segment (6–8 phút) |
| **Video** | Xem thẳng, không tương tác | Timeline có Segments, click → jump timestamp |
| **Nội dung** | LessonDocument (PDF/Audio file) | LearningAsset: Grammar / Vocab / Quiz / PPT / Exercise / Note |
| **Quiz** | Separate Quiz Engine | Embedded trong Segment (QuizBlock, ExerciseBlock) |
| **Hoàn thành** | WatchPercentage / PassQuiz | Watch % + Segment completed + Quiz score |
| **CMS Editor** | Drag-drop module/lesson | Timeline Editor + Segment Editor + Asset Manager |
| **Analytics** | Lesson-level | Segment-level: drop rate, replay rate, quiz fail rate |

## 2.2 Ánh xạ cấu trúc cũ → mới

```text
V3 STRUCTURE                        V4 STRUCTURE
─────────────────────────────────   ─────────────────────────────────
Course                              Course
  └── CourseModule                    └── CourseModule
        └── Lesson (Video type)  →         └── Session (90 phút, 1 video)
              └── VideoAsset                     └── Segment (6-8 phút)
              └── LessonDocument                       └── LearningAsset
                                                             (Grammar/Vocab/Quiz/PPT/...)
```

## 2.3 Chiến lược backward-compatibility

**Giữ nguyên:**
- Bảng `Lessons` với `LessonType = Video | Reading | Pdf | Audio` → các loại bài không phải interactive
- Cấu trúc `Course → CourseModule → Lesson` vẫn được dùng cho content đơn giản (PDF, Audio, Reading)
- Mọi API CMS hiện tại cho Lessons/Modules vẫn hoạt động

**Thêm mới (song song):**
- `Sessions` → thay thế `Lessons` loại Video cho interactive content
- `Segments` → timeline phân đoạn bên trong Session
- `LearningAssets` → nội dung học tập gắn với Segment + timestamp

**Quy tắc:**
- Module có thể chứa hỗn hợp Lessons cũ (PDF/Audio) + Sessions mới (Interactive Video)
- Một Module item = `(LessonId, SessionId)` — chỉ một trong hai có giá trị

## 2.4 Những gì KHÔNG thay đổi

- Toàn bộ Phase 0, Phase 1 (Auth, RBAC, Multi-tenant) ✅
- Tech stack, Infrastructure ✅
- Design System (màu sắc, typography, spacing, components) ✅
- Homepage, course catalog, course detail pages ✅
- Commerce / Payment (Phase 4) ✅
- Certificate / Gamification / Analytics framework ✅
- Admin User/Role/Settings management ✅
- Teacher Marketplace (TeacherProfile, Follow, Public pages) ✅

---

# 3. TECH STACK

## Backend

| Component | Công nghệ |
|---|---|
| Framework | ASP.NET Core 10 |
| Architecture | Clean Architecture + CQRS (MediatR 14) |
| ORM | Entity Framework Core |
| Validation | FluentValidation 12 |
| Auth | JWT + Refresh Token |
| Background Jobs | Hangfire |
| Logging | Serilog |
| Real-time | SignalR |
| Video transcode | FFmpeg |
| Asset metadata | JSONB (PostgreSQL native) |

## Frontend Web

| Component | Công nghệ |
|---|---|
| Framework | NextJS 15 (App Router) |
| UI | Tailwind CSS v4 + shadcn/ui |
| Animation | Framer Motion |
| State | Redux Toolkit + RTK Query |
| Video Player | HLS.js 1.4+ (custom interactive player) |
| Timeline Editor | Custom DnD (HTML5 DnD hoặc @dnd-kit) |
| Charts | Recharts |

## Infrastructure

| Component | Công nghệ |
|---|---|
| Database | PostgreSQL 18 |
| Cache | Redis 7 |
| Message Queue | RabbitMQ 3 |
| File Storage | Local disk → scale to MinIO |
| Container | Docker + Docker Compose |
| CI/CD | GitHub Actions |

---

# 4. CHIẾN LƯỢC LƯU TRỮ & BẢO VỆ NỘI DUNG

## 4.1 Cấu trúc thư mục

```text
/var/app/media/
├── {tenant_slug}/
│   ├── sessions/
│   │   └── {session_id}/
│   │       ├── raw/
│   │       ├── hls/
│   │       │   ├── master.m3u8
│   │       │   ├── 360p/
│   │       │   ├── 720p/
│   │       │   └── 1080p/
│   │       └── thumbnail.jpg
│   ├── assets/
│   │   ├── ppt/         ← PPT/PPTX files
│   │   ├── audio/       ← Vocabulary pronunciation audio
│   │   └── attachments/ ← PDF / DOCX / XLSX
│   ├── docs/
│   ├── avatars/
│   └── certificates/
```

## 4.2 Video Pipeline

**Upload:** Teacher/Admin → `raw/` → Hangfire FFmpeg job → HLS 3 bitrates → DB status = READY

**Playback:** Student → API verify enrolled → Signed JWT (2h) → HLS.js stream

## 4.3 Asset Storage

- **PPT/PPTX:** Convert sang images hoặc PDF preview server-side (LibreOffice headless)
- **Vocabulary audio:** Upload MP3/OGG → serve inline với signed token
- **PDF attachments:** Stream inline với watermark động

---

# 5. MODULE BREAKDOWN

## MODULE 1 — Auth & User Management ✅ DONE (xem Phase 1)

## MODULE 2 — Course Management (CMS)

### 2.1 Cấu trúc nội dung V4

```text
Course
 ├── CourseModule
 │    ├── Session (Interactive Video, 90 phút)  ← MỚI
 │    │    ├── Segment 1 (6-8 phút)             ← MỚI
 │    │    │    ├── LearningAsset: GrammarBlock
 │    │    │    ├── LearningAsset: VocabularyBlock
 │    │    │    ├── LearningAsset: QuizBlock
 │    │    │    └── LearningAsset: NoteBlock
 │    │    ├── Segment 2
 │    │    └── Segment N
 │    └── Lesson (PDF / Audio / Reading — giữ nguyên)
 └── CourseEnrollment
```

### 2.2 Course Entity — Fields (không đổi từ V3)

| Field | Type | Mô tả |
|---|---|---|
| id | UUID | Mã khóa học |
| slug | String | URL-friendly |
| title | String | Tên khóa học |
| shortDescription | String | Mô tả ngắn |
| description | HTML | Nội dung đầy đủ |
| thumbnailUrl | String | Ảnh đại diện |
| level | Int 1–6 | Cấp độ |
| status | Enum | Draft / PendingReview / Published / Hidden / Archived |
| visibility | Enum | Public / Private |
| isFree | Boolean | Khóa học miễn phí |
| price | Decimal | Giá gốc |
| discountPrice | Decimal? | Giá khuyến mãi |
| certificateEnabled | Boolean | Cấp chứng chỉ |
| teacherId | UUID? | Giáo viên phụ trách |

### 2.3 Session Entity (MỚI V4)

| Field | Type | Mô tả |
|---|---|---|
| id | UUID | ID |
| moduleId | UUID | Module chứa session |
| title | varchar(200) | Tên buổi học |
| description | text | Mô tả |
| orderIndex | int | Thứ tự trong module |
| videoAssetId | UUID? | Liên kết VideoAsset |
| durationSeconds | int | Tổng thời lượng (giây) |
| thumbnailUrl | varchar | Thumbnail |
| isFreeTrial | boolean | Học thử miễn phí |
| publishStatus | enum | Draft / Published |
| createdAt | datetime | |
| updatedAt | datetime | |

**Quy tắc:** `durationSeconds ≤ 5400` (90 phút tối đa).

### 2.4 Segment Entity (MỚI V4)

| Field | Type | Mô tả |
|---|---|---|
| id | UUID | ID |
| sessionId | UUID | Session chứa |
| title | varchar(200) | Tiêu đề phân đoạn |
| description | text? | Mô tả ngắn |
| startTime | int | Timestamp bắt đầu (giây) |
| endTime | int | Timestamp kết thúc (giây) |
| orderIndex | int | Thứ tự |
| createdAt | datetime | |

**Quy tắc:** `endTime - startTime` trong khoảng 360–480 giây (6–8 phút). Segments không overlap.

### 2.5 LearningAsset Entity (MỚI V4)

| Field | Type | Mô tả |
|---|---|---|
| id | UUID | ID |
| segmentId | UUID | Segment chứa |
| type | enum | GrammarBlock / VocabularyBlock / QuizBlock / ExerciseBlock / PPTBlock / NoteBlock / FileAttachment |
| title | varchar(200) | Tiêu đề |
| description | text? | Mô tả / nội dung chính |
| startTime | int | Timestamp trên video (giây) — để jump-to |
| orderIndex | int | Thứ tự trong segment |
| metadata | jsonb | Dữ liệu chi tiết theo type |
| isPublic | boolean | Public (default true) |
| createdAt | datetime | |

**metadata JSONB theo type:**

```jsonc
// GrammarBlock
{
  "pattern": "Subject + là + Noun",
  "examples": [
    { "vi": "Tôi là học sinh.", "en": "I am a student." }
  ],
  "keywords": ["là", "học sinh"]
}

// VocabularyBlock
{
  "words": [
    {
      "word": "học sinh",
      "ipa": "hɔ̌k ʂɨ̌ŋ",
      "meaning": "student",
      "audioUrl": "demo/assets/audio/hoc-sinh.mp3",
      "example": "Tôi là học sinh.",
      "exampleTranslation": "I am a student."
    }
  ]
}

// QuizBlock
{
  "questions": [
    {
      "text": "Câu nào đúng?",
      "type": "multiple_choice",
      "options": ["A. Tôi là học sinh", "B. Tôi học sinh là"],
      "correctIndex": 0,
      "explanation": "Cấu trúc: Subject + là + Noun"
    }
  ],
  "passScore": 70,
  "timeLimit": 120
}

// ExerciseBlock
{
  "type": "fill_in_blank",  // fill_in_blank | matching | drag_drop
  "items": [
    { "sentence": "Tôi ___ học sinh.", "answer": "là" }
  ]
}

// PPTBlock
{
  "fileUrl": "demo/assets/ppt/bai1-slides.pdf",
  "slideCount": 12,
  "previewImages": ["demo/assets/ppt/bai1-p1.png", "..."]
}

// NoteBlock
{
  "authorType": "teacher",  // teacher | student
  "content": "Lưu ý: thanh điệu thứ 3 khác với thanh 4...",
  "highlights": [{ "text": "thanh điệu", "color": "#FFD600" }]
}

// FileAttachment
{
  "fileUrl": "demo/assets/attachments/giao-trinh-bai1.pdf",
  "fileName": "Giáo trình Bài 1.pdf",
  "fileType": "pdf",  // pdf | docx | pptx | xlsx | audio | image
  "sizeBytes": 2048000
}
```

### 2.6 Lesson Completion Rules (V4 cập nhật)

| Loại nội dung | Rule |
|---|---|
| Session (Interactive Video) | WatchPercentage ≥ 80% **AND** ≥ 70% segments completed |
| Segment | Viewed + quiz/exercise passed (nếu có) |
| Lesson - PDF/Audio/Reading | ViewLesson (mở bài = xong) |
| Lesson - Quiz standalone | PassScore |

## MODULE 3 — Interactive Video Learning (MỚI V4)

*(Chi tiết tại mục 11)*

## MODULE 4 — Placement Test *(Phase 3)*

## MODULE 5 — Quiz Engine

> **V4:** Quiz được tích hợp trực tiếp vào Segment qua `QuizBlock` / `ExerciseBlock` metadata.
> Standalone Quiz Engine (Phase 3) vẫn tồn tại cho Placement Test và Exit Test.

### Question Types
MultipleChoice / MultipleAnswer / FillInBlank / Matching / Ordering / Essay / AudioAnswer

## MODULE 6 — Commerce & Payment *(Phase 4)*
## MODULE 7 — Certificate *(Phase 4)*
## MODULE 8 — Analytics V4 *(Phase 5)*

> **V4 bổ sung segment-level analytics:**
> - Segment completion rate
> - Segment drop rate (học viên dừng ở segment nào)
> - Asset interaction rate (grammar/word/quiz clicked %)
> - Replay rate per segment
> - Quiz fail rate per QuizBlock

## MODULE 9 — Gamification *(Phase 5)*
## MODULE 10 — AI Recommendation *(Phase 5)*
## MODULE 11 — Support & Communication *(Phase 6)*

---

# 6. DATABASE SCHEMA — ĐẦY ĐỦ V4

## Auth (không đổi từ V3)

```sql
Users          -- Id, Email, Phone, PasswordHash, GoogleId, Status
UserProfiles   -- Id, UserId, FullName, AvatarUrl, DateOfBirth, Gender, Address, CurrentLevel
Roles          -- Id, Name, Description, Permissions (jsonb)
UserRoles      -- UserId + RoleId
RefreshTokens  -- Id, UserId, TokenHash, DeviceId, ExpiresAt, RevokedAt
OtpVerifications -- Id, Target, CodeHash, Type, ExpiresAt, UsedAt
```

## Content CMS (V4 — mở rộng)

```sql
Courses
  Id, Slug, Title, ShortDescription, Description
  Level, ThumbnailUrl, BannerUrl
  Status (Draft|PendingReview|Published|Hidden|Archived)
  Visibility (Public|Private)
  IsFree, Price, DiscountPrice, DiscountEndsAt
  CertificateEnabled, CompletionRequired
  TeacherId, CreatedBy, PublishedAt
  Language, Code, Tags, Duration, StartDate, EndDate

CourseModules
  Id, CourseId, Title, Description, OrderIndex
  IsLocked, ThumbnailUrl, EstimatedDuration, LevelId

-- GIỮ NGUYÊN cho bài học không phải interactive video --
Lessons
  Id, ModuleId, LessonType (Video|Reading|Audio|Pdf|Quiz|Assignment|Live)
  Title, Description, Content (HTML)
  OrderIndex, IsFreeTrial, PassScore, DurationMinutes

VideoAssets
  Id, LessonId, Status, HlsPath, ThumbnailUrl
  DurationSeconds, SizeBytes, OriginalFileName

LessonDocuments
  Id, LessonId, Type, Title, FileUrl, SizeBytes, IsProtected, OrderIndex

-- MỚI V4: Interactive Learning --
Sessions
  Id, ModuleId, Title, Description
  OrderIndex, IsFreeTrial, PublishStatus
  VideoAssetId (FK → VideoAssets, nullable — video riêng cho session)
  DurationSeconds, ThumbnailUrl
  CreatedAt, UpdatedAt

Segments
  Id, SessionId, Title, Description
  StartTime (int, giây), EndTime (int, giây)
  OrderIndex, CreatedAt

LearningAssets
  Id, SegmentId, Type (enum), Title, Description
  StartTime (int, giây — timestamp trên video)
  OrderIndex, Metadata (jsonb), IsPublic
  CreatedAt, UpdatedAt
```

**Enums:**
```sql
-- Session publish status
CREATE TYPE session_publish_status AS ENUM ('Draft', 'Published');

-- LearningAsset type
CREATE TYPE learning_asset_type AS ENUM (
  'GrammarBlock', 'VocabularyBlock', 'QuizBlock',
  'ExerciseBlock', 'PPTBlock', 'NoteBlock', 'FileAttachment'
);
```

## Learning (V4 — bổ sung)

```sql
CourseEnrollments
  Id, UserId, CourseId, EnrolledAt, ExpiresAt
  Source (Payment|Admin|Free|Coupon), OrderId

LessonProgresses (giữ nguyên cho Lesson type cũ)
  Id, UserId, LessonId, Status, Score, CompletedAt

VideoTracking (giữ nguyên)
  Id, UserId, LessonId, PositionSeconds, DurationSeconds, LastUpdatedAt
  UNIQUE(UserId, LessonId)

-- MỚI V4 --
SessionProgresses
  Id, UserId, SessionId
  Status (NotStarted|InProgress|Completed)
  WatchedSeconds, WatchPercentage
  LastPositionSeconds   -- để resume video
  CompletedAt, UpdatedAt
  UNIQUE(UserId, SessionId)

SegmentProgresses
  Id, UserId, SegmentId
  IsViewed, IsCompleted
  ViewedAt, CompletedAt
  UNIQUE(UserId, SegmentId)

LearningAssetInteractions
  Id, UserId, AssetId
  InteractionType (Viewed|QuizPassed|QuizFailed|WordSaved|Downloaded)
  Score (nullable — cho quiz)
  CreatedAt
  -- không unique: cho phép nhiều lần interact
```

## Teacher Marketplace (không đổi từ V3)

```sql
TeacherProfiles   -- userId, displayName, slug, avatarUrl, coverUrl, headline, bio...
TeacherFollowers  -- teacherProfileId, studentId
```

## System Config (không đổi từ V3)

```sql
BannerSlides      -- title, subtitle, imageUrl, linkUrl, orderIndex, isActive
```

## Quiz Engine *(Phase 3)*

```sql
Questions, Quizzes, QuizAttempts, QuizAttemptAnswers
```

## Commerce *(Phase 4)*

```sql
Products, Orders, Payments, Invoices, Coupons
```

## Analytics *(Phase 5)*

```sql
LearningEvents        -- userId, eventType, entityId, entityType, metadata (jsonb), createdAt
SegmentAnalytics      -- segmentId, date, viewCount, dropCount, avgWatchPercent, quizPassRate
AnalyticsSnapshots    -- userId, snapshotDate, listeningScore, speakingScore, readingScore, writingScore
```

## Gamification *(Phase 5)*

```sql
Points, Badges, UserBadges, Leaderboards
```

---

# 7. API DESIGN

## 7.1 Public — Session / Segment Learning (MỚI V4)

```http
-- Session
GET  /api/v1/sessions/{id}                     ← Chi tiết session + segments + assets
POST /api/v1/sessions/{id}/start               ← Bắt đầu session (tạo SessionProgress)
POST /api/v1/sessions/{id}/video-position      ← Lưu vị trí video (resume)
POST /api/v1/sessions/{id}/complete            ← Hoàn thành session

-- Segment
POST /api/v1/segments/{id}/view                ← Đánh dấu đã xem segment
POST /api/v1/segments/{id}/complete            ← Hoàn thành segment

-- LearningAsset interactions
POST /api/v1/assets/{id}/interact              ← Ghi nhận tương tác (viewed/quiz/word-saved)
GET  /api/v1/assets/{id}/quiz/start            ← Bắt đầu quiz trong asset
POST /api/v1/assets/{id}/quiz/submit           ← Nộp quiz
```

## 7.2 Public — Course Catalog (giữ nguyên từ V3)

```http
GET  /api/v1/courses                    ← Danh sách (filter: level, search, page)
GET  /api/v1/courses/{id}               ← Chi tiết + modules/lessons/sessions
POST /api/v1/courses/{id}/enroll        ← Ghi danh
GET  /api/v1/courses/lessons/{id}       ← Xem bài học cũ (backward compat)
POST /api/v1/courses/lessons/{id}/start
POST /api/v1/courses/lessons/{id}/complete
POST /api/v1/courses/lessons/{id}/video-position
GET  /api/v1/users/streak
```

## 7.3 Admin CMS — Session/Segment/Asset (MỚI V4)

```http
-- Sessions
GET    /api/v1/admin/cms/modules/{moduleId}/sessions
POST   /api/v1/admin/cms/modules/{moduleId}/sessions
GET    /api/v1/admin/cms/sessions/{id}
PUT    /api/v1/admin/cms/sessions/{id}
DELETE /api/v1/admin/cms/sessions/{id}
POST   /api/v1/admin/cms/sessions/{id}/video        ← Upload video session
POST   /api/v1/admin/cms/sessions/{id}/publish
POST   /api/v1/admin/cms/sessions/{id}/unpublish
PUT    /api/v1/admin/cms/sessions/reorder           ← Reorder sessions trong module

-- Segments
GET    /api/v1/admin/cms/sessions/{sessionId}/segments
POST   /api/v1/admin/cms/sessions/{sessionId}/segments
GET    /api/v1/admin/cms/segments/{id}
PUT    /api/v1/admin/cms/segments/{id}
DELETE /api/v1/admin/cms/segments/{id}
PUT    /api/v1/admin/cms/segments/reorder           ← Reorder segments trong session

-- Learning Assets
GET    /api/v1/admin/cms/segments/{segmentId}/assets
POST   /api/v1/admin/cms/segments/{segmentId}/assets
GET    /api/v1/admin/cms/assets/{id}
PUT    /api/v1/admin/cms/assets/{id}
DELETE /api/v1/admin/cms/assets/{id}
PUT    /api/v1/admin/cms/assets/reorder
POST   /api/v1/admin/cms/assets/{id}/upload-file    ← Upload file cho PPT/Attachment
```

## 7.4 Admin CMS — Course/Module/Lesson (giữ nguyên từ V3)

```http
-- Courses
GET    /api/v1/admin/cms/courses
POST   /api/v1/admin/cms/courses
GET    /api/v1/admin/cms/courses/{id}
PUT    /api/v1/admin/cms/courses/{id}
DELETE /api/v1/admin/cms/courses/{id}
POST   /api/v1/admin/cms/courses/{id}/submit
PUT    /api/v1/admin/cms/courses/{id}/publish
PUT    /api/v1/admin/cms/courses/{id}/hide
PUT    /api/v1/admin/cms/courses/{id}/archive
POST   /api/v1/admin/cms/courses/{id}/clone

-- Modules
GET/POST/PUT/DELETE /api/v1/admin/cms/modules/{id}
POST /api/v1/admin/cms/courses/{id}/modules

-- Lessons (cũ)
GET/POST/PUT/DELETE /api/v1/admin/cms/lessons/{id}
POST /api/v1/admin/cms/modules/{id}/lessons
POST /api/v1/admin/cms/lessons/{id}/video
```

## 7.5 Teacher Analytics (MỚI V4)

```http
GET /api/v1/teacher-dashboard/sessions/{id}/analytics
    ← viewCount, segmentDropMap, quizPassRate, avgWatchPercent, replayRate

GET /api/v1/teacher-dashboard/overview
    ← tổng học viên, courses, total views
```

## 7.6 Other Groups (không đổi từ V3)

```http
/api/v1/auth/*        /api/v1/users/*       /api/v1/media/*
/api/v1/quizzes/*     /api/v1/placement/*   /api/v1/ai/*
/api/v1/orders/*      /api/v1/analytics/*   /api/v1/superadmin/*
/api/v1/admin/users/* /api/v1/admin/roles/* /api/v1/admin/teachers/*
/api/v1/teachers/*    /api/v1/system/banners
```

---

# 8. BẢO MẬT

*(Giữ nguyên từ V2/V3 — không thay đổi)*

| Lớp bảo mật | Chi tiết |
|---|---|
| Authentication | JWT (Access 15 phút) + Refresh Token (30 ngày, rotation) |
| Media protection | Signed token (JWT, 2 giờ) cho mọi video/doc request |
| API | Rate limiting per IP + per user |
| Input | FluentValidation + parameterized queries (EF Core) |
| Tenant isolation | PostgreSQL schema separation |
| Watermark | PDF động với tên + ID học viên |
| Headers | HSTS, X-Frame-Options, CSP |

---

# 9. FRONTEND DESIGN SYSTEM

*(Giữ nguyên toàn bộ từ V3 — Color Palette, Typography, Spacing, Components)*

## 9.1 Color Palette

```
Brand Blue:     #1565C0
Brand Accent:   #FF6B35
Brand Yellow:   #FFD600
Brand Green:    #2E7D32
Brand Red:      #C62828
```

*(Xem đầy đủ trong V3 mục 9.1 → 9.8)*

## 9.2 — 9.8 Design System

*(Xem V3 mục 9.2 → 9.8 — không đổi)*

---

# 10. FRONTEND — MÀN HÌNH USER-FACING

## 10.1 → 10.11 Các màn hình cũ

*(Xem V3 mục 10.1 → 10.11 — không đổi: Homepage, Course catalog, Course detail, Dashboard, Placement Test, Profile, Purchase)*

## 10.12 MÀN HÌNH HỌC INTERACTIVE — `/learn/{sessionId}` (MỚI V4) ✅ IMPLEMENTED

> Thay thế `/hoc/[lessonId]` cho Session loại Interactive Video.
> URL cũ: `/hoc/{sessionId}` → redirect về `/learn/{sessionId}`.
> Màn hình quan trọng nhất của V4.

### Layout tổng thể

```text
[Header — 56px: Logo | Tên Session | ← Quay lại | ☰ Segments]
[Main — calc(100vh - 56px)]
  ┌──────────────────────────────────┬───────────────────┐
  │  LEFT COLUMN (flex-1)            │  RIGHT SIDEBAR    │
  │  ─────────────────────────────   │  (w-80 collapsible│
  │  [Interactive Video Player]      │                   │
  │  [Segment Timeline Bar]          │  [Segment List]   │
  │  ─────────────────────────────   │  ────────────────  │
  │  [Active Segment Panel]          │  Segment 1 ✓      │
  │    [Grammar] [Vocab] [Quiz]      │  Segment 2 ▶ ←   │
  │    [PPT] [Note] [File]           │  Segment 3        │
  │  ─────────────────────────────   │  Segment 4        │
  │  [Tab: Ghi chú | Hỏi đáp]       │  ...              │
  └──────────────────────────────────┴───────────────────┘
```

### Video Player (xem mục 11 — V4 Interactive)

### Segment Timeline Bar

```
Nằm ngay bên dưới video player
Height: 36px
Background: bg-gray-100 rounded

Timeline markers:
  Mỗi segment là một block trên timeline
  Width tỷ lệ: (endTime - startTime) / totalDuration * 100%
  
  Màu segment:
    ✓ Đã hoàn thành: bg-green-500
    ▶ Đang xem:      bg-blue-500 (pulse animation)
    ○ Chưa xem:      bg-gray-300
  
  Hover → tooltip: "Segment 2: Thanh điệu (08:10 – 14:20)"
  Click → seek video đến startTime của segment

Asset dots on timeline:
  Grammar:    🔵 dot màu blue
  Vocab:      🟣 dot màu purple
  Quiz:       🟡 dot màu yellow
  Exercise:   🟠 dot màu orange
  
  Hover dot → tooltip "Grammar: Cấu trúc SVO tại 00:05:20"
  Click dot → seek video đến timestamp asset
```

### Active Segment Panel

```
Hiển thị khi video đang ở trong 1 segment (so sánh currentTime với startTime/endTime)
Background: bg-white border-t border-gray-200 p-4

Header:
  "Phân đoạn 2: Thanh điệu tiếng Việt" (text-sm font-semibold)
  "08:10 – 14:20" (text-xs text-gray-400)
  Progress: [=======60%===] "3/5 items hoàn thành"

Asset Grid (responsive):
  desktop: 3-4 columns | mobile: 2 columns
  gap-2

Asset Card:
  ┌─────────────────┐
  │ [Icon]   [✓/○]  │
  │ GrammarBlock    │  ← type label
  │ "Cấu trúc SVO" │  ← title
  │ 00:05:20        │  ← timestamp
  └─────────────────┘
  
  Icons by type:
    GrammarBlock:    📚 bg-blue-50 border-blue-200
    VocabularyBlock: 📖 bg-purple-50 border-purple-200
    QuizBlock:       ❓ bg-yellow-50 border-yellow-200
    ExerciseBlock:   ✏️ bg-orange-50 border-orange-200
    PPTBlock:        📊 bg-teal-50 border-teal-200
    NoteBlock:       📝 bg-gray-50 border-gray-200
    FileAttachment:  📎 bg-red-50 border-red-200
  
  Click → seek video + expand detail panel
  Completed: border-green-500 bg-green-50 + ✓ checkmark
```

### Asset Detail Panel (Modal / Drawer)

```
Trigger: click asset card
Position: drawer từ phải (mobile) / modal centered (desktop)

GrammarBlock panel:
  Title: "Cấu trúc SVO trong tiếng Việt" (text-xl font-bold)
  Pattern: bg-blue-50 rounded-lg p-3 font-mono "Subject + Verb + Object"
  Examples: list với Vi + En translation
  Keywords: highlight chips
  [✓ Đã học] button → mark SegmentProgress

VocabularyBlock panel:
  Grid các từ vựng:
    Từ (text-xl font-bold) + IPA (text-gray-500)
    Nghĩa (text-blue-600 font-medium)
    [▶ Phát âm] button → play audio
    Ví dụ (text-sm italic)
    [🔖 Lưu] → bookmark word

QuizBlock panel:
  Timer (nếu có timeLimit)
  Question list với MCQ / Fill-in-blank UI
  [Nộp bài] button
  Result: ✅ Đạt / ❌ Chưa đạt + explanation

PPTBlock panel:
  Slide viewer (image carousel hoặc PDF embed)
  Slide counter "3 / 12"
  [← →] navigation
  [⬇ Tải xuống] button

NoteBlock panel:
  Teacher note: bg-yellow-50 border-l-4 border-yellow-400
  Content với highlight support

FileAttachment panel:
  File info: icon + tên + size
  [👁 Xem trực tiếp] [⬇ Tải xuống]
```

---

## 10.13 MÀN HÌNH TIẾN ĐỘ SESSION — (Sidebar)

```
Segment List Sidebar (right panel):

Header: "Nội dung buổi học"
Total: "12 segments · 90 phút"
Progress: "35% hoàn thành" + progress bar

Segment items:
  ┌──────────────────────────────────────┐
  │ ✓  Segment 1: Giới thiệu (5:00)     │ ← done, bg-green-50
  │ ▶  Segment 2: Thanh điệu (6:10)     │ ← active, bg-blue-50 border-l-2 border-blue-500
  │ ○  Segment 3: Nguyên âm (7:30)      │ ← not done
  │ ○  Segment 4: Phụ âm đầu (8:00)     │
  └──────────────────────────────────────┘

Expand segment → hiển thị asset list:
  📚 Grammar: Cấu trúc SVO    [✓ Đã học]
  📖 Vocabulary: 8 từ          [○ Chưa học]
  ❓ Quiz: 5 câu               [✓ Đạt 80%]
```

---

## 10.14 REALTIME VIDEO COMMENT — UI SPEC (Phase 2D)

> Tích hợp vào `/learn/{sessionId}` — thêm tab "Bình luận" và markers trên timeline.

### Comment Timeline Markers

```text
Segment Timeline Bar (hiện có):
|══════════█████████════════════════|
            ↑ Segment đang active

Sau khi thêm comment markers:
|══════●══█████●███●═════●══════════|
       ↑         ↑  ↑        ↑
  dot xanh lá = timestamp có comment
  Hover → tooltip nội dung comment ngắn (50 chars)
  Click → seek video + scroll đến comment đó
```

### Comment Panel Layout

```text
[Video Player                                    ]
[Segment Timeline + Comment Dots                 ]
──────────────────────────────────────────────────
TABS: [📖 Nội dung] [💬 Bình luận (12)] [📝 Ghi chú]
──────────────────────────────────────────────────
 Pinned 📌
 ┌─────────────────────────────────────────────┐
 │ Avatar  Giáo viên A  05:20                  │
 │ "Đây là cấu trúc quan trọng cần nhớ..."    │
 │ 👍 24 · Trả lời                             │
 └─────────────────────────────────────────────┘

 Tất cả bình luận (sorted by timestampSecond)
 ┌─────────────────────────────────────────────┐
 │ Avatar  Học viên B  02:14                   │
 │ "Phần này có thể giải thích rõ hơn không?" │
 │ 👍 3 · Trả lời                              │
 │   └ Avatar  GV A  "Bạn tham khảo..."       │
 └─────────────────────────────────────────────┘

 ┌─────────────────────────────────────────────┐
 │ [💬 Nhập bình luận tại 08:42...]           │
 │                               [Gửi]        │
 └─────────────────────────────────────────────┘
```

### Realtime Indicator

```text
🔴 Live — 3 người đang xem   (badge nhỏ góc phải comment panel)
```

---

## 10.15 COURSE PRICING CARDS — UI SPEC (Phase 2D)

> Hiển thị trong `/courses/[id]` bên dưới course info.

### Pricing Section Layout

```text
────────────────────────────────────────────────────────────
  CHỌN GÓI HỌC PHÙ HỢP VỚI BẠN
────────────────────────────────────────────────────────────

 ┌──────────────┐  ┌──────────────────┐  ┌──────────────┐
 │  BASIC       │  │  STANDARD ⭐     │  │  ADVANCE     │
 │              │  │  PHỔ BIẾN NHẤT  │  │  ĐẦY ĐỦ NHẤT │
 │  499.000đ    │  │  ~~999.000~~     │  │  1.499.000đ  │
 │  /3 tháng   │  │  799.000đ        │  │  /6 tháng    │
 │              │  │  /3 tháng        │  │              │
 │ ✓ Video      │  │ ✓ Tất cả Basic  │  │ ✓ Tất cả Std │
 │ ✓ Quiz       │  │ ✓ Vocabulary    │  │ ✓ Speaking AI │
 │ ✗ Vocabulary │  │ ✓ Grammar       │  │ ✓ Writing AI  │
 │ ✗ Speaking AI│  │ ✓ Bình luận RT  │  │ ✓ Teacher HT │
 │              │  │ ✗ Speaking AI   │  │              │
 │ [Mua ngay]  │  │ [Mua ngay]      │  │ [Mua ngay]   │
 └──────────────┘  └──────────────────┘  └──────────────┘
```

### Feature Gate Overlay

```text
 ┌─────────────────────────────────────┐
 │  🔒  Tính năng này yêu cầu gói     │
 │      STANDARD trở lên               │
 │                                     │
 │  ✓ Vocabulary Package               │
 │  ✓ Grammar Practice                 │
 │  ✓ Realtime Comments                │
 │                                     │
 │  [Xem gói Standard — 799.000đ]     │
 │  [Để sau]                           │
 └─────────────────────────────────────┘
```

---

# 11. VIDEO PLAYER + INTERACTIVE TIMELINE — SPEC V4

## 11.1 Container & Sizing (không đổi từ V3)

```
Container: position relative, aspectRatio 16/9, background #000, width 100%
Video: position absolute, inset 0, width/height 100%, object-fit contain
Controls overlay: opacity 0→1 on hover, auto-hide 3s khi play
```

## 11.2 HLS Setup (không đổi từ V3)

```typescript
if (src.includes('.m3u8') || src.includes('/hls/')) {
  const Hls = (await import('hls.js')).default
  if (Hls.isSupported()) {
    const hls = new Hls({ maxBufferLength: 30, enableWorker: true })
    hls.loadSource(src)
    hls.attachMedia(video)
  }
} else {
  video.src = src
}
```

## 11.3 Controls Layout (V4 — bổ sung Segment info)

```
Bottom controls: gradient overlay, absolute bottom-0

Row 0 — Segment marker line (MỚI V4):
  Thin colored overlay trên progress bar
  Các segment được tô màu khác nhau
  Asset timestamps: dots màu nhỏ

Row 1 — Progress bar (như V3)

Row 2 — Buttons:
  Left:  [⏮-10s] [▶/⏸] [⏭+10s] [🔊 Volume] [Thời gian] [Tên Segment hiện tại]
  Right: [📝 Ghi chú] [🔖 Bookmark] [⚙️ Tốc độ] [HD▼] [CC▼] [PIP] [⛶ Fullscreen]

"Tên Segment hiện tại" (MỚI V4):
  Hiển thị tên segment đang active
  Click → scroll asset panel đến segment tương ứng
  Style: text-xs bg-black/50 px-2 py-0.5 rounded text-white
```

## 11.4 Segment-aware Playback (MỚI V4)

```typescript
// Hook: useSegmentTracker
// Input: segments[], currentTime
// Output: activeSegment

const activeSegment = useMemo(() =>
  segments.find(s => currentTime >= s.startTime && currentTime < s.endTime),
  [segments, currentTime]
)

// Auto-trigger: khi sang segment mới → dispatch segmentViewed action
// Auto-trigger: khi hết video hoặc đạt 80% watch → dispatch sessionCompleted
```

## 11.5 Jump-to-Timestamp (MỚI V4)

```typescript
// Hàm được expose từ VideoPlayer context
function seekToAsset(asset: LearningAsset) {
  videoRef.current.currentTime = asset.startTime
  videoRef.current.play()
  scrollAssetPanelToSegment(asset.segmentId)
}
```

## 11.6 Features đã implement (từ V3)

| Feature | Trạng thái |
|---|---|
| Play/Pause, Seek bar | ✅ |
| Volume slider + states | ✅ |
| Speed 0.5× → 2× | ✅ |
| ±10s skip | ✅ |
| Bookmark + Notes (localStorage) | ✅ |
| Resume position | ✅ |
| Fullscreen | ✅ |
| Auto-hide controls | ✅ |
| HLS.js adaptive | ✅ |
| Quality selector (HLS levels) | ✅ |
| Picture-in-Picture | ✅ |
| Keyboard shortcuts | ✅ |

## 11.7 Features bổ sung V4 (cần implement)

| Feature | Mô tả | Priority |
|---|---|---|
| Segment Timeline Bar | Overlay trên progress bar | P0 |
| Asset timestamp dots | Dots màu trên timeline | P0 |
| Active segment indicator | Hiển thị tên segment đang xem | P0 |
| Jump-to-asset | Seek video đến timestamp asset | P0 |
| SegmentProgress tracking | Auto-mark segment khi xem qua | P1 |
| Subtitle / CC | .vtt track inject | P1 |
| Segment-end cue | Toast "Bạn vừa hoàn thành Segment 2" | P2 |
| Auto-pause at asset | Optional: pause khi đến quiz timestamp | P2 |

## 11.8 Keyboard Shortcuts (không đổi từ V3 + bổ sung)

```
Space → Play/Pause
← / → → Seek ±5s
↑ / ↓ → Volume ±10%
M → Mute toggle
F → Fullscreen
P → Picture-in-Picture
B → Bookmark
N → Ghi chú
] → Next segment (MỚI V4)
[ → Previous segment (MỚI V4)
0–9 → Seek 0%–90%
```

---

# 12. CMS EDITOR — INTERACTIVE LEARNING

## 12.1 Session Editor — `/admin/sessions/{id}`

```
Layout:
  [Header: "Session: Buổi học 1 — Thanh điệu" | [Lưu] [Publish]]
  [Left 60%: Video + Timeline Editor]
  [Right 40%: Segment List + Asset Manager]

Video area:
  [Upload video / Replace video] button nếu chưa có video
  Video preview player (mini, 16:9)
  Video info: duration, status (Pending/Processing/Ready)

Timeline Editor:
  ┌────────────────────────────────────────────────────────┐
  │ 0:00                                              90:00│
  │ [████Seg1████][███████Seg2████████][████Seg3████]      │
  └────────────────────────────────────────────────────────┘
  
  Drag handles để resize/move segments
  [+ Thêm Segment] button → tạo segment mới tại timestamp hiện tại
  Right-click segment → [Sửa] [Xóa] [Tách đôi]
  
  Validation highlight: segment overlap → đỏ, gap > 10s → warning
```

## 12.2 Segment Editor — `/admin/segments/{id}`

```
Layout:
  [Header: "Segment 2: Thanh điệu tiếng Việt" (editable inline)]
  [Sub: 08:10 – 14:20 | ⏱ 6 phút 10 giây]
  
  [Left: Mini video player với seek đến startTime]
  [Right: Asset List]
  
  Asset List:
    Drag to reorder
    [+ Thêm Grammar] [+ Thêm Vocab] [+ Thêm Quiz] [+ Thêm PPT] [+ Ghi chú] [+ File]
    
    Asset row:
      [Drag handle] [Type icon] [Title] [Timestamp] [Actions: Sửa/Xóa]
    
    Timestamp input: số giây (hoặc mm:ss format)
      → validation: phải nằm trong startTime..endTime của segment
```

## 12.3 Asset Form Modals

### GrammarBlock Form

```
Fields:
  - Title (required)
  - Grammar pattern (code-like input)
  - Examples (repeating: Vietnamese + English)
  - Keywords (tag input)
  - Timestamp (mm:ss)
```

### VocabularyBlock Form

```
Fields:
  - Timestamp (mm:ss)
  - Words (repeating):
      Word, IPA, Meaning, Example, ExampleTranslation
      [🎙 Upload audio] button per word
```

### QuizBlock Form

```
Fields:
  - Timestamp (mm:ss)
  - Pass Score (0-100)
  - Time Limit (giây, optional)
  - Questions (repeating):
      Type: MCQ | Fill-in-blank | Matching
      Question text
      Options (MCQ: 2-6 options, mark correct)
      Explanation
```

### ExerciseBlock Form

```
Fields:
  - Timestamp (mm:ss)
  - Type: Fill-in-blank | Matching | Drag-drop
  - Items (repeating): Sentence/Prompt + Answer
```

### PPTBlock Form

```
Fields:
  - Timestamp (mm:ss)
  - [Upload file: PPT/PPTX/PDF]
  - Preview images (auto-generated)
```

### NoteBlock Form

```
Fields:
  - Timestamp (mm:ss)
  - Author type: Teacher note / Student visible
  - Content (rich text, max 1000 chars)
  - Highlights (optional)
```

### FileAttachment Form

```
Fields:
  - Timestamp (mm:ss, optional)
  - [Upload file: PDF/DOCX/PPTX/XLSX/Audio/Image]
  - Display title
```

---

# 13. KẾ HOẠCH TRIỂN KHAI — PHASE PLAN V4

## Timeline tổng quan

```
Phase 0: Infrastructure & Foundation          [Tuần 1–2]      ✅ DONE
Phase 1: Auth & User Management               [Tuần 3–6]      ✅ ~95% DONE
Phase 2A: Course CMS + Video (cũ)             [Tuần 7–12]     ✅ ~95% DONE
Phase 2B: Interactive Learning Backend        [Tuần 13–16]    ✅ DONE
Phase 2C: Interactive CMS Editor              [Tuần 15–18]    ✅ DONE
Phase 2D: Realtime Comments + Course Pricing  [Tuần 19–21]    ⏳ PLANNED
Phase 3: Quiz Engine + AI Evaluation          [Tuần 21–24]
Phase 4: Commerce & Payment                   [Tuần 19–23]
Phase 5: Gamification & Analytics V4          [Tuần 21–26]
Phase 6: Chat, Support & Notification         [Tuần 24–28]
Mobile App (React Native)                     [Song song Phase 2B–5]

MVP Release: ~Tuần 23–25 (bao gồm Phase 2B + Commerce)
```

---

## PHASE 0 ✅ HOÀN THÀNH

- [x] Docker Compose: redis, rabbitmq
- [x] ASP.NET Core 10 — Clean Architecture
- [x] TenantMiddleware (X-Tenant-Slug header)
- [x] PostgreSQL schema + DatabaseInitializer
- [x] GET /health

---

## PHASE 1 — Auth & User Management ✅ ~95%

### Backend — Đã làm ✅

- [x] Đăng ký Email + BCrypt
- [x] Đăng nhập JWT + Refresh Token rotation
- [x] Google OAuth 2.0 / Device tracking
- [x] Logout / Logout all devices
- [x] Forgot password / Reset password
- [x] Email verification (verify + resend)
- [x] Avatar upload
- [x] Sessions management (GET/DELETE)
- [x] GET/PUT /api/v1/users/me
- [x] PUT /api/v1/users/me/password

### Backend — Còn thiếu

- [ ] SMS OTP via Esms.vn
- [ ] Rate limit OTP: max 3 lần/15 phút/IP

### Frontend User-facing ✅

- [x] Layout header/footer
- [x] /register + /login + Google button
- [x] Redux authSlice, RTK Query
- [x] AuthGuard HOC
- [x] /forgot-password, /reset-password, /verify-email
- [x] /settings/sessions
- [x] /profile — upload avatar, chỉnh sửa thông tin đầy đủ (name/phone/gender/address/dob)

### Frontend Admin Panel ✅

- [x] /admin/* layout — sidebar nav collapsible
- [x] /admin/users — bảng + filter + tìm kiếm + phân trang
- [x] /admin/users/[id] — user detail + edit roles
- [x] /admin/roles — danh sách roles
- [x] /admin/roles/[id] — role detail + permissions editor
- [x] AdminProfileEditModal — full profile form (gender, address, dob, currentLevel)
- [x] /admin/settings — cài đặt tenant cơ bản

---

## PHASE 2A — CMS + Video Learning ✅ ~95%

> Phase 2 cũ (V3). Đổi tên thành 2A để phân biệt với 2B/2C mới.

### Backend — Course CMS ✅

- [x] Course CRUD API đầy đủ
- [x] CourseStatus workflow (Draft → Publish → Hide → Archive)
- [x] Clone course / Submit for review
- [x] CourseLevels CRUD / LearningLevels CRUD
- [x] Module CRUD (thumbnailUrl, estimatedDuration)
- [x] Lesson CRUD (video, pdf, audio, reading types + durationMinutes)
- [x] Video upload + FFmpeg HLS transcode (Hangfire)
- [x] VideoAsset status tracking
- [x] Lesson Document upload/delete
- [x] Static file serving /media/*

### Backend — System Config ✅

- [x] BannerSlide entity + CRUD
- [x] AdminSystemController
- [x] UpgradeSchemaAsync (tự tạo bảng mới khi start)

### Backend — Teacher Marketplace ✅

- [x] TeacherProfile + TeacherFollower entities
- [x] Auto-create TeacherProfile khi gán Teacher role
- [x] GET/PUT /api/v1/admin/teachers/{userId}
- [x] GET /api/v1/teachers/{slug}, GET /{id}/courses
- [x] POST/DELETE /api/v1/teachers/{id}/follow
- [x] GetTeacherListHandler: query Users with Teacher role (✅ fix 14/05)
- [x] GetTeacherBySlugHandler: Guid fallback cho teacher không có TeacherProfile (✅ fix 14/05)

### Backend — Learning ✅

- [x] Enroll course / LessonProgress tracking
- [x] VideoTracking (resume từ vị trí cũ)
- [x] Learning streak API

### Backend — Chưa làm (Phase 2A remaining)

- [ ] Bookmark & Notes persist DB (hiện localStorage)
- [ ] Enrollment expiry + access check
- [ ] FFmpeg → 3 bitrates: 360p + 720p + 1080p
- [ ] Subtitle SRT → WebVTT pipeline
- [ ] Bulk publish/unpublish modules/lessons

### Frontend Admin CMS ✅

- [x] /admin/courses — danh sách + filter + card grid
- [x] /admin/courses/[id] — edit form đầy đủ
- [x] Course create modal (CKEditor)
- [x] Clone / Hide course buttons
- [x] /admin/modules/[id] — module detail + edit
- [x] /admin/lessons/[id] — lesson detail + video upload
- [x] /admin/lessons/[id] — tài liệu đính kèm (upload/delete)
- [x] Lesson/Module create modals
- [x] /admin/content/approvals — queue duyệt
- [x] /admin/levels — quản lý CourseLevels
- [x] Drag-drop reorder modules/lessons
- [x] Transcode status indicator (polling)
- [x] /admin/settings/banners — CRUD banner slides
- [x] /admin/teachers — danh sách giáo viên
- [x] /admin/teachers/[id] — quản lý teacher profile

### Frontend User-facing ✅

- [x] / — Homepage (social feed / discovery)
- [x] /courses — course catalog (banner carousel, pricing, level filters) ✅ _(URL mới — /khoa-hoc redirect về /courses)_
- [x] /courses/[id] — course detail (enrollment-aware, isHydrated fix) ✅ _(URL mới — /khoa-hoc/[id] redirect về /courses/[id])_
- [x] /giao-vien/[slug] — public teacher page (moon.vn style)
- [x] HlsPlayer — đầy đủ tính năng V3
- [x] Free trial lock overlay + upsell CTA
- [x] Progress bar per lesson (IsCompleted)
- [x] safeImgUrl utility (auto-resolve storage paths)

### URL Convention Migration ✅

| URL cũ (Vietnamese) | URL mới (English) | Ghi chú |
|---|---|---|
| `/khoa-hoc` | `/courses` | Redirect 301 |
| `/khoa-hoc/[id]` | `/courses/[id]` | Redirect 301 |
| `/hoc/[id]` | `/learn/[id]` | Redirect 301 |
| `/session/[id]` | `/learn/[id]` | Redirect 301 |
| `/courses/sessions/[id]` | `/learn/[id]` | Redirect 301 |

### Frontend — Chưa làm (Phase 2A remaining)

- [ ] Homepage redesign theo V3 spec (Hero carousel + featured courses)
- [ ] /hoc/[lessonId] — V3 spec lesson player kiểu cũ (sidebar syllabus, PDF/Audio/Reading)
- [ ] Subtitle/CC support (.vtt track)
- [ ] PDF viewer (iframe, ẩn download)
- [ ] Audio player component
- [x] Streak widget (calendar heatmap) ← **DONE** (StreakWidget.tsx, my-lesson COL4)
- [ ] /admin/courses/[id] — upload thumbnail file (hiện nhập URL)
- [ ] Bulk publish actions

---

## PHASE 2B — INTERACTIVE LEARNING BACKEND ✅ COMPLETED

> **Ưu tiên cao nhất — Block cho 2C và 3**
> Xây dựng toàn bộ backend cho Session/Segment/LearningAsset + Learning flow mới.

### Backend — DB & Entities

- [x] Tạo DB migration: `Sessions`, `Segments`, `LearningAssets` tables
- [x] Tạo Domain Entities: `Session`, `Segment`, `LearningAsset`
- [x] UpgradeSchemaAsync: thêm 3 bảng mới cho tenant existing
- [x] Enum: `SessionPublishStatus`, `LearningAssetType`

### Backend — Session CMS API

- [x] POST /admin/cms/modules/{id}/sessions — tạo session
- [x] GET /admin/cms/sessions/{id} — chi tiết (bao gồm segments + assets)
- [x] PUT /admin/cms/sessions/{id} — cập nhật metadata
- [x] DELETE /admin/cms/sessions/{id}
- [x] POST /admin/cms/sessions/{id}/video — upload video (reuse VideoAsset pipeline)
- [x] POST/PUT /admin/cms/sessions/reorder — reorder trong module

### Backend — Segment CMS API

- [x] POST /admin/cms/sessions/{id}/segments
- [x] GET/PUT/DELETE /admin/cms/segments/{id}
- [x] PUT /admin/cms/segments/reorder
- [x] Validation: timestamps không overlap (ConflictException), startTime >= 0 (DomainException)

### Backend — LearningAsset CMS API

- [x] POST /admin/cms/segments/{id}/assets
- [x] GET/PUT/DELETE /admin/cms/assets/{id}
- [x] PUT /admin/cms/assets/reorder
- [x] POST /admin/cms/assets/{id}/upload-file (cho PPT, FileAttachment)
- [x] Validation: asset.startTime trong segment.startTime..endTime (DomainException)
- [x] LearningAsset.EndTime: highlight range end (optional), added to entity + EF config + DDL

### Backend — Session Learning API (Student)

- [x] GET /api/v1/sessions/{id} — chi tiết session + segments + assets (filtered)
- [x] POST /api/v1/sessions/{id}/start — tạo SessionProgress
- [x] POST /api/v1/sessions/{id}/video-position — lưu vị trí resume
- [x] POST /api/v1/sessions/{id}/complete — hoàn thành (check watch % >= 80, DomainException nếu không đủ)
- [x] POST /api/v1/segments/{id}/view — mark segment viewed
- [x] POST /api/v1/segments/{id}/complete
- [x] POST /api/v1/assets/{id}/interact — ghi interaction (viewed/quiz-passed/word-saved)
- [x] GET /api/v1/assets/{id}/quiz — trả câu hỏi quiz (không trả `correct` answer)
- [x] POST /api/v1/assets/{id}/quiz/submit — nộp bài, tính điểm, ghi interaction QuizPassed/QuizFailed, trả feedback từng câu

### Backend — Module API update

- [x] Cập nhật `GET /api/v1/courses/{id}` → include Sessions (bên cạnh Lessons)
- [x] Cập nhật `GET /admin/cms/modules/{id}` → include Sessions

### Business Spec Alignment (updated_course_learning_flow_business_spec_vi)

| Nghiệp vụ (Spec) | Task phát triển | File thay đổi | Status |
|---|---|---|---|
| Asset có startTime (jump-to-timestamp) và endTime (end of highlight range) | Thêm `EndTime` property vào entity, EF config, DDL idempotent migration | `LearningAsset.cs`, `CmsConfigurations.cs`, `TenantProvisioner.cs` | ✅ |
| Segment có startTime/endTime, không overlap | Domain validation + overlap check trong handler | `Segment.cs`, `SegmentCommands.cs` | ✅ |
| Asset startTime phải nằm trong [segment.start, segment.end] | Bounds check trong CreateLearningAssetCommandHandler | `LearningAssetCommands.cs` | ✅ |
| Asset endTime không vượt quá segment.endTime | Bounds check trong Create + Update handler | `LearningAssetCommands.cs` | ✅ |
| Hoàn thành session cần watch >= 80% (spec 6.2) | Threshold check với DomainException, constant `MinWatchPercentage = 80.0` | `SessionLearningCommands.cs` | ✅ |
| Interaction type validation (spec 7.1) | Enum parse với DomainException (thay ArgumentException), liệt kê valid values | `SessionLearningCommands.cs` | ✅ |
| Duration = endTime - startTime trong response | Thêm `Duration` vào `SegmentSummaryDto`, `SegmentLearningDto` | `SessionQueries.cs`, `SessionLearningQueries.cs` | ✅ |
| Asset EndTime trong response DTO | Thêm `EndTime` vào `SegmentAssetDto` | `SessionQueries.cs`, `SessionLearningQueries.cs` | ✅ |

### Test Coverage — Phase 2B

| Test file | Số test | Nội dung |
|---|---|---|
| `Domain/SegmentTests.cs` | 7 | Domain entity validation (startTime >= 0, endTime > startTime, title trim, update) |
| `Domain/LearningAssetTests.cs` | 9 | Tất cả 7 asset types, endTime validation, metadata default, update |
| `Domain/SessionProgressTests.cs` | 4 | Create → InProgress, UpdatePosition, Complete, Complete idempotent |
| `Handlers/CreateSegmentHandlerTests.cs` | 7 | Overlap detection, adjacent OK, different sessions OK, invalid range |
| `Handlers/CreateLearningAssetHandlerTests.cs` | 7 | Bounds validation (before/after/over segment), boundary exact, invalid type, all 7 types |
| `Handlers/CompleteSessionHandlerTests.cs` | 6 | 80% threshold (exact, above, below, 79.9), no progress → NotFound, constant value |
| `Handlers/RecordInteractionHandlerTests.cs` | 7 | All valid types (theory), invalid type, empty type, multiple interactions |
| `Functional/SessionLearningFlowTests.cs` | 6 | Full flow E2E, block < 80%, resume position, DTO structure, null user, segment overlap |
| **Tổng** | **62** | **62/62 Passed ✅** |

---

## PHASE 2C — INTERACTIVE CMS EDITOR ✅ COMPLETE

> Build sau Phase 2B backend.
> Admin/Teacher CMS để tạo/chỉnh sửa Session, Segment, LearningAsset.

### Frontend Admin — Session Management

- [x] /admin/sessions/[id] — Session Editor page
      - Video upload với progress bar (XHR + FormData)
      - Visual Timeline Bar (segment blocks proportional to duration)
      - Segment list with assets, edit/delete inline
- [x] Inline segment creation: modal form với mm:ss timestamp input
- [x] Segment validation highlight: overlap → API ConflictException shown as error banner
- [x] Publish/Unpublish toggle button

### Frontend Admin — Segment Editor

- [x] /admin/segments/[id] — handled inline in Session Editor (no separate page needed)
      - Asset List per segment
      - [+ Add Asset] button per segment
- [x] Asset Forms (modal) cho từng type:
      - All 7 types: GrammarBlock, VocabularyBlock, QuizBlock, ExerciseBlock, PPTBlock, NoteBlock, FileAttachment
      - Metadata JSON textarea for type-specific data
- [x] Timestamp input với mm:ss format + validation (fmtTime/parseTime helpers)

### Frontend Admin — Integration

- [x] Cập nhật /admin/modules/[id] → tab "Sessions" và "Lessons" riêng biệt
- [x] Cập nhật /admin/courses/[id] → hiển thị sessions count trong module tree

### Frontend User-facing — Interactive Session Player ✅

- [x] /learn/[id] — Interactive Session player (V4, màn hình 10.12)
      - HLS video player (hls.js) đầy đủ tính năng
      - Segment Timeline Bar (blocks tỷ lệ duration, màu theo trạng thái)
      - Asset dots trên timeline (Grammar/Vocab/Quiz/Exercise)
      - Active Segment Panel — tự activate theo currentTime
      - 7 Asset Type Panels: NoteBlock, GrammarBlock, VocabularyBlock, QuizBlock, ExerciseBlock, PPTBlock, FileAttachment
      - Jump-to-timestamp từ asset click / segment click
      - SessionProgress + SegmentProgress tracking
      - QuizBlock: submit lên server, nhận feedback từng câu + điểm số
- [x] /session/[id] — redirect → /learn/[id]
- [x] /hoc/[id] — redirect → /learn/[id]
- [x] /courses/sessions/[id] — redirect → /learn/[id]

### TypeScript + API Layer

- [x] SessionListItem, SessionDetail, SegmentDetail, SegmentAsset interfaces
- [x] RTK Query endpoints: getSession, createSession, updateSession, deleteSession, publishSession
- [x] RTK Query endpoints: createSegment, updateSegment, deleteSegment, reorderSegments
- [x] RTK Query endpoints: createAsset, updateAsset, deleteAsset, reorderAssets
- [x] Controller DTOs updated with EndTime field
- [x] `QuizAnswerFeedback`, `QuizSubmitResult` types trong learningApi.ts
- [x] `submitQuiz` mutation + `useSubmitQuizMutation` export

---

## PHASE 2D — REALTIME COMMENTS + COURSE PRICING ⏳ PLANNED

> Hai tính năng độc lập, có thể build song song sau Phase 2C.
> UC1: Realtime Video Comment gắn với Session player.
> UC2: Course Pricing & Package — phân tầng giá 3 tier, feature entitlement.

---

### UC1: REALTIME VIDEO COMMENT SYSTEM

#### Mục tiêu nghiệp vụ

- Học viên comment theo **timestamp** khi xem video
- Click comment → video seek tới đúng giây đó
- Comment broadcast **realtime** (SignalR) tới tất cả viewer trong cùng session
- Teacher pin / highlight comment quan trọng
- Like, reply, report comment
- Tăng engagement, replay rate, collaborative learning

#### Backend — DB Schema (VideoComment)

| Field | Type | Ghi chú |
|---|---|---|
| Id | UUID | PK |
| SessionId | UUID | FK → Sessions |
| SegmentId | UUID? | FK → Segments (optional, null = không gắn segment) |
| UserId | UUID | FK → Users |
| ParentCommentId | UUID? | null = top-level comment, có giá trị = reply |
| Content | text | max 2000 chars |
| TimestampSecond | int | giây trong video |
| LikeCount | int | default 0 |
| IsPinned | boolean | default false |
| Status | enum | Active / Hidden / Reported / Deleted |
| CreatedAt | timestamptz | |

#### Backend — DB Schema (CommentReaction)

| Field | Type | Ghi chú |
|---|---|---|
| Id | UUID | PK |
| CommentId | UUID | FK → VideoComments |
| UserId | UUID | FK → Users |
| ReactionType | enum | Like / Dislike |

#### Backend — API Endpoints

| Method | Route | Auth | Mô tả |
|---|---|---|---|
| POST | /api/v1/sessions/{id}/comments | User | Tạo comment (content, timestampSecond, parentCommentId?) |
| GET | /api/v1/sessions/{id}/comments | Public | Danh sách comment (paginated, filter theo timestamp range) |
| PUT | /api/v1/comments/{id} | Owner | Sửa comment |
| DELETE | /api/v1/comments/{id} | Owner/Admin | Xóa comment |
| POST | /api/v1/comments/{id}/like | User | Toggle like |
| POST | /api/v1/comments/{id}/pin | Teacher/Admin | Pin/Unpin |
| POST | /api/v1/comments/{id}/report | User | Report vi phạm |

#### Backend — SignalR Hub

**Hub class:** `VideoCommentHub`  
**Route:** `/hubs/video-comments`

**Client → Server methods:**
```text
JoinVideoRoom(sessionId)   — join group khi mở session player
LeaveVideoRoom(sessionId)  — leave group khi đóng
```

**Server → Client events:**

| Event | Payload | Khi nào |
|---|---|---|
| `CommentCreated` | CommentDto | Sau khi tạo comment thành công |
| `CommentUpdated` | CommentDto | Sau khi sửa content |
| `CommentDeleted` | `{ commentId }` | Sau khi xóa |
| `CommentLiked` | `{ commentId, likeCount }` | Sau khi like/unlike |
| `CommentPinned` | `{ commentId, isPinned }` | Sau khi pin/unpin |

**Scale-out:** Redis Pub/Sub channel `video-comments:{sessionId}` (cho multi-instance)

#### Backend — Implementation Tasks

- [ ] Tạo entities: `VideoComment`, `CommentReaction` + EF config + DDL idempotent
- [ ] UpgradeSchemaAsync: thêm 2 bảng mới
- [ ] `SessionCommentController` — 7 endpoints trên
- [ ] `VideoCommentHub` (SignalR) — Join/Leave room, 5 events
- [ ] Redis Pub/Sub adapter cho SignalR scale-out
- [ ] Anti-spam: rate limit 5 comments/min/user
- [ ] CQRS handlers: CreateComment, UpdateComment, DeleteComment, ToggleLike, PinComment, ReportComment
- [ ] Query handler: GetSessionComments (cursor-based pagination)

#### Frontend — Session Player (/learn/[id])

- [ ] Tab "Bình luận" trong session player (sidebar / tab bên cạnh "Ghi chú")
- [ ] Comment input: textarea + nút "Gửi", auto-fill `timestampSecond` từ `currentTime`
- [ ] Hiển thị timestamp badge (vd: `05:20`) bên cạnh mỗi comment
- [ ] Click timestamp badge → seek video tới giây đó
- [ ] Timeline markers: ● dots màu xanh lá trên Segment Timeline Bar
- [ ] Hover dot → tooltip nội dung comment ngắn
- [ ] Reply thread (2 cấp: comment + reply, không lồng thêm)
- [ ] Like button + like count
- [ ] Realtime: `useVideoComments` hook — SignalR join/leave + append events
- [ ] Pinned comments nổi lên đầu danh sách (badge 📌)
- [ ] Load more (cursor-based, 20 comments/page)

#### Frontend — Admin/Teacher

- [ ] /admin/sessions/[id] → tab "Bình luận" — danh sách + moderate
- [ ] Pin / Unpin / Delete comment từ admin
- [ ] /admin/content/reports — report queue (filter theo type=comment)

---

### UC2: COURSE PRICING & PACKAGE SYSTEM

#### Mục tiêu nghiệp vụ

- Mỗi khóa học có thể có 1–3 package: **Basic / Standard / Advance**
- Mỗi package có giá gốc, giá sale, thời hạn, danh sách feature entitlement
- Học viên mua 1 package → tạo `StudentPackage` (entitlement record)
- Khi truy cập feature bị lock → popup upsell đúng tier cần upgrade
- Admin/Teacher quản lý packages trong CMS

#### Package Feature Mapping

| Feature Code | Basic | Standard | Advance |
|---|---|---|---|
| `video_learning` | ✓ | ✓ | ✓ |
| `basic_quiz` | ✓ | ✓ | ✓ |
| `vocabulary_package` | ✗ | ✓ | ✓ |
| `grammar_practice` | ✗ | ✓ | ✓ |
| `realtime_comments` | ✗ | ✓ | ✓ |
| `speaking_ai` | ✗ | ✗ | ✓ |
| `writing_ai` | ✗ | ✗ | ✓ |
| `teacher_support` | ✗ | ✗ | ✓ |

#### Backend — DB Schema (CoursePackage)

| Field | Type | Ghi chú |
|---|---|---|
| Id | UUID | PK |
| CourseId | UUID | FK → Courses |
| PackageType | enum | Basic / Standard / Advance |
| Title | varchar(200) | |
| Description | text | |
| OriginalPrice | decimal(18,2) | |
| SalePrice | decimal(18,2) | 0 = không giảm giá |
| DurationDay | int | 0 = lifetime |
| Status | enum | Active / Draft / Archived |

#### Backend — DB Schema (PackageEntitlement)

| Field | Type | Ghi chú |
|---|---|---|
| Id | UUID | PK |
| PackageId | UUID | FK → CoursePackages |
| FeatureCode | varchar(100) | e.g. `vocabulary_package`, `speaking_ai` |
| Enabled | boolean | |

#### Backend — DB Schema (StudentPackage)

| Field | Type | Ghi chú |
|---|---|---|
| Id | UUID | PK |
| StudentId | UUID | FK → Users |
| PackageId | UUID | FK → CoursePackages |
| StartDate | timestamptz | |
| ExpiredDate | timestamptz? | null = lifetime |
| Status | enum | Active / Expired / Cancelled |

#### Backend — API Endpoints

| Method | Route | Auth | Mô tả |
|---|---|---|---|
| GET | /api/v1/courses/{id}/packages | Public | Danh sách packages của khóa học (incl. entitlements) |
| GET | /api/v1/packages/access?featureCode=xxx&courseId=yyy | User | Kiểm tra quyền truy cập 1 feature |
| POST | /api/v1/packages/purchase | User | Mua package (mock, tích hợp payment Phase 4) |
| POST | /api/v1/packages/upgrade | User | Nâng cấp lên tier cao hơn (tính diff price) |
| GET | /api/v1/users/me/packages | User | Danh sách packages đang active của học viên |
| GET | /admin/cms/courses/{id}/packages | Admin | CMS: list packages |
| POST | /admin/cms/courses/{id}/packages | Admin | CMS: tạo package |
| PUT | /admin/cms/packages/{id} | Admin | CMS: sửa package |
| DELETE | /admin/cms/packages/{id} | Admin | CMS: xóa (chỉ Draft) |
| PUT | /admin/cms/packages/{id}/entitlements | Admin | CMS: cập nhật feature entitlements |

#### Backend — Implementation Tasks

- [ ] Tạo entities: `CoursePackage`, `PackageEntitlement`, `StudentPackage` + EF config + DDL idempotent
- [ ] UpgradeSchemaAsync: thêm 3 bảng mới
- [ ] CQRS handlers: CreatePackage, UpdatePackage, DeletePackage, SetEntitlements
- [ ] Query handlers: GetCoursePackages (public), GetMyPackages, CheckFeatureAccess
- [ ] PurchasePackageHandler: tạo StudentPackage, check không mua trùng
- [ ] UpgradePackageHandler: cancel gói cũ + tạo gói mới (tính tiền thừa — stub cho Phase 4)
- [ ] Background job: expire StudentPackage quá hạn (Hangfire daily)
- [ ] `CoursePackagesController` + `AdminPackagesController` — các endpoints trên

#### Frontend — /courses/[id] — Pricing Section

- [ ] Hiển thị pricing cards (1–3 tier) bên dưới course info
- [ ] Mỗi card: title, originalPrice (gạch), salePrice, thời hạn, feature list ✓/✗
- [ ] Badge "Phổ biến nhất" cho Standard, "Đầy đủ nhất" cho Advance
- [ ] Highlight card được khuyến nghị (outline + màu nổi)
- [ ] "Mua ngay" button → checkout modal (mock payment, real Phase 4)
- [ ] Nếu đã mua: hiển thị "Đã sở hữu" + ngày hết hạn

#### Frontend — Session Player — Feature Gate

- [ ] `useFeatureAccess(featureCode, courseId)` hook — gọi API validate, cache kết quả
- [ ] `<FeatureGateOverlay>` component — hiển thị khi feature bị lock
- [ ] Overlay: mô tả feature, package cần có, nút "Nâng cấp"
- [ ] Áp dụng cho: VocabularyBlock, GrammarBlock (Standard+), SpeakingBlock (Advance)

#### Frontend — Admin CMS

- [ ] /admin/courses/[id] → tab mới "Packages" — CRUD packages
- [ ] `PackageForm`: packageType, title, originalPrice, salePrice, durationDay
- [ ] Entitlement editor: checklist features per package (toggle on/off)
- [ ] Preview pricing card ngay trong form

---

## PHASE 3 — Quiz Engine + AI

### AI Service (Python FastAPI)

- [ ] POST /speaking/evaluate (GPT-4o Audio)
- [ ] POST /writing/evaluate (GPT-4o mini)
- [ ] Redis rate limiter / Cost logging

### Backend — Standalone Quiz Engine (Placement Test + Exit Test)

- [ ] Question Bank CRUD
- [ ] Quiz Builder API
- [ ] Quiz Attempt Engine (start/answer/submit)
- [ ] RabbitMQ consumer AI evaluation
- [ ] Placement Test level assignment

### Frontend — Placement Test

- [ ] /placement-test — 4-step flow (Listening/Reading/Speaking/Writing)
- [ ] Speaking recorder (MediaRecorder API)
- [ ] "Đang chấm..." polling UI
- [ ] Result: radar chart + level recommendation

### Frontend — Interactive Video V4 ✅ DONE (Phase 2C)

- [x] /learn/{sessionId} — Interactive Session player (màn hình 10.12) ✅ _(URL: /hoc → /learn)_
- [x] Segment Timeline Bar (overlay trên progress bar)
- [x] Asset dots trên timeline
- [x] Active Segment Panel (asset grid)
- [x] Asset Detail Panels (Grammar/Vocab/Quiz/PPT/Note/File/Exercise)
- [x] SessionProgress + SegmentProgress tracking
- [x] Jump-to-timestamp từ asset click
- [x] Segment-aware active state
- [x] Quiz submit server-side + feedback display

---

## PHASE 4 — Commerce & Payment

### Backend

- [ ] Product catalog + pricing rules
- [ ] Cart + Checkout API
- [ ] VNPay + MoMo + Stripe integration
- [ ] Post-payment: enrollment + invoice PDF
- [ ] Coupon engine

### Frontend

- [ ] /mua-hang — 3-tier pricing (V3 spec)
- [ ] Cart widget + coupon input
- [ ] Checkout → redirect gateway
- [ ] Payment success page
- [ ] Order history

---

## PHASE 5 — Analytics V4 + Gamification

### Backend

- [ ] Event collector (RabbitMQ consumer)
- [ ] Segment-level analytics: drop rate, replay rate, quiz fail rate
- [ ] LearningAsset interaction aggregation
- [ ] Teacher dashboard analytics API
- [ ] Points + Badges + Leaderboard engine
- [ ] Student skill snapshot (radar chart data)

### Frontend

- [ ] /dashboard — V3 spec (radar chart, streak calendar, progress)
- [ ] Teacher Analytics Dashboard: segment heatmap, drop visualization
- [ ] Gamification UI: points, badges, rank display
- [ ] /leaderboard
- [ ] Admin Analytics dashboard

---

## PHASE 6 — Chat & Notifications

### Backend

- [ ] Q&A comments API (Session-level)
- [ ] SignalR chat hub
- [ ] FCM push notifications
- [ ] Notification CRUD

### Frontend

- [ ] Q&A section trong Session player (tab Hỏi đáp — mục 10.12)
- [ ] Notification bell + dropdown
- [ ] Chat widget
- [ ] /admin/notifications/broadcast

---

## MOBILE APP (React Native — Song song Phase 2B–5)

**Giai đoạn 1:** Auth + Course list + Interactive Video + Session/Segment + Progress
**Giai đoạn 2:** Commerce + Push notifications + Gamification

**V4 mobile-specific:**
- Vertical learning layout cho Segment Panel
- Swipe gesture để chuyển segment
- Mini player khi scroll xuống asset panel
- Offline cache cho vocabulary audio

---

# 14. KHÔNG LÀM TRONG MVP

| Feature | Lý do defer |
|---|---|
| ❌ Moodle integration | Loại bỏ hoàn toàn |
| ❌ ML-based recommendation | Cần data → rule-based v1 trước |
| ❌ Adaptive testing (IRT) | Phức tạp |
| ❌ Offline video (mobile) | DRM phức tạp |
| ❌ Livestream tự build | Dùng Zoom/YouTube embed |
| ❌ MinIO / S3 migration | Local disk đủ MVP |
| ❌ Bán sản phẩm vật lý | Ngoài scope |
| ❌ Multi-language UI | Vietnamese-first |
| ❌ Dark mode toàn site | Chỉ dark cho video player |
| ❌ Social login ngoài Google | Chỉ Google + Email |
| ❌ Flashcard spaced repetition (Anki-like) | Phase 3+ sau MVP |
| ❌ AI auto-generate segments từ video | Phức tạp, cần Whisper + GPT |
| ❌ Auto-generate quiz từ Grammar block | AI feature, sau Phase 5 |
| ❌ Collaborative note-taking | Phase 6+ |

---

# 15. ADMIN PANEL DESIGN STANDARDS

*(Giữ nguyên từ V3 — không đổi)*

## 15.1 Shared Components

### AdminPagination
`src/app/admin/_components/AdminPagination.tsx`

Props: `{ page, totalPages, totalCount, pageSize, onPageChange }`
- Counter rom–to / total bên trái
- Sliding window page buttons (±2 từ trang hiện tại)
- Prev/Next arrows
- Dùng trong: /admin/users, /admin/courses, tất cả list pages

### ActionButtons
`src/app/admin/_components/ActionButtons.tsx`

Props: `{ viewHref?, editHref?, onEdit?, onDelete?, canDelete? }`
- **Xem**: gray border + eye icon
- **Sửa**: indigo bg + pencil icon
- **Xóa**: red bg + trash icon (ẩn khi canDelete=false)

### ImageUpload
`src/components/ImageUpload.tsx`

Props: `{ value, onChange, uploadFn, shape, className, placeholder, disabled }`
- Preview với hover "Đổi ảnh"
- Upload spinner / error state
- Dùng trong: /admin/users, /profile, /admin/teachers/[id]
- Tích hợp safeImgUrl để resolve storage paths

### AdminProfileEditModal
`src/app/admin/_components/AdminProfileEditModal.tsx`

Props: `{ userId, userRole, onClose, onSaved? }`
- Fetch đầy đủ user detail nội bộ
- Fields: avatar, họ tên, SĐT, ngày sinh, giới tính, địa chỉ, trình độ

## 15.2 Button Color Convention

| Action | Background | Border | Text |
|--------|-----------|--------|------|
| View (Xem) | white | gray-300 | gray-600 |
| Edit (Sửa) | indigo-600 | indigo-600 | white |
| Delete (Xóa) | red-600 | red-600 | white |

## 15.3 Image Upload API Endpoints

| Endpoint | Purpose | Auth |
|---|---|---|
| POST /api/v1/users/me/avatar | Upload avatar (Student/Teacher) | User |
| POST /api/v1/admin/users/{id}/avatar | Upload avatar (Admin) | Admin |
| POST /api/v1/admin/teachers/{id}/avatar | Upload teacher avatar | Admin |
| POST /api/v1/admin/cms/sessions/{id}/video | Upload session video | Admin |
| POST /api/v1/admin/cms/assets/{id}/upload-file | Upload asset file (PPT/audio) | Admin |

## 15.4 safeImgUrl Utility

`src/lib/utils.ts`

```typescript
const _MEDIA_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5009") + "/media";

export function safeImgUrl(url: string | null | undefined): string | null {
  if (!url || url.startsWith("blob:")) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${_MEDIA_BASE}/${url.replace(/^\/+/, "")}`;
}
```

Dùng trong mọi `<img>` tag hiển thị ảnh từ storage backend.

---

> **Ghi chú V4.2 (19/05/2026):**
> - Phase 2D (Realtime Comments + Course Pricing) ⏳ PLANNED
>   - UC1: Realtime Video Comment — SignalR hub, timestamp-linked comments, timeline markers
>   - UC2: Course Pricing — 3-tier Basic/Standard/Advance, feature entitlement, Feature Gate overlay
> - Phase 2B (Interactive Learning Backend) ✅ HOÀN THÀNH — bao gồm quiz API
> - Phase 2C (CMS Editor + Interactive Frontend Player) ✅ HOÀN THÀNH
> - **URL Convention đã đổi sang tiếng Anh:** `/khoa-hoc` → `/courses`, `/hoc` → `/learn`
>   - Legacy URLs (Vietnamese) vẫn hoạt động qua redirect 301
>   - Mọi nav link, course card, header đã cập nhật về URL mới
> - Lesson cũ (PDF/Audio/Reading) vẫn được giữ, không xóa — backward compatible
> - Mọi thay đổi DB cần cập nhật `UpgradeSchemaAsync` để tenant hiện hữu tự migrate
> - JSONB metadata cho LearningAsset là key design decision — linh hoạt nhưng cần document type schema rõ ràng
