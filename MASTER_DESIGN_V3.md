# MLS — MASTER DESIGN DOCUMENT V3

> **File duy nhất** tổng hợp kiến trúc, quyết định thiết kế và kế hoạch triển khai.
> Mọi thay đổi hướng đi cập nhật tại đây.
>
> Version: 3.0 — Ngày cập nhật: 11/05/2026
>
> **🔄 V3 Thay đổi chính so với V2:**
> - **Backend / Architecture / DB / API / Security / Phase 0–6:** Giữ nguyên từ V2
> - **Frontend User-facing:** Redesign toàn bộ, tham chiếu moon.vn UX/UI
>   - Thêm Homepage, Dashboard, Social feed
>   - Video player: bổ sung PIP, quality selector (360p/720p/1080p), subtitle
>   - Design system chi tiết (màu sắc, typography, spacing, component library)
>   - Spec từng màn hình với layout, component, behavior đầy đủ

---

# MỤC LỤC

1. [Tổng quan hệ thống](#1-tổng-quan-hệ-thống)
2. [Quyết định kiến trúc đã chốt](#2-quyết-định-kiến-trúc-đã-chốt)
3. [Tech stack](#3-tech-stack)
4. [Chiến lược lưu trữ & bảo vệ nội dung](#4-chiến-lược-lưu-trữ--bảo-vệ-nội-dung)
5. [Module breakdown](#5-module-breakdown)
6. [Database schema](#6-database-schema)
7. [API design](#7-api-design)
8. [Bảo mật](#8-bảo-mật)
9. [**Frontend Design System (MỚI V3)**](#9-frontend-design-system-mới-v3)
10. [**Frontend — Màn hình User-facing (MỚI V3)**](#10-frontend--màn-hình-user-facing-mới-v3)
11. [**Video Player — Spec đầy đủ (MỚI V3)**](#11-video-player--spec-đầy-đủ-mới-v3)
12. [Kế hoạch triển khai](#12-kế-hoạch-triển-khai)
13. [Không làm trong MVP](#13-không-làm-trong-mvp)

---

# 1. TỔNG QUAN HỆ THỐNG

## 1.1 Mục tiêu sản phẩm

Nền tảng học tiếng Việt trực tuyến toàn diện (dành cho người nước ngoài / Việt kiều / người học tiếng Việt như ngôn ngữ thứ hai):

- Học viên đăng ký → làm Placement Test → xếp Level 1–6
- Học video bài giảng theo lộ trình có cấu trúc
- Mini test sau mỗi bài, Exit test cuối mỗi Level
- AI chấm Speaking & Writing
- Mua khóa học theo level / combo / full
- Chỉ bán **giáo trình bản mềm** (PDF, Audio, Ebook)
- Nhận chứng chỉ sau khi hoàn thành Level
- Gamification: điểm, huy hiệu, bảng xếp hạng
- Hỗ trợ **multi-tenant**: nhiều trung tâm dùng chung nền tảng

## 1.2 Kiến trúc tổng thể

```text
                ┌─────────────────────────────────┐
                │   ReactJS Web (NextJS)           │
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

## 1.3 Các thành phần tự xây dựng

| Thành phần | Mô tả |
|---|---|
| **Custom CMS** | Course / Module / Lesson CRUD trong MLS Admin Panel |
| **Custom Quiz Engine** | Question Bank, Quiz Builder, MCQ auto-grade, AI Speaking/Writing |
| **Video Pipeline** | Upload → FFmpeg HLS transcode → Signed token streaming |
| **Auth & RBAC** | JWT + Refresh Token, Google OAuth, OTP, device management |
| **Commerce** | VNPay / MoMo / Stripe / Chuyển khoản, enrollment tự động |
| **AI Service** | Python FastAPI gọi GPT-4o Audio (Speaking) + GPT-4o mini (Writing) |
| **Gamification** | Points, Badges, Leaderboard, Streak — custom logic |
| **Analytics** | Event-driven, RabbitMQ consumer, Dashboard |
| **Certificate** | PDF generation + QR verify public page |
| **Communication** | Q&A, SignalR chat, FCM push, Email (SendGrid) |

---

# 2. QUYẾT ĐỊNH KIẾN TRÚC ĐÃ CHỐT

## 2.1 Multi-tenant — Schema-per-tenant (PostgreSQL)

```text
postgres
├── schema: public           ← Shared: Tenants, Plans, GlobalConfig
├── schema: tenant_abc       ← Trung tâm ABC (Users, Courses, Orders...)
├── schema: tenant_xyz       ← Trung tâm XYZ
└── schema: analytics        ← Cross-tenant analytics (aggregated only)
```

**Cơ chế hoạt động:**
- Request đến `abc.viet-study.vn` → `TenantMiddleware` resolve → `tenant_id = "abc"`
- JWT claims chứa `tenant_id`
- `DbContext` tự động set `search_path = tenant_abc`
- Migration runner chạy cho tất cả tenant schemas khi deploy

## 2.2 Content Management Permissions

| Quyền | Admin | ContentManager | Teacher thường |
|---|---|---|---|
| Tạo course | ✅ | ✅ | ❌ |
| Upload video / tài liệu | ✅ | ✅ | ❌ |
| Edit course của mình | ✅ | ✅ | ❌ |
| Publish course | ✅ | ❌ — cần Admin approve | ❌ |
| Quản lý question bank | ✅ | ✅ (của mình) | ❌ |

## 2.3 ❌ Loại bỏ Moodle — Xây dựng Custom CMS + Quiz Engine

> **Quyết định ngày 07/06/2025:** Loại bỏ Moodle hoàn toàn. Custom CMS + Quiz Engine nằm hoàn toàn trong .NET API + PostgreSQL.

## 2.4 AI Scoring — OpenAI

- Speaking: **GPT-4o Audio** (~$0.006/phút audio)
- Writing: **GPT-4o mini** (rẻ hơn 15×)
- Ước tính cost: **~$0.14/học viên/tháng**

## 2.5 Payment

| Phương thức | Giải pháp | Ghi chú |
|---|---|---|
| QR ngân hàng | VNPay QR | Phổ biến nhất VN |
| Ví điện tử | MoMo | Đồng thời với VNPay |
| Thẻ quốc tế | Stripe | Visa/Mastercard |
| Chuyển khoản | Admin xác nhận thủ công | Fallback |

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

## Frontend Web

| Component | Công nghệ |
|---|---|
| Framework | NextJS 15 (App Router) |
| UI | Tailwind CSS v4 + shadcn/ui |
| Animation | Framer Motion |
| State | Redux Toolkit + RTK Query |
| Video Player | HLS.js 1.4+ (custom player) |
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

## 4.1 Cấu trúc thư mục trên server

```text
/var/app/media/
├── {tenant_slug}/
│   ├── videos/
│   │   └── {lesson_id}/
│   │       ├── raw/
│   │       ├── hls/
│   │       │   ├── master.m3u8
│   │       │   ├── 360p/
│   │       │   ├── 720p/
│   │       │   └── 1080p/
│   │       └── thumbnail.jpg
│   ├── docs/
│   ├── audio/
│   ├── speaking/
│   ├── avatars/
│   └── certificates/
```

## 4.2 Video Pipeline

**Upload:** Admin → `raw/` → Hangfire FFmpeg job → HLS segments → DB status = READY

**Playback:** Student → API kiểm tra enrolled → Signed JWT token (2h) → HLS.js stream

**Bảo vệ:**
- Không URL trực tiếp đến file
- Token hết hạn 2h, gắn với user_id + lesson_id
- HLS segmented — không download được file hoàn chỉnh
- Frontend custom player ẩn toàn bộ controls native

## 4.3 PDF Protection

```text
Stream inline + Watermark động: "Tài liệu của [Họ tên] — [UserID] — [Ngày]"
Headers: Content-Disposition: inline, Cache-Control: no-store
```

---

# 5. MODULE BREAKDOWN

## MODULE 1 — Auth & User Management
*(Xem Phase 1)*

## MODULE 2 — Course Management (Custom CMS)

### 2.1 Cấu trúc nội dung

```text
Course
 ├── CourseModule
 │    ├── Lesson (Video / Reading / Audio / PDF / Quiz / Assignment / Live)
 │    └── ...
 └── CourseEnrollment
```

### 2.2 Course Entity — Fields

| Field | Type | Mô tả |
|---|---|---|
| id | UUID | Mã khóa học |
| slug | String | URL-friendly, duy nhất |
| title | String | Tên khóa học |
| shortDescription | String | Mô tả ngắn (dùng cho card) |
| description | HTML | Nội dung giới thiệu đầy đủ |
| thumbnailUrl | String | Ảnh đại diện |
| level | Int 1–6 | Cấp độ |
| status | Enum | Draft / PendingReview / Published / Hidden / Archived |
| visibility | Enum | Public / Private |
| isFree | Boolean | Khóa học miễn phí |
| price | Decimal | Giá gốc |
| discountPrice | Decimal? | Giá khuyến mãi |
| discountEndsAt | DateTime? | Hết hạn giảm giá |
| certificateEnabled | Boolean | Cấp chứng chỉ sau hoàn thành |
| teacherId | UUID? | Giáo viên phụ trách |
| createdBy | UUID | Người tạo |
| publishedAt | DateTime? | Ngày publish |

### 2.3 Publish Workflow

```text
Draft → PendingReview → Published → Hidden → Archived
  ↑                          |
  └──── Reject ←────────────┘
```

| Transition | Actor | API |
|---|---|---|
| Draft → PendingReview | ContentManager/Teacher | POST /submit |
| PendingReview → Published | Admin/SuperAdmin | PUT /publish?approve=true |
| PendingReview → Draft | Admin/SuperAdmin | PUT /publish?approve=false |
| Published → Hidden | Admin/SuperAdmin | PUT /hide |
| Any → Archived | Admin/SuperAdmin | PUT /archive |

### 2.4 Lesson Types

| Type | Mô tả |
|---|---|
| Video | Bài học video HLS |
| Reading | Nội dung text/HTML |
| Audio | File âm thanh |
| Pdf | Tài liệu PDF |
| Quiz | Bài kiểm tra inline |
| Assignment | Bài tập nộp |
| Live | Livestream |

### 2.5 Lesson Completion Rules

| Rule | Mô tả |
|---|---|
| ViewLesson | Chỉ cần mở bài là coi là xong |
| WatchPercentage | Xem ít nhất X% video |
| PassQuiz | Đạt điểm passScore |
| SubmitAssignment | Nộp bài tập |

### 2.6 Clone Course

Chức năng clone sao chép toàn bộ: modules + lessons + cấu trúc (không copy video asset).
Course clone có status = Draft.

## MODULE 3 — Video Learning
*(Chi tiết tại mục 11 — Video Player Spec)*

## MODULE 4 — Placement Test
*(Phase 3)*

## MODULE 5 — Quiz Engine

### Question Types
MultipleChoice / MultipleAnswer / FillInBlank / Matching / Ordering / Essay / AudioAnswer

### Quiz Attempt Fields
- startedAt, finishedAt, totalScore, isPassed, attemptNumber, answers[]

## MODULE 6 — Commerce & Payment *(Phase 4)*
## MODULE 7 — Certificate *(Phase 4)*
## MODULE 8 — Analytics *(Phase 5)*
## MODULE 9 — Gamification *(Phase 5)*
## MODULE 10 — AI Recommendation *(Phase 5)*
## MODULE 11 — Support & Communication *(Phase 6)*

---

# 6. DATABASE SCHEMA

## Auth
- **Users**: Id, Email, Phone, PasswordHash, GoogleId, Status
- **UserProfiles**: Id, UserId, FullName, AvatarUrl, DateOfBirth, CurrentLevel
- **Roles**: Id, Name, Description, Permissions (jsonb)
- **UserRoles**: UserId + RoleId (composite PK)
- **RefreshTokens**: Id, UserId, TokenHash, DeviceId, ExpiresAt, RevokedAt
- **OtpVerifications**: Id, Target, CodeHash, Type, ExpiresAt, UsedAt

## Content (CMS)
```
Courses
  Id, Slug, Title, ShortDescription, Description
  Level, ThumbnailUrl
  Status (Draft|PendingReview|Published|Hidden|Archived)
  Visibility (Public|Private)
  IsFree, Price, DiscountPrice, DiscountEndsAt
  CertificateEnabled
  TeacherId, CreatedBy, PublishedAt

CourseModules
  Id, CourseId, Title, Description, OrderIndex, IsLocked

Lessons
  Id, ModuleId, LessonType (Video|Reading|Audio|Pdf|Quiz|Assignment|Live)
  Title, Description, Content (HTML)
  OrderIndex, IsFreeTrial, PassScore

VideoAssets
  Id, LessonId, Status, HlsPath, ThumbnailUrl
  DurationSeconds, SizeBytes, OriginalFileName

LessonDocuments
  Id, LessonId, Type, Title, FileUrl, SizeBytes, IsProtected, OrderIndex
```

## Learning
```
CourseEnrollments
  Id, UserId, CourseId, EnrolledAt, ExpiresAt
  Source (Payment|Admin|Free|Coupon), OrderId

LessonProgresses
  Id, UserId, LessonId, Status, Score, CompletedAt

VideoTracking
  Id, UserId, LessonId
  PositionSeconds, DurationSeconds
  LastUpdatedAt
  UNIQUE(UserId, LessonId)
```

## Quiz *(Phase 3)*
- Questions, Quizzes, QuizAttempts, QuizAttemptAnswers

## Commerce *(Phase 4)*
- Products, Orders, Payments, Invoices, Coupons

## Gamification *(Phase 5)*
- Points, Badges, UserBadges, Leaderboards

## Analytics *(Phase 5)*
- LearningEvents, AnalyticsSnapshots

## Communication *(Phase 6)*
- Comments, Notifications, LivestreamSchedules

---

# 7. API DESIGN

## 7.1 Public Course Catalog

```
GET  /api/v1/courses                    ← Danh sách (filter: level, search, page)
GET  /api/v1/courses/{id}               ← Chi tiết + modules/lessons
POST /api/v1/courses/{id}/enroll        ← Ghi danh (auth required)
GET  /api/v1/courses/lessons/{id}       ← Xem bài học (auth optional)
POST /api/v1/courses/lessons/{id}/start ← Bắt đầu học
POST /api/v1/courses/lessons/{id}/complete ← Hoàn thành bài
POST /api/v1/courses/lessons/{id}/video-position ← Lưu vị trí video
GET  /api/v1/users/streak               ← Learning streak của user hiện tại
```

## 7.2 Admin CMS

```
-- Courses
GET    /api/v1/admin/cms/courses              ← List + filter + search
GET    /api/v1/admin/cms/courses/{id}         ← Chi tiết
POST   /api/v1/admin/cms/courses              ← Tạo mới
PUT    /api/v1/admin/cms/courses/{id}         ← Cập nhật
DELETE /api/v1/admin/cms/courses/{id}         ← Xóa
POST   /api/v1/admin/cms/courses/{id}/submit  ← Submit for review
PUT    /api/v1/admin/cms/courses/{id}/publish ← Approve/Reject
PUT    /api/v1/admin/cms/courses/{id}/hide    ← Ẩn (Published → Hidden)
PUT    /api/v1/admin/cms/courses/{id}/archive ← Lưu trữ
POST   /api/v1/admin/cms/courses/{id}/clone   ← Clone khóa học

-- Modules
GET    /api/v1/admin/cms/modules/{id}
POST   /api/v1/admin/cms/courses/{id}/modules
PUT    /api/v1/admin/cms/modules/{id}
DELETE /api/v1/admin/cms/modules/{id}

-- Lessons
GET    /api/v1/admin/cms/lessons/{id}
POST   /api/v1/admin/cms/modules/{id}/lessons
PUT    /api/v1/admin/cms/lessons/{id}
DELETE /api/v1/admin/cms/lessons/{id}
POST   /api/v1/admin/cms/lessons/{id}/video   ← Upload video (multipart, 2GB)

-- Content Approval Queue
GET    /api/v1/admin/cms/content/approvals
```

## 7.3 Other Groups

```
/api/v1/auth/*        /api/v1/users/*       /api/v1/media/*
/api/v1/quizzes/*     /api/v1/placement/*   /api/v1/ai/*
/api/v1/orders/*      /api/v1/analytics/*   /api/v1/superadmin/*
```

---

# 8. BẢO MẬT

*(Giữ nguyên từ V2 — không thay đổi)*

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

# 9. FRONTEND DESIGN SYSTEM (MỚI V3)

> Tham chiếu: moon.vn — nền tảng học thi THPT hàng đầu Việt Nam.
> MLS áp dụng các pattern UX/UI tương tự cho nền tảng học tiếng Việt.

## 9.1 Color Palette

### Primary Brand

```
Brand Blue:     #1565C0  ← Màu chủ đạo (header, CTA, active state)
Brand Blue Light: #1976D2
Brand Blue Dark:  #0D47A1
Brand Accent:   #FF6B35  ← Cam — price, badge nổi bật, CTA phụ
Brand Yellow:   #FFD600  ← Bookmark, star rating, streak
Brand Green:    #2E7D32  ← Trạng thái hoàn thành, passed
Brand Red:      #C62828  ← Khuyến mãi, discount, deadline
```

### Neutral

```
Gray 950:  #0A0A0A   ← Video player background
Gray 900:  #111827   ← Sidebar player
Gray 800:  #1F2937   ← Dark cards, modal overlay
Gray 700:  #374151
Gray 600:  #4B5563
Gray 500:  #6B7280   ← Placeholder, disabled text
Gray 400:  #9CA3AF
Gray 300:  #D1D5DB   ← Border, divider
Gray 200:  #E5E7EB
Gray 100:  #F3F4F6   ← Light page background
Gray 50:   #F9FAFB   ← Card background
White:     #FFFFFF
```

### Semantic

```
Success:  #388E3C  ← Hoàn thành, đã pass
Warning:  #F57C00  ← Cần chú ý, sắp hết hạn
Error:    #D32F2F  ← Lỗi, thất bại
Info:     #1976D2  ← Thông tin, gợi ý
```

### Level Badge Colors

```
Level 1 (Nhập môn):    bg-gray-400   text-white
Level 2 (Cơ bản):     bg-green-500  text-white
Level 3 (Sơ trung):   bg-blue-500   text-white
Level 4 (Trung cấp):  bg-purple-500 text-white
Level 5 (Trung cao):  bg-orange-500 text-white
Level 6 (Nâng cao):   bg-red-600    text-white
```

## 9.2 Typography

```
Font Family: 'Inter', 'Be Vietnam Pro', sans-serif
  ← 'Be Vietnam Pro' cho text tiếng Việt — hỗ trợ dấu tốt hơn

Heading 1:  32px / 700 / line-height 1.25
Heading 2:  24px / 700 / line-height 1.3
Heading 3:  20px / 600 / line-height 1.4
Heading 4:  18px / 600 / line-height 1.4
Body Large: 16px / 400 / line-height 1.6
Body:       14px / 400 / line-height 1.6
Small:      12px / 400 / line-height 1.5
Caption:    11px / 400 / line-height 1.4
```

## 9.3 Spacing System

```
4px base unit (Tailwind default)
xs:  4px   (gap-1)
sm:  8px   (gap-2)
md:  16px  (gap-4)
lg:  24px  (gap-6)
xl:  32px  (gap-8)
2xl: 48px  (gap-12)
3xl: 64px  (gap-16)
```

## 9.4 Border Radius

```
sm:   4px   ← Tag, badge nhỏ
md:   8px   ← Input, button
lg:   12px  ← Card
xl:   16px  ← Modal, large card
full: 9999px ← Pill badge, avatar
```

## 9.5 Shadow

```
sm:  0 1px 3px rgba(0,0,0,0.12)   ← Card resting
md:  0 4px 12px rgba(0,0,0,0.15)  ← Card hover, dropdown
lg:  0 8px 24px rgba(0,0,0,0.2)   ← Modal
```

## 9.6 Component Library

### Button

```
Primary:   bg-blue-600 hover:bg-blue-700  text-white    rounded-lg px-6 py-2.5
Secondary: bg-white border border-blue-600 text-blue-600 hover:bg-blue-50
Accent:    bg-orange-500 hover:bg-orange-600 text-white ← CTA "Đăng ký ngay"
Danger:    bg-red-600 hover:bg-red-700 text-white
Ghost:     bg-transparent hover:bg-gray-100 text-gray-700
Disabled:  bg-gray-200 text-gray-400 cursor-not-allowed

Sizes:
  sm: text-sm px-4 py-1.5
  md: text-base px-6 py-2.5  ← default
  lg: text-lg px-8 py-3
```

### Course Card

```
Layout: rounded-xl overflow-hidden shadow-sm hover:shadow-md transition
  ├── Thumbnail (aspect-ratio 16/9, object-cover)
  │   └── Badge nổi (góc trên phải): "SALE 47%" hoặc Level badge
  ├── Body (p-4)
  │   ├── Title: font-semibold text-gray-900 line-clamp-2
  │   ├── Teacher: text-sm text-gray-500 flex items-center gap-1
  │   ├── Rating: ★★★★☆ text-yellow-400 + (số đánh giá)
  │   ├── Progress bar (nếu đã enroll): h-1.5 bg-blue-500 rounded-full
  │   └── Price row:
  │       ├── Giá gốc: line-through text-gray-400 text-sm
  │       └── Giá KM:  text-orange-500 font-bold text-lg
  └── Footer (nếu đã enroll): "Tiếp tục học →" button
```

### Lesson Item (trong sidebar / lesson list)

```
Layout: flex items-center gap-3 px-4 py-3 hover:bg-gray-50
  ├── Icon trái:
  │   ├── Đã xem:    ✓ circle (bg-green-500 text-white)
  │   ├── Đang học:  play circle (bg-blue-500 text-white)  [active: border-l-2 border-blue-500]
  │   ├── Chưa xem:  circle outline (text-gray-400)
  │   └── Khoá:      lock icon (text-gray-300)
  ├── Nội dung:
  │   ├── Tên bài:  text-sm font-medium [khoá: text-gray-400]
  │   └── Meta:     text-xs text-gray-500 "12:34  •  Video"
  └── Badge phải: "Học thử" (màu xanh, pill) nếu is_free_trial
```

### Progress Bar

```
Container: w-full h-2 bg-gray-200 rounded-full overflow-hidden
Inner:     h-full bg-blue-500 rounded-full transition-all
          ← Animate width khi load

With label: "65% hoàn thành" text-xs text-gray-500 mt-1
```

### Badge / Tag

```
Level:    px-2 py-0.5 rounded-full text-xs font-semibold [màu theo level]
Free:     px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs "Miễn phí"
Trial:    px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs "Học thử"
New:      px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs "MỚI"
Hot:      px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs "🔥 HOT"
```

### Skill Radar Chart

```
4 trục: Nghe / Nói / Đọc / Viết
Fill:   rgba(25, 118, 210, 0.2) (blue-600 / 20%)
Stroke: #1976D2
Point:  circle #1976D2 r=4
Grid:   4 rings, màu gray-200
Label:  text-xs text-gray-600, position offset ra ngoài
```

### Streak Calendar

```
7 cột (7 ngày gần nhất) hoặc full month grid
Cell đã học: bg-blue-500 rounded
Cell chưa học: bg-gray-200 rounded
Cell hôm nay: ring-2 ring-blue-500
Streak badge: "🔥 7 ngày liên tiếp" text-orange-500 font-bold
```

## 9.7 Layout Grid

```
Max content width: 1280px, mx-auto
Side padding: px-4 (mobile) → px-6 (tablet) → px-8 (desktop)

Breakpoints (Tailwind):
  sm:  640px   ← Tablet nhỏ
  md:  768px   ← Tablet
  lg:  1024px  ← Desktop nhỏ
  xl:  1280px  ← Desktop
  2xl: 1536px  ← Large desktop
```

## 9.8 Animation Guidelines

```
Transition duration: 150ms (fast), 300ms (normal), 500ms (slow)
Easing: ease-in-out (default), ease-out (appear), ease-in (disappear)
Hover: transform scale-105 duration-150 (card hover)
Modal: opacity 0→1 + translateY 8px→0 duration-200
Toast: translateX 100%→0 (slide in from right)
Progress: width transition 500ms ease-out
```

---

# 10. FRONTEND — MÀN HÌNH USER-FACING (MỚI V3)

## 10.1 Global Layout

### Header (Sticky)

```
Height: 56px
Background: #1565C0 (Brand Blue)
Shadow: 0 2px 8px rgba(0,0,0,0.15)

Layout: [Logo] [Nav links] (flex-1 justify-center) [Search] [Notification bell] [Avatar/Login]

Logo:
  "MLS" hoặc tên tenant
  text-white font-bold text-xl
  Click → /

Nav links (desktop, ẩn trên mobile):
  Trang chủ | Khoá học | Thi thử | Nhóm học
  text-white/90 hover:text-white font-medium
  Active: border-b-2 border-white

Search bar (desktop):
  bg-white/15 placeholder:text-white/60 text-white
  rounded-full px-4 py-1.5 w-60
  Focus: bg-white text-gray-900 (transition)
  Icon: 🔍 bên trái

Right actions:
  Notification bell: icon trắng + badge số đỏ
  Avatar: circle 36px → dropdown menu
    "Trang cá nhân"
    "Khoá học của tôi"
    "Cài đặt"
    "Đăng xuất"
  Nếu chưa login: [Đăng nhập] [Đăng ký] buttons (white outlined + white filled)
```

### Left Sidebar (khi đã đăng nhập — Desktop)

```
Width: 72px (collapsed, icon only)
Position: fixed left-0, top-56px, height: calc(100vh - 56px)
Background: white, border-r border-gray-200

Icons (vertical, center-aligned):
  📚 Bài học mới
  🎓 Khoá đã kích hoạt
  👥 Nhóm của tôi
  ➕ Đang theo dõi
  🔖 Đã lưu
  ❤️ Đã thích
  👫 Bạn bè

Hover state: show tooltip text bên phải
Active item: text-blue-600, left border blue
```

### Footer

```
Background: gray-900
Text: gray-400
3 columns: Về chúng tôi / Hỗ trợ / Mạng xã hội
Copyright line
```

---

## 10.2 Trang chủ — `/`

### Layout

```
[Header]
[Hero Banner Carousel]
[Section: Khoá học nổi bật]
[Section: Tiếp tục học (nếu đã login)]
[Section: Giáo viên]
[Section: CTA đăng ký]
[Footer]
```

### Hero Banner Carousel

```
Height: 420px (desktop), 240px (mobile)
Auto-play: 4s interval
Dots indicator + prev/next arrows

Mỗi slide:
  Background: gradient hoặc ảnh full-width
  Content (overlay bên trái):
    - Sub-title: "Khai giảng 18/5/2026" (text-orange-400)
    - Title: "Học tiếng Việt cùng chuyên gia" (text-white text-3xl font-bold)
    - CTA: [Đăng ký ngay] (bg-orange-500 rounded-lg px-8 py-3)
    - Badges: "GIẢM 48%" "Hơn 2100 học viên"

Course Quick Info popup (xuất hiện khi hover slide):
  Position: absolute bottom-4 right-4
  bg-white rounded-xl shadow-lg p-4 w-72
    - Thumbnail nhỏ
    - Tên khoá học
    - Giá gốc (line-through) + Giá KM (orange, bold)
    - [Xem khoá học] button
```

### Section: Khoá học nổi bật

```
Heading: "Khoá học nổi bật" (text-2xl font-bold)
Sub: [Tabs] Tất cả | Level 1 | Level 2 | ... | Level 6

Course grid:
  desktop: 3 columns
  tablet: 2 columns
  mobile: 1 column
  gap: 24px

[Xem tất cả →] link cuối section
```

### Section: Tiếp tục học (chỉ khi đã login)

```
Background: bg-blue-50
Heading: "Tiếp tục học hôm nay 🔥" + streak badge
Content: horizontal scroll list, 1 card lớn + 3 card nhỏ
Card: thumbnail + tên bài + progress bar + "Tiếp tục" button
```

### Section: Giáo viên

```
Heading: "Gặp gỡ đội ngũ giáo viên"
Horizontal scroll:
  Avatar (circle 80px) + Tên + Chuyên môn + số học viên
```

---

## 10.3 Danh sách khoá học — `/khoa-hoc`

### Layout

```
[Header]
[Hero banner: "Khoá học tiếng Việt" + breadcrumb]
[Filter bar]
[Course grid]
[Pagination]
[Footer]
```

### Hero Banner (Carousel, height 360px)

```
Hiển thị các chương trình học nổi bật
Breadcrumb: Trang chủ > Khoá học (text-white/70)
```

### Filter Bar

```
Sticky top-56px khi scroll
Background: white, shadow-sm

[Level 1] [Level 2] [Level 3] ... [Tất cả]  ←  pill tabs, active = bg-blue-600 text-white

Right side:
  Search input
  Sort dropdown: "Mới nhất" / "Phổ biến nhất" / "Giá tăng dần" / "Giá giảm dần"
```

### Course Grid

```
desktop: 3 columns (lg:grid-cols-3)
tablet:  2 columns (md:grid-cols-2)
mobile:  1 column

Mỗi card (xem component 9.6):
  Hover: translateY(-4px) + shadow-lg
  Click → /khoa-hoc/[id]
```

---

## 10.4 Chi tiết khoá học — `/khoa-hoc/[id]`

### Layout

```
[Header]
[Hero section: full-width bg-gray-900]
  ├── Left (60%): Breadcrumb + Title + Meta + Tabs
  └── Right (40%): Sticky enrollment card
[Tab content]
[Footer]
```

### Hero Section (bg-gray-900, text-white)

```
Breadcrumb: Trang chủ > Khoá học > Tên khoá (text-gray-400)
Title: text-2xl/3xl font-bold text-white
Badges: [Level badge] [Số bài học] [Tổng thời lượng]
Rating: ★ 4.8 (1.2k đánh giá)
Teacher: Avatar + Tên giáo viên
```

### Sticky Enrollment Card (right column)

```
Position: sticky top-[72px]
Background: white rounded-xl shadow-xl p-6
Width: 360px (desktop)

  Thumbnail preview (click → preview video)
  Price:
    Giá gốc: text-gray-400 line-through "4,500,000đ"
    Giá KM:  text-orange-500 text-2xl font-bold "2,400,000đ"
    Tiết kiệm: badge "Tiết kiệm 47%"
  
  Coupon input: [  nhập mã giảm giá  ] [Áp dụng]
  
  [Đăng ký ngay] — bg-orange-500 text-white w-full py-3 rounded-lg text-lg font-bold
  [Học thử miễn phí] — outlined blue, w-full
  
  Perks list:
    ✅ Học mọi lúc, mọi nơi
    ✅ Video chất lượng HD
    ✅ Chứng chỉ sau hoàn thành
    ✅ Hỗ trợ 24/7
  
  "Còn X chỗ" or countdown timer (nếu có ưu đãi)
```

### Tab Navigation

```
[Giới thiệu] [Nội dung khoá học] [Đánh giá]

Tab: Giới thiệu
  Mô tả khoá học (rich text)
  Yêu cầu đầu vào
  Kết quả đạt được sau khoá học
  Giới thiệu giáo viên (avatar + bio)

Tab: Nội dung khoá học
  Tổng quan: "X module  •  Y bài học  •  Z giờ"
  Accordion modules:
    [▼] Module 1: Phát âm cơ bản (6 bài / 45 phút)
      └── Bài 1: Thanh điệu tiếng Việt    [12:34] [Học thử ▶]
      └── Bài 2: Nguyên âm đơn            [10:20] [🔒]
      └── Bài 3: Phụ âm đầu               [15:00] [🔒]
    [▶] Module 2: Chào hỏi ...
  
  Bài học thử: highlight màu xanh, có nút ▶ play

Tab: Đánh giá
  Overall rating: "4.8 ★" (text-5xl font-bold)
  Rating breakdown: 5★ ████████ 78%, 4★ ████ 15%, ...
  Review list:
    Avatar + Tên + Rating + Nội dung + Ngày
    [Xem thêm] button
```

---

## 10.5 Trang học bài — `/hoc/[lessonId]`

> **Màn hình quan trọng nhất** — thiết kế theo Udemy/moon.vn: full-viewport, dark theme, sidebar có thể đóng mở.

### Layout

```
[Header — 56px, simplified: logo + tên khoá + nav next/prev + X đóng]
[Main area — height: calc(100vh - 56px)]
  ├── Left: Video + Content (flex-1)
  └── Right: Course outline sidebar (w-80, collapsible)
```

### Header (Lesson page — simplified)

```
bg-gray-900 text-white h-14 flex items-center justify-between px-4

Left:  [← Quay lại] Logo
Center: Tên khoá học (truncate)
Right:  [◀ Bài trước] [Bài tiếp theo ▶]  [☰ Nội dung]

Bài trước/Bài tiếp theo: button nhỏ, icon + text
☰ Nội dung: toggle sidebar trên mobile
```

### Left Column — Video + Content

```
overflow-y-auto, min-w-0, flex-1, flex-col

[Video player — 16:9]        ← Xem mục 11
[Lesson title + Meta]
  Title: text-xl font-semibold text-gray-900
  Meta: "Module 2  •  Bài 3  •  15:34"
  
[Tab bar]: [Ghi chú] [Hỏi đáp] [Tài liệu]

Tab: Ghi chú
  Hiển thị notes đã tạo trong video (từ localStorage)
  [+ Thêm ghi chú tại vị trí hiện tại]
  List: timestamp | nội dung | [Sửa] [Xoá]

Tab: Hỏi đáp
  Comment input (textarea + [Gửi])
  Comment list:
    Avatar + Tên + Nội dung + Thời gian + [Trả lời] [Like]
    └── Replies (nested max 1 cấp)

Tab: Tài liệu
  Danh sách file đính kèm bài học
  [PDF icon] Giáo trình bài 3 — 2.3MB [Xem]
  [Audio icon] Bài nghe bài 3 [Nghe]
```

### Right Column — Course Outline Sidebar

```
bg-gray-900 text-white w-80
overflow-y-auto, h-full

Header: "Nội dung khoá học" text-sm font-semibold text-gray-400 uppercase px-4 py-3
Progress: "65% hoàn thành" + progress bar (blue)

Module accordion:
  [Module header] bg-gray-800/60 px-4 py-3 font-medium text-sm
    Lesson items (khi expand):
      ├── Active:  bg-indigo-950/50 border-l-2 border-indigo-500 text-white
      ├── Done:    text-gray-400 + ✓ icon xanh
      └── Locked: text-gray-600 + 🔒 icon

Lesson item layout:
  [Status icon] [Tên bài] [duration]
  height: 48px, px-4
```

### Mobile behavior

```
Mobile (< 1024px):
  Sidebar: ẩn mặc định, slide in từ phải khi tap "☰ Nội dung"
  Overlay: bg-black/50 khi sidebar mở
  Video: full-width (100vw)
  Content tabs: scroll bên dưới video
```

---

## 10.6 Dashboard Học viên — `/dashboard`

### Layout

```
[Header]
[Left sidebar]
[Main content]
  ├── Greeting + Streak (full-width)
  ├── [Left 60%] Tiến độ học tập
  └── [Right 40%] Thống kê & Gợi ý
[Footer]
```

### Greeting + Streak Banner

```
Background: gradient blue (bg-gradient-to-r from-blue-600 to-blue-800)
Text: white
  "Chào buổi sáng, [Tên]! 🌅"
  Streak: 🔥 12 ngày học liên tiếp — ["Học ngay để giữ streak"]
  Progress ngày hôm nay: [===========60%====] "Đã học 30/50 phút hôm nay"
```

### Tiến độ học tập (left column)

```
Card: "Khoá học đang học"
  List các enrolled courses:
    [Thumbnail] [Title] [Progress bar] [% + X/Y bài]
    [Tiếp tục học →]

Card: "Bài học tiếp theo"
  Gợi ý từ API recommendation
  [▶ Học ngay]
```

### Thống kê (right column)

```
Card: "Kỹ năng của bạn" (Radar chart)
  4 trục: Nghe / Nói / Đọc / Viết
  Giá trị: 0–100 từ AnalyticsSnapshots
  So sánh: "So với khi bắt đầu: +15 điểm Nói"

Card: "Lịch học"  (streak calendar, 4 tuần gần nhất)
  Grid 7×4, màu xanh = ngày học, xám = ngày bỏ
  "🔥 Chuỗi dài nhất: 21 ngày"

Card: "Tổng thời gian học"
  "142 giờ 30 phút" (text-3xl font-bold blue)
  "Tháng này: 8h 20m"
```

### Gamification section

```
Points: "1,250 điểm XP"  (text-2xl gold)
Rank: "🥈 Hạng 23 tuần này"
Badges received: icon grid (4 badges gần nhất)
[Xem bảng xếp hạng]
```

---

## 10.7 Trang Placement Test — `/placement-test`

### Flow

```
Step 0: Intro screen
  Mô tả bài test, thời gian (~45 phút)
  Hướng dẫn 4 phần
  [Bắt đầu làm bài]

Step 1: Listening (MCQ)
  Audio player + câu hỏi + 4 đáp án A/B/C/D
  Progress: "Câu 3/10"

Step 2: Reading (MCQ)
  Text đọc hiểu + câu hỏi

Step 3: Speaking (record)
  Đề nói + countdown 30s chuẩn bị + record button
  MediaRecorder API → upload blob
  "Đang phân tích..." loading animation

Step 4: Writing
  Đề bài + textarea + word count
  [Nộp bài]

Step 5: Result screen
  Radar chart 4 kỹ năng
  Level gợi ý: "Level 3 — Sơ trung cấp"
  [Xem lộ trình học] → redirect sang khoá học Level 3
```

### UI Quiz

```
Container: max-w-3xl mx-auto py-8

Progress bar top: "Phần 1/4: Nghe hiểu"
  → thin bar full-width màu blue

Question card: bg-white rounded-xl shadow p-8
  Số câu: "Câu 3 / 10" (text-sm text-gray-400 mb-4)
  Audio player (custom, nếu listening)
  Question text: text-lg font-medium mb-6
  Options:
    Radio buttons styled:
      border rounded-lg p-4 cursor-pointer
      hover: border-blue-300 bg-blue-50
      selected: border-blue-600 bg-blue-50 font-medium

  [← Câu trước] (ghost)  [Câu tiếp theo →] (primary)
```

---

## 10.8 Trang Kết quả Quiz — `/quiz/[attemptId]/result`

```
Celebration animation (confetti nếu passed)

Header:
  passed: ✅ "Chúc mừng! Bạn đã vượt qua" (text-green-600)
  failed: ❌ "Chưa đạt. Thử lại nhé!" (text-red-600)

Score summary card:
  Tổng điểm: "82 / 100" (text-5xl font-bold)
  4 skill scores: Nghe 85 | Nói 72 | Đọc 90 | Viết 80
  Radar chart

Detail accordion:
  Từng câu: câu hỏi + đáp án của bạn + đáp án đúng + giải thích

Actions:
  passed: [Bài tiếp theo →] [Về trang học]
  failed: [Làm lại] [Xem đáp án]
```

---

## 10.9 Trang Profile — `/profile`

```
Header: Cover photo (gradient blue) + Avatar (circle 80px) + Tên + Level badge

Tabs: [Thông tin] [Khoá học] [Huy hiệu] [Cài đặt]

Tab: Thông tin
  Họ tên, email, SĐT (edit inline)
  Ngày sinh, quốc tịch
  [Lưu thay đổi]

Tab: Khoá học
  Enrolled courses list + progress

Tab: Huy hiệu
  Badge grid (icon + tên + ngày nhận)
  Locked badges (grayscale) + điều kiện mở

Tab: Cài đặt
  Đổi mật khẩu
  Thiết bị đăng nhập
  Ngôn ngữ giao diện
  Thông báo (toggle)
```

---

## 10.10 Free Trial & Upsell UI

### Lesson bị khoá (chưa mua)

```
Overlay trên video:
  bg-gray-900/90 backdrop-blur
  Icon: 🔒 (text-6xl)
  Text: "Bài học này cần mở khoá"
  Sub: "Đăng ký khoá học Level 2 để xem toàn bộ nội dung"
  [Xem gói học →] (bg-orange-500 text-white rounded-lg px-8 py-3)
  [Xem bài học thử miễn phí] (ghost)

Lesson item bị khoá trong sidebar:
  text-gray-500 + 🔒 icon
  Hover tooltip: "Cần mua Level X để mở khoá"
```

### Banner upsell (trong trang khoá học)

```
Sticky bottom bar (khi chưa đăng ký):
  Background: bg-blue-600 text-white
  "Mở khoá toàn bộ X bài học — Chỉ từ Y,000đ/tháng"
  [Đăng ký ngay] button bên phải
```

---

## 10.11 Trang Mua hàng — `/mua-hang`

```
3 columns side by side (desktop), stacked (mobile):

Column 1: Level đơn lẻ
  Title: "Level [N]"
  Price: X,XXXđ/tháng
  Features list (✓ / ✗)
  [Chọn gói này]

Column 2: Combo 3 Level (POPULAR badge)
  Highlighted: border-2 border-blue-500 shadow-lg
  [Mua ngay — Tiết kiệm 15%]

Column 3: Full 6 Level (BEST VALUE badge)
  [Mua ngay — Tiết kiệm 25%]

Below: Coupon input + Phương thức thanh toán tiles (VNPay / MoMo / Stripe / Chuyển khoản)
```

---

# 11. VIDEO PLAYER — SPEC ĐẦY ĐỦ (MỚI V3)

> File: `src/components/video/HlsPlayer.tsx`
> Tham chiếu: moon.vn player features. Đã implement v2, V3 bổ sung thêm.

## 11.1 Container & Sizing

```
Container:
  position: relative
  style={{ aspectRatio: "16/9" }}   ← KHÔNG dùng Tailwind aspect-video (không ổn định v4)
  background: #000
  width: 100%

Video element:
  position: absolute, inset: 0
  width: 100%, height: 100%
  object-fit: contain

Controls overlay:
  position: absolute, inset: 0
  opacity: 0 → 1 khi hover/pause (useState, KHÔNG dùng Tailwind group-hover)
  transition: opacity 150ms
  Auto-hide sau 3s khi đang play
```

## 11.2 HLS Setup

```typescript
// Ưu tiên: HLS.js (dynamic import để tránh SSR)
if (src.includes('.m3u8') || src.includes('/hls/')) {
  const Hls = (await import('hls.js')).default
  if (Hls.isSupported()) {
    const hls = new Hls({
      maxBufferLength: 30,
      maxMaxBufferLength: 60,
      enableWorker: true,
    })
    hls.loadSource(src)
    hls.attachMedia(video)
  }
} else {
  video.src = src  // native MP4
}
```

## 11.3 Controls Layout

```
Bottom controls (position: absolute, bottom: 0, width: 100%)
Background: linear-gradient(transparent → rgba(0,0,0,0.85))
Padding: 48px top (cho gradient) 12px bottom

Row 1 — Progress bar:
  ┌──────────────────────────────────────────────────────────────────┐
  │ [Bookmarks: ● ● ● (yellow dots)]                                 │
  │ ████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ [●]   │
  │ Buffered: đậm hơn nền, nhạt hơn progress                         │
  └──────────────────────────────────────────────────────────────────┘

Row 2 — Buttons:
  Left group:
    [⏮ -10s] [▶/⏸] [⏭ +10s] [🔊/🔇 Volume slider] [00:34 / 15:22]

  Right group:
    [📝 Ghi chú] [🔖 Bookmark] [⚙️ Tốc độ] [HD 720p ▼] [CC ▼] [PIP] [⛶ Toàn màn hình]
```

## 11.4 Tính năng — Đã implement (V2)

| Feature | Trạng thái | Notes |
|---|---|---|
| Play / Pause | ✅ | Space bar shortcut |
| Seek bar với drag | ✅ | Pointer capture API |
| Volume slider + 3 icon states | ✅ | M = mute |
| Tốc độ 0.5×–2× popup | ✅ | 0.5, 0.75, 1, 1.25, 1.5, 2 |
| ±10s skip | ✅ | ← → 5s |
| Bookmark timeline (màu vàng) | ✅ | localStorage `vp-b-{lessonId}` |
| Ghi chú inline (pause + modal) | ✅ | localStorage `vp-n-{lessonId}` |
| Resume từ vị trí cuối | ✅ | localStorage `vp-p-{lessonId}` |
| Tắt right-click | ✅ | onContextMenu preventDefault |
| Fullscreen | ✅ | F key |
| Auto-hide controls | ✅ | 3s timeout khi play |
| HLS.js adaptive streaming | ✅ | Dynamic import |

## 11.5 Tính năng — Bổ sung V3

### Quality Selector (360p / 720p / 1080p)

```
Hiển thị: "HD 720p" button → popup bên trên
Popup: "Chất lượng video" list
  ● Tự động (đề xuất)
  ○ 1080p HD
  ● 720p HD    ← active
  ○ 360p SD

Implementation:
  hls.levels = HLS level list từ master.m3u8
  hls.currentLevel = -1 (auto) hoặc index cụ thể
  hls.on(Hls.Events.LEVEL_SWITCHED, updateQualityLabel)

Cần backend: FFmpeg transcode ra 360p + 720p + 1080p HLS
```

### Picture-in-Picture (PIP)

```
Button: 📺 icon (hoặc PiP SVG icon)
Click handler:
  if (document.pictureInPictureElement) {
    document.exitPictureInPicture()
  } else {
    videoRef.current.requestPictureInPicture()
  }

Disable nếu: !document.pictureInPictureEnabled
```

### Subtitle / Phụ đề (CC)

```
Button: "CC" → popup "Phụ đề"
  ○ Tắt phụ đề
  ○ Tiếng Việt
  ○ English (nếu có)

Implementation:
  <track kind="subtitles" src={subtitleUrl} srclang="vi" label="Tiếng Việt" />
  videoRef.current.textTracks[0].mode = 'showing'

Subtitle style:
  font-size: 16px
  background: rgba(0,0,0,0.75) padding 4px 8px
  bottom: 60px (trên controls)

Admin upload: SRT file → API chuyển WebVTT → lưu cùng lesson
```

### Speed Selector (cập nhật V3)

```
Vietnamese labels:
  0.5×    → "0.5×"
  0.75×   → "0.75×"
  1×      → "Bình thường"   ← như moon.vn
  1.25×   → "1.25×"
  1.5×    → "1.5×"
  1.75×   → "1.75×"         ← thêm mới (moon.vn có)
  2×      → "2×"
```

## 11.6 Keyboard Shortcuts

```
Space       → Play / Pause
←           → Lùi 5 giây
→           → Tiến 5 giây
↑           → Tăng âm lượng 10%
↓           → Giảm âm lượng 10%
M           → Tắt/bật tiếng
F           → Fullscreen
P           → Picture-in-Picture
B           → Bookmark tại vị trí hiện tại
N           → Mở form ghi chú
0–9         → Seek đến 0%–90% của video
```

## 11.7 Notes Panel

```
Toggle button: 📝 + badge số lượng ghi chú
Panel: position absolute, bottom-14, left-0, right-0
  bg-gray-900/95 rounded-t-xl max-h-48 overflow-y-auto

Note row:
  [00:34] Thanh điệu tiếng Việt có 6 loại...   [✏️] [🗑️]
  
Add note: [textarea] + [Lưu] (video tự pause khi mở)
```

## 11.8 Bookmark System

```
localStorage key: vp-b-{lessonId}
Structure: Array<{ id: string, timestamp: number, label?: string }>

Timeline dots: position absolute trên progress bar
  left: (bookmark.timestamp / duration) * 100 + '%'
  width: 10px, height: 10px
  background: #FFD600 (yellow)
  border-radius: 50%
  cursor: pointer
  
Click bookmark → seek to timestamp
Double-click → xoá bookmark

Tooltip on hover: "00:34 — Ghi chú: ..."
```

## 11.9 Resume Banner

```
Condition: savedPosition > 5s && savedPosition < (duration - 5s)

Banner: position absolute, top-12, left-50%, transform: -50%
  bg-gray-900/90 rounded-lg px-4 py-2 flex items-center gap-3
  "Tiếp tục xem từ 03:24"
  [▶ Xem tiếp] [Bắt đầu lại]

Auto-dismiss sau 8s
```

---

# 12. KẾ HOẠCH TRIỂN KHAI

## Timeline tổng quan

```
Phase 0: Infrastructure & Foundation          [Tuần 1–2]     ✅ DONE
Phase 1: Auth & User Management               [Tuần 3–6]     ✅ ~95% done
Phase 2: Custom CMS + Video Learning          [Tuần 7–12]    🔄 ~95% done
Phase 3: Quiz Engine + AI Evaluation          [Tuần 11–16]
Phase 4: Commerce & Payment                   [Tuần 13–18]
Phase 5: Gamification & Analytics             [Tuần 17–22]
Phase 6: Chat, Support & Notification         [Tuần 20–24]
Mobile App (React Native)                     [Song song Phase 2–5]
```

**MVP Release: ~Tuần 18–20**

---

## PHASE 0 ✅ HOÀN THÀNH

- [x] Docker Compose: redis, rabbitmq
- [x] ASP.NET Core 10 — Clean Architecture
- [x] TenantMiddleware (X-Tenant-Slug header)
- [x] PostgreSQL schema + DatabaseInitializer
- [x] GET /health

---

## PHASE 1 — Auth & User Management ✅ ~95%

### Backend — Đã làm

- [x] Đăng ký Email + BCrypt
- [x] Đăng nhập JWT + Refresh Token rotation
- [x] Google OAuth 2.0
- [x] Device tracking
- [x] Logout (POST /auth/logout)
- [x] Logout all devices (POST /auth/logout-all)
- [x] Forgot password / Reset password flow
- [x] Email verification — verify-email + resend-verification
- [x] Avatar upload (POST /api/v1/users/me/avatar)
- [x] Sessions management (GET /me/sessions, DELETE /me/sessions/{id})
- [x] GET/PUT /api/v1/users/me — profile read/update
- [x] PUT /api/v1/users/me/password — đổi mật khẩu

### Backend — Còn thiếu

- [ ] SMS OTP qua Esms.vn
- [ ] Rate limit OTP: max 3 lần/15 phút/IP

### Frontend User-facing

- [x] Layout header/footer
- [x] /register + /login + Google button
- [x] Redux authSlice, RTK Query
- [x] AuthGuard HOC
- [x] /forgot-password
- [x] /reset-password
- [x] /verify-email
- [x] /settings/sessions — thiết bị đang đăng nhập
- [x] /profile — upload avatar, chỉnh sửa thông tin

### Frontend Admin Panel

- [x] /admin/* layout — sidebar nav (AdminLayout với menu collapsible)
- [x] /admin/users — bảng + filter + tìm kiếm + phân trang
- [x] /admin/users/[id] — user detail + edit roles
- [x] /admin/roles — danh sách roles
- [x] /admin/roles/[id] — role detail + permissions editor
- [x] /admin/settings — cài đặt tenant
- [ ] /admin/settings — upload logo, cấu hình màu sắc, domain (UI cơ bản có, logic chưa đầy đủ)

---

## PHASE 2 — CMS + Video Learning 🔄 ~95%

> **Cập nhật 13/05/2026 (v2)** — Hoàn thành: progress bar per lesson (IsCompleted backend+frontend),
> free trial lock overlay, drag-drop reorder modules & lessons (HTML5 DnD), transcode polling.
>
> **Cập nhật 13/05/2026 (v3)** — Banner carousel system: BannerSlide entity, CRUD API,
> UpgradeSchemaAsync cho tenant hiện hữu, admin /admin/settings/banners,
> /khoa-hoc dynamic carousel (auto-slide 5s, prev/next, API + fallback slides).
>
> **Cập nhật 14/05/2026 (v4)** — Teacher Marketplace Extension: TeacherProfile, TeacherFollower,
> Public Teacher Page (/giao-vien/[slug]), Follow system, Teacher course shop.
> Phân tích chi tiết: teacher-marketplace-extension-analysis.md
>
> **Cập nhật 14/05/2026 (v5)** — Rà soát & Fix Teacher Flow:
> - **Vấn đề 1:** `GetTeacherListHandler` query trực tiếp `TeacherProfiles` table → thiếu giáo viên chưa có profile row
> - **Fix:** Auto-create `TeacherProfile` khi admin gán Teacher role (AssignRoleCommand) hoặc tạo user với Teacher role (CreateUserCommand)
> - **Vấn đề 2:** Không có trang admin quản lý teacher profile → admin không update được bio/headline/avatar
> - **Fix:** Thêm `/admin/teachers` (list) + `/admin/teachers/[id]` (edit) + API `GET/PUT /api/v1/admin/teachers/{userId}`
> - **Vấn đề 3:** Teacher detail page chưa match moon.vn style (stats nằm sai vị trí)
> - **Fix:** Redesign layout: [Avatar+Buttons] | [Name+Bio] | [Stats] theo đúng moon.vn
> - **Course creation:** `CreatedBy` = admin user ✅, `TeacherId` = optional (dropdown Teacher-role users) ✅ — đã đúng
> - **Teacher profile update:** Admin quản lý qua `/admin/teachers/[id]`, teacher tự edit qua `/settings/teacher-profile` (TODO Phase 3)

### Teacher Marketplace Extension (Bổ sung Phase 2 — 14/05/2026)

> Mở rộng LMS thành Marketplace LMS: Teacher = Creator + Seller + Influencer.
> Không thay đổi Auth/RBAC/LMS Core/Enrollment/Payment.

#### Backend — Teacher Entities

- [x] TeacherProfile entity (userId, displayName, slug, avatarUrl, coverUrl, headline,
      bio, experienceYears, specialization, facebookUrl, youtubeUrl, tiktokUrl,
      websiteUrl, isVerified, isPublic, followerCount, courseCount, ratingAverage,
      totalViews, totalStudents)
- [x] TeacherFollower entity (teacherProfileId, studentId, createdAt)
- [x] UpgradeSchemaAsync — tự tạo bảng TeacherProfiles + TeacherFollowers cho tenant
- [x] GET /api/v1/teachers/{slug} — public teacher profile
- [x] GET /api/v1/teachers/{id}/courses — danh sách khoá học của giáo viên
- [x] POST /api/v1/teachers/{id}/follow — theo dõi giáo viên (Auth required)
- [x] DELETE /api/v1/teachers/{id}/follow — bỏ theo dõi (Auth required)
- [ ] PUT /api/v1/teacher-profile — giáo viên tự cập nhật profile (Phase 3)
- [ ] GET /api/v1/teacher-dashboard/analytics — analytics cho giáo viên (Phase 3)
- [x] Tự động tạo TeacherProfile khi Admin gán Role Teacher cho user _(14/05 v5)_
- [x] Tự động tạo TeacherProfile khi Admin tạo user với Role Teacher _(14/05 v5)_
- [x] GET /api/v1/admin/teachers — list tất cả giáo viên + profile info _(14/05 v5)_
- [x] PUT /api/v1/admin/teachers/{userId} — admin cập nhật teacher profile _(14/05 v5)_

#### Frontend — Teacher Page

- [x] /giao-vien/[slug] — Public teacher page (moon.vn style) _(redesign 14/05 v5)_
      - Layout: [Avatar+Buttons] LEFT | [Name+Verified+Bio] CENTER | [Stats] RIGHT
      - Stats: Views, Likes/TotalStudents, Followers — large numbers
      - Theo dõi (red pill) + Nhắn tin (gray outline pill) below avatar
      - Shop section: danh sách khoá học dạng card (thumbnail, title, giá, giá gốc)
- [x] RTK Query teachersApi (getTeacherList, getTeacherBySlug, getTeacherCourses, followTeacher, unfollowTeacher)
- [x] /admin/teachers — danh sách giáo viên + verify toggle _(14/05 v5)_
- [x] /admin/teachers/[id] — quản lý teacher profile (bio, headline, avatar, social links) _(14/05 v5)_
- [ ] Teacher tự manage profile tại /settings/teacher-profile (Phase 3)

### Backend — Course CMS ✅ Cơ bản hoàn thành

- [x] Course CRUD API đầy đủ (create/read/update/delete)
- [x] Course fields: title, description, shortDescription, slug, level, price,
      discountPrice, isFree, certificateEnabled, completionRequired, visibility,
      language, code, thumbnailUrl, bannerUrl, tags, duration, startDate, endDate
- [x] CourseStatus: Draft → PendingReview → Published → Hidden → Archived
- [x] Content approval workflow (submit → PendingReview → Approved/Rejected)
- [x] Clone course (POST /courses/{id}/clone)
- [x] Hide course (PUT /courses/{id}/hide)
- [x] Archive course (PUT /courses/{id}/archive)
- [x] CourseLevels CRUD (GET/POST/PUT/DELETE /courses/{id}/levels)
- [x] LearningLevels CRUD — bảng cấu hình cấp độ học (Level 1–6)
- [x] Module CRUD — title, description, orderIndex, isLocked, levelId,
      **thumbnailUrl, estimatedDuration** _(thêm 13/05)_
- [x] Lesson CRUD — title, description, lessonType, isFreeTrial, content,
      passScore, **durationMinutes** _(thêm 13/05)_
- [x] Lesson.LessonType enum: Video / Reading / Audio / Pdf / Quiz / Assignment / Live
- [x] Video upload + transcode pipeline (Hangfire background job)
- [x] VideoAsset status tracking (Pending → Processing → Ready / Failed)
- [x] Static file serving /media/* (LocalFileStorageService → swappable MinIO/S3)
- [x] Lesson Document upload (POST /lessons/{id}/documents) _(thêm 13/05)_
- [x] Lesson Document delete (DELETE /lessons/{id}/documents/{docId}) _(thêm 13/05)_
- [x] LessonDocument.Type: PDF / Audio / Ebook — auto-detect từ extension
- [ ] Bulk publish/unpublish modules/lessons

### Backend — System Config ✅

- [x] BannerSlide entity (Title, Subtitle, Description, ImageUrl, LinkUrl, BadgeText, CtaText, BgColor, TextColor, OrderIndex, IsActive) _(13/05)_
- [x] BannerSlide CQRS handlers (Get/Create/Update/Delete) _(13/05)_
- [x] AdminSystemController — 5 endpoints (public GET + admin CRUD) _(13/05)_
- [x] UpgradeSchemaAsync — tự động tạo bảng mới cho tenant đã tồn tại khi start _(13/05)_

### Backend — Learning

- [x] Enroll course (POST /courses/{id}/enroll)
- [x] LessonProgress tracking — start/complete lesson
- [x] VideoTracking (POST /lessons/{id}/video-position) — resume từ vị trí cũ
- [x] Learning streak API (GET /users/streak)
- [ ] Bookmark & Notes CRUD API — hiện lưu localStorage, cần persist DB
- [ ] Enrollment expiry + access check

### Backend — Video Quality (V3 — chưa làm)

- [ ] FFmpeg transcode → 3 bitrates: 360p (800kbps) + 720p (2500kbps) + 1080p (5000kbps)
- [ ] master.m3u8 với 3 quality levels
- [ ] HLS segment serve cho cả 3 quality
- [ ] Hiện tại: chỉ 1 quality (mp4 direct hoặc HLS đơn giản)

### Backend — Subtitle (V3 — chưa làm)

- [ ] POST /api/v1/admin/cms/lessons/{id}/subtitle — upload SRT
- [ ] Convert SRT → WebVTT (ffmpeg hoặc thư viện .NET)
- [ ] Serve .vtt file qua signed token (ngăn hotlink)
- [ ] GET /api/v1/lessons/{id}/subtitle — trả về URL VTT

### Frontend — User-facing (V3 spec)

- [x] / — Homepage (social feed / discovery — 778 lines)
      ⚠️ _Đây là phiên bản social feed, chưa khớp V3 spec hero carousel_
- [x] /courses — course catalog (basic list)
- [x] /courses/lessons/[lessonId] — lesson player page (dark theme)
- [x] /khoa-hoc — course catalog redesign (V3 spec, moon.vn style) — **banner carousel động** _(13/05)_
- [x] /khoa-hoc/[id] — course detail redesign (V3 spec)
- [x] HlsPlayer — play/pause/seek/fullscreen/resume vị trí cũ
- [x] HlsPlayer — Speed selector: 0.5× / 0.75× / 1× / 1.25× / 1.5× / **1.75×** / 2×
- [x] HlsPlayer — Quality selector (auto từ HLS manifest levels)
- [x] HlsPlayer — PiP (Picture-in-Picture) button
- [x] HlsPlayer — Bookmark + Notes (localStorage)
- [ ] Homepage / — Redesign theo V3 spec: Hero carousel + featured courses + CTA
- [ ] /hoc/[lessonId] — V3 spec lesson player page (sidebar syllabus, progress, chat)
- [ ] HlsPlayer — Subtitle/CC support (.vtt track inject)
- [ ] PDF viewer (embed iframe, ẩn native download toolbar)
- [ ] Audio player component (custom UI, không có download button)
- [x] Progress bar per lesson (% hoàn thành hiển thị trong syllabus) — IsCompleted backend+frontend _(13/05)_
- [ ] Streak widget (calendar heatmap — hiển thị trong /dashboard hoặc sidebar)
- [x] Free trial UI — lock overlay + upsell CTA cho bài không phải isFreeTrial _(13/05)_

### Frontend — Admin CMS

- [x] /admin/courses — danh sách + filter status/level + card grid redesign
- [x] /admin/courses/[id] — edit form đầy đủ (price, discount, visibility, language,
      code, thumbnailUrl, bannerUrl, tags, teacher, completionRequired, certificateEnabled)
- [x] Course create modal — full fields với CKEditor cho description _(13/05)_
- [x] Clone course button
- [x] Hide/Disable course button
- [x] /admin/modules/[id] — module detail + edit thumbnailUrl + estimatedDuration _(13/05)_
- [x] /admin/lessons/[id] — lesson detail + edit + video upload
- [x] /admin/lessons/[id] — Tài liệu đính kèm: upload/download/delete _(13/05)_
- [x] Lesson create modal — lessonType, content (CKEditor), durationMinutes, passScore _(13/05)_
- [x] Module create modal — thumbnailUrl, estimatedDuration _(13/05)_
- [x] Sửa button → mở thẳng edit mode (?edit=true querystring) _(13/05)_
- [x] /admin/content/approvals — queue duyệt nội dung
- [x] /admin/levels — quản lý CourseLevels theo khóa học
- [x] /admin/levels/[id] — level detail page
- [x] Drag-drop reorder modules / lessons (HTML5 DnD, persist orderIndex) _(13/05)_
- [x] Transcode status indicator (polling VideoAsset.Status trong UI) _(13/05)_
- [x] **Cấu hình hệ thống** — menu nhóm mới trong admin sidebar _(13/05)_
- [x] /admin/settings/banners — CRUD banner slides (form modal + live preview, toggle active) _(13/05)_
- [ ] Bulk actions: publish nhiều lesson/module cùng lúc
- [ ] /admin/courses/[id] — upload thumbnail file (hiện chỉ nhập URL)

---

## PHASE 3 — Quiz Engine + AI

### AI Service (Python FastAPI)

- [ ] POST /speaking/evaluate (GPT-4o Audio)
- [ ] POST /writing/evaluate (GPT-4o mini)
- [ ] Redis rate limiter
- [ ] Cost logging

### Backend — Quiz Engine

- [ ] Question Bank CRUD
- [ ] Quiz Builder API
- [ ] Quiz Attempt Engine (start/answer/submit)
- [ ] RabbitMQ consumer AI evaluation
- [ ] Placement Test level assignment

### Frontend — Placement Test

- [ ] /placement-test — 4-step flow
- [ ] Speaking recorder (MediaRecorder API)
- [ ] "Đang chấm..." polling UI
- [ ] Result: radar chart + level recommendation

### Frontend — Mini Test / Quiz

- [ ] Quiz component (MCQ + Fill blank)
- [ ] Timer display
- [ ] Submit confirmation modal
- [ ] /quiz/[attemptId]/result — result screen

---

## PHASE 4 — Commerce & Payment

### Backend

- [ ] Product catalog + pricing rules
- [ ] Cart + Checkout API
- [ ] VNPay + MoMo + Stripe integration
- [ ] Post-payment: enrollment + invoice PDF

### Frontend

- [ ] /mua-hang — 3-tier pricing (V3 spec)
- [ ] Cart widget + coupon
- [ ] Checkout + redirect gateway
- [ ] Payment success page
- [ ] Order history

---

## PHASE 5 — Analytics, Gamification

### Backend

- [ ] Event collector (RabbitMQ)
- [ ] Analytics aggregation consumer
- [ ] Points + Badges + Leaderboard engine
- [ ] Student dashboard API

### Frontend

- [ ] /dashboard — V3 spec (radar chart, streak calendar, progress)
- [ ] Gamification: points, badges, rank
- [ ] /leaderboard
- [ ] Admin Analytics dashboard

---

## PHASE 6 — Chat & Notifications

### Backend

- [ ] Q&A comments API
- [ ] SignalR chat hub
- [ ] FCM push notifications
- [ ] Notification CRUD

### Frontend

- [ ] Q&A section trong lesson
- [ ] Notification bell + dropdown
- [ ] Chat widget
- [ ] /admin/notifications/broadcast

---

## MOBILE APP (React Native — Song song Phase 2–5)

**Giai đoạn 1:** Auth + Course list + Video HLS + Progress + Placement Test
**Giai đoạn 2:** Commerce + Push notifications + Gamification

---

# 13. KHÔNG LÀM TRONG MVP

| Feature | Lý do defer |
|---|---|
| ❌ Moodle integration | Loại bỏ hoàn toàn (V2 decision) |
| ❌ ML-based recommendation | Cần data → rule-based v1 trước |
| ❌ Adaptive testing (IRT) | Phức tạp, cần data |
| ❌ Offline video (mobile) | DRM phức tạp |
| ❌ Livestream tự build | Dùng Zoom/YouTube embed |
| ❌ MinIO / S3 migration | Local disk đủ MVP, interface abstract sẵn |
| ❌ Bán sản phẩm vật lý | Không bao giờ trong scope |
| ❌ Remarketing automation phức tạp | Hangfire email đơn giản |
| ❌ Multi-language UI (EN/VI) | Vietnamese-first, localization sau MVP |
| ❌ Dark mode toàn site | Chỉ dark cho video player, còn lại light |
| ❌ Social login khác (Facebook, Apple) | Chỉ Google + Email/Pass |

---

> **Ghi chú V3:** Mọi thay đổi backend / DB / API so với V2 phải được ghi rõ
> với lý do và ngày thay đổi trong section liên quan.
> Frontend User-facing spec (Mục 9–11) là nguồn sự thật cho thiết kế UI —
> mọi implementation cần review lại spec này trước khi code.


---

## 15. Admin Panel Design Standards

> Version: 1.0 — Added during session implementing admin general adjustments.

### 15.1 Shared Components

#### AdminPagination
src/app/admin/_components/AdminPagination.tsx

Props: { page, totalPages, totalCount, pageSize, onPageChange }
- Shows rom–to / total counter on the left
- Sliding window page buttons (±2 from current page) in the center
- Prev/Next arrow buttons
- Used in: /admin/users, /admin/courses (and all future list pages)

#### ActionButtons
src/app/admin/_components/ActionButtons.tsx

Props: { viewHref?, editHref?, onEdit?, onDelete?, canDelete? }
- **Xem** (View): gray border + eye icon → <Link href={viewHref}>
- **Sửa** (Edit): indigo bg/border + pencil icon → <Link href={editHref}> or onClick={onEdit}
- **Xóa** (Delete): red bg/border + trash icon → onClick={onDelete} (hidden when canDelete=false or onDelete is undefined)
- Used in: all admin list pages (/admin/users, /admin/levels, /admin/roles, etc.)

#### ImageUpload
src/components/ImageUpload.tsx

Props: { value, onChange, uploadFn, shape ("circle"|"rect"), className, placeholder, disabled }
- Shows image preview with hover "Đổi ảnh" overlay
- Empty state: upload icon + placeholder text
- On click → opens <input type="file" accept="image/jpeg,image/png,image/webp">
- Calls uploadFn(File) => Promise<string> → URL → calls onChange(url)
- Shows spinner during upload, error message on failure
- Used in: /admin/users (edit profile modal), /admin/users/[id] (edit mode), /profile (TeacherProfileTab avatar + cover)

### 15.2 Button Color Convention

| Action | Background | Border | Text |
|--------|-----------|--------|------|
| View (Xem) | white | gray-300 | gray-600 |
| Edit (Sửa) | indigo-600 | indigo-600 | white |
| Delete (Xóa) | red-600 | red-600 | white |

### 15.3 Image Upload API Endpoints

| Endpoint | Purpose | Auth |
|----------|---------|------|
| POST /api/v1/admin/users/{id}/avatar | Admin uploads avatar for any user | Admin |
| POST /api/v1/users/me/avatar | User uploads their own avatar | Authenticated |
| POST /api/v1/users/me/teacher-profile/image?type=avatar\|cover | Teacher uploads profile avatar or cover image | Authenticated (Teacher) |

- Accepted formats: JPEG, PNG, WebP
- Max file size: 5 MB
- Request: multipart/form-data with field name ile
- Response: { avatarUrl: string } or { url: string } depending on endpoint

### 15.4 Pagination Convention

- Page size: 20 items (constant PAGE_SIZE = 20)
- AdminPagination receives page, 	otalPages, 	otalCount, pageSize, onPageChange
- Data APIs return { items[], page, pageSize, totalCount, totalPages }

### 15.5 Admin Nav Items (Current)

`
Dashboard | Người dùng | Vai trò | Khóa học | Cấp độ
`
- "Giáo viên" nav item was removed (teacher profiles managed from Users list)
