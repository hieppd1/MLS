# MLS — Tổng hợp tiến độ dự án

> **Cập nhật lần cuối:** 27/05/2026  
> **Phiên bản thiết kế:** MASTER_DESIGN_V4 (v4.2)  
> **VPS:** http://103.20.97.97 — Deploy script: `deploy/deploy-phase5.ps1`

---

## Tổng quan nhanh

| Phase | Tên | Trạng thái | Ghi chú |
|-------|-----|-----------|---------|
| Phase 0 | Infrastructure & Foundation | ✅ DONE | Docker, CI/CD, PostgreSQL schema |
| Phase 1 | Auth & User Management | ✅ ~95% DONE | JWT, Refresh Token, Google OAuth, OTP |
| Phase 2A | Course CMS + Video | ✅ ~95% DONE | CRUD courses/modules/lessons, HLS video |
| Phase 2B | Interactive Learning Backend | ✅ DONE | Session/Segment/LearningAsset, 62 tests passed |
| Phase 2C | Interactive CMS Editor | ✅ DONE | Admin UI: Timeline Editor, Segment Editor |
| Phase 2D | Realtime Video Comment + Pricing | ✅ DONE | SignalR video comment, Course pricing cards |
| Phase 3 | Quiz Engine + Placement Test | ✅ DONE | OPIC, VSTEP, Realtime Quiz, Placement Test |
| Phase 4 | Commerce & Payment | ✅ DONE | Orders, Activation codes, Book Commerce |
| Phase 5 | Notifications + Teacher Marketplace | ✅ DONE | SignalR notifications, Teacher profiles |
| Phase 6 | Group Chat + Social | ✅ DONE | Group chat (SignalR), Follow, Groups |
| Phase 7+ | Analytics, Gamification, AI, Mobile | 🔧 Chưa bắt đầu | |

---

## Chi tiết từng Phase

### Phase 0 — Infrastructure ✅
- Docker Compose (PostgreSQL, Redis, RabbitMQ, Nginx)
- ASP.NET Core 10 Clean Architecture + CQRS (MediatR)
- Multi-tenant: schema `tenant_demo`
- VPS Ubuntu 22.04 tại 103.20.97.97

---

### Phase 1 — Auth & User Management ✅ ~95%
**Đã làm:**
- Đăng ký / Đăng nhập bằng email + Google OAuth
- JWT Access Token (15 phút) + Refresh Token (rotation, single-use)
- OTP xác thực email / phone
- RBAC: Admin / Teacher / Student
- Quản lý user profile, avatar upload
- Đổi mật khẩu, quên mật khẩu

**Còn lại (~5%):**
- 2FA (Two-Factor Authentication)
- Bulk user import

---

### Phase 2A — Course CMS + Video Learning ✅ ~95%
**Đã làm:**
- CRUD Course / CourseModule / Lesson (Video, PDF, Audio, Reading)
- Upload video → FFmpeg HLS transcode → 3 bitrates (360p/720p/1080p)
- Custom HLS.js video player (Play/Pause/Seek/Volume/Speed/Fullscreen/PIP/Bookmark)
- Course catalog, Course detail, Course enrollment
- Teacher portal: quản lý khóa học riêng
- Lesson completion tracking (WatchPercentage, PassScore)

**Còn lại (~5%):**
- Subtitle/CC (.vtt) injection
- Watermark PDF động

---

### Phase 2B — Interactive Learning Backend ✅ DONE
**Đã làm:**
- Schema: `Sessions`, `Segments`, `LearningAssets` (7 loại: Grammar/Vocab/Quiz/Exercise/PPT/Note/FileAttachment)
- API: CRUD Session/Segment/Asset cho Admin CMS
- API: Student learning flow — start/resume/complete session, segment progress, asset interactions
- Quiz embedded trong Segment (QuizBlock, ExerciseBlock)
- Business rules: session complete cần watch ≥ 80%, segment timestamps không overlap
- **62/62 unit tests passed**

---

### Phase 2C — Interactive CMS Editor ✅ DONE
**Đã làm:**
- `/admin/sessions/[id]` — Timeline Editor: visual segment blocks + upload video
- Segment modal: form tạo/sửa với mm:ss timestamp input
- Asset manager per segment: CRUD tất cả 7 loại asset
- Conflict/validation highlight (overlap → lỗi đỏ)
- Publish/Unpublish toggle

---

### Phase 2D — Realtime Comment + Pricing ✅ DONE
**Đã làm:**
- Realtime video comment với SignalR — comment gắn timestamp trên video
- Comment dots trên Segment Timeline Bar
- Course Pricing Cards (3 tiers: Basic/Standard/Advance)
- Feature gate overlay cho tính năng premium

---

### Phase 3 — Quiz Engine + Placement Test ✅ DONE
**Đã làm:**

**Quiz Engine:**
- Question bank: MultipleChoice / FillInBlank / Speaking / Writing
- Quiz management: tạo quiz, gắn câu hỏi, publish
- Quiz attempt: start/submit/result
- Admin quiz config: Loại Quiz từ DB (OPICMockTest, OPICMiniTest, VSTEP...)

**Placement Test:**
- Adaptive placement test (6 levels)
- Kết quả → gợi ý level phù hợp

**OPIC (Oral Proficiency Interview):**
- Survey: chọn chủ đề (≥3) + cấp độ mục tiêu + độ khó hiện tại
- Phiên 1 (câu 1–7) → Mid-Adjust (Dễ hơn / Giữ nguyên / Khó hơn) → Phiên 2 (câu 8–15)
- Audio playback cho từng câu (speakingTimeLimitSec, số lần nghe lại)
- Ghi âm + upload câu trả lời
- Kết quả: Level badge (NH/IL/IM1/IM2/IM3/IH/AL) + 5 skill scores
- Lịch sử thi + tiếp tục session dở
- Teacher: Analytics (phân bố level, 5 kỹ năng trung bình), danh sách học viên, Script mẫu

**VSTEP (Vietnam Standardized Test of English Proficiency):**
- Đề thi VSTEP chuẩn format
- Thi online với timer

**Realtime Quiz:**
- Teacher tạo session realtime quiz, học viên join bằng code
- Điểm cập nhật live qua SignalR

---

### Phase 4 — Commerce & Payment ✅ DONE
**Đã làm:**
- Order management: tạo đơn, xử lý thanh toán
- Activation code: kích hoạt khóa học bằng mã
- Book commerce: bán sách giáo trình
- Course enrollment từ order
- Giỏ hàng, checkout flow

---

### Phase 5 — Notifications + Teacher Marketplace ✅ DONE
**Đã làm:**
- SignalR NotificationHub: real-time notifications
- Notification bell trong header (badge số chưa đọc, dropdown danh sách)
- Teacher profile: slug, avatar, headline, bio, social links
- Teacher public page: `/giao-vien/[slug]`
- Follow/Unfollow teacher
- Teacher dashboard: danh sách khóa học, doanh thu cơ bản

**Deploy VPS (27/05/2026):**
- Build backend + frontend thành công
- Phase 5 DB migration + seed hoàn tất
- App live tại http://103.20.97.97

---

### Phase 6 — Group Chat + Social ✅ DONE
**Đã làm:**
- Group creation + member management (join/leave/approve)
- Group chat realtime (SignalR GroupChatHub): text + file attachment + image
- Message delete
- Typing indicator
- Unread count badge
- AppShell col2 sidebar: MessagesSidebar (danh sách nhóm)
- `/nhom` page: mobile-friendly group list + ChatRoom
- Group discovery
- Friend system (bạn bè)

---

## Frontend — Các trang đã có

| Route | Mô tả |
|-------|-------|
| `/` | Trang chủ: banner, danh sách khóa học, giáo viên |
| `/khoa-hoc` | Catalog khóa học (filter level) |
| `/khoa-hoc/[id]` | Chi tiết khóa học + mua |
| `/hoc/[lessonId]` | Xem bài học cũ (Video/PDF/Audio) |
| `/learn/[sessionId]` | Học interactive (Session V4) |
| `/placement-test` | Kiểm tra xếp lớp |
| `/thi-online` | Trang thi online (VSTEP, OPIC) |
| `/opic/survey` | Survey chọn chủ đề OPIC |
| `/opic/[sessionId]/play` | Màn hình thi OPIC |
| `/opic/[sessionId]/result` | Kết quả OPIC |
| `/opic/history` | Lịch sử thi OPIC |
| `/vstep/[...]` | Thi VSTEP |
| `/quiz/[...]` | Quiz thông thường |
| `/realtime/[...]` | Realtime quiz |
| `/my-courses` | Khóa học đã kích hoạt |
| `/my-lesson` | Bài học mới (feed) |
| `/following` | Giáo viên đang theo dõi |
| `/groups` | Nhóm học của tôi |
| `/nhom` | Chat nhóm (mobile-first) |
| `/saved` | Đã lưu |
| `/liked` | Đã thích |
| `/friends` | Bạn bè |
| `/giao-vien/[slug]` | Trang công khai giáo viên |
| `/profile` | Trang cá nhân |
| `/settings` | Cài đặt tài khoản |
| `/don-hang` | Đơn hàng |
| `/gio-hang` | Giỏ hàng |
| `/kich-hoat` | Kích hoạt mã khóa học |
| `/sach` | Thư viện sách |
| `/thu-vien-sach` | Danh sách sách |
| `/teacher/[...]` | Portal giáo viên |
| `/admin/[...]` | Admin panel |
| `/superadmin/[...]` | Superadmin panel |

---

## AppShell Layout

```
┌────────┬─────────────────────────────────────────────┐
│ Col1   │ Col2 (toggle)   │ Col3 (main content)        │
│ 72px   │ 290px / 28px    │ flex-1                     │
│ Nav    │ Messages        │                            │
└────────┴─────────────────────────────────────────────┘
```

- **Col1 (mls-col1):** Nav icon + label (Bài học mới, Khoá đã kích hoạt, Nhóm, Theo dõi, Đã lưu, Đã thích, Bạn bè)
- **Col2 (mls-col2):** MessagesSidebar — ẩn/hiện bằng toggle, khi ẩn hiện strip 28px với nút expand
- **Mobile (≤767px):** Col1 + Col2 ẩn, hiện bottom nav bar

---

## Infrastructure (Local Dev)

| Service | Cách chạy | Port |
|---------|-----------|------|
| PostgreSQL | Windows native | 5432 |
| Redis | Docker (`mls_redis`) | 6379 |
| RabbitMQ | Docker (`mls_rabbitmq`) | 5672 / 15672 |
| Backend (.NET 10) | `dotnet run --project MLS.API/MLS.API.csproj` | 5009 |
| Frontend (Next.js) | `npm run dev` (Turbopack) | 3000 |

**Demo accounts (pass: `Test@123`):**
- `teacher01@demo.com` — Teacher
- `student@demo.com` — Student
- `admin01@gmail.com` — Admin

---

## Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| Backend | ASP.NET Core 10, Clean Architecture, CQRS (MediatR), EF Core, FluentValidation |
| Frontend | Next.js 15 (App Router, Turbopack), Redux Toolkit + RTK Query, Tailwind CSS |
| Realtime | SignalR (NotificationHub, GroupChatHub) |
| Auth | JWT Bearer (15 phút), Refresh Token rotation, `ClockSkew = Zero` |
| DB | PostgreSQL 18, schema `tenant_demo` |
| Cache | Redis 7 |
| Queue | RabbitMQ 3 |
| Video | HLS.js, FFmpeg transcode |
| Deploy | Docker Compose, Nginx reverse proxy |

---

## Việc cần làm tiếp theo (Backlog)

### Ngắn hạn (bugfix / polish)
- [ ] NotificationHub: 401 lỗi khi chưa login → graceful handling (chỉ connect khi đã auth)
- [ ] Thumbnail 404 trên localhost (file local không có) → placeholder fallback
- [ ] OPIC: Kết nối AI chấm điểm Speaking (GPT-4o Audio API)
- [ ] VSTEP: Hoàn thiện đề thi đầy đủ

### Phase 7 — Analytics & Gamification
- [ ] Segment-level analytics: drop rate, replay rate, quiz fail rate
- [ ] Teacher dashboard: session analytics, heatmap
- [ ] Điểm thưởng (Points), Huy hiệu (Badges), Bảng xếp hạng (Leaderboard)
- [ ] Streak daily learning

### Phase 8 — AI Features
- [ ] Speaking AI chấm bằng GPT-4o Audio
- [ ] Writing AI chấm bằng GPT-4o mini
- [ ] AI Recommendation: gợi ý bài học/khóa học

### Phase 9 — Mobile App
- [ ] React Native app (iOS + Android)

### Chưa làm
- [ ] Certificate PDF generation + QR verify
- [ ] 2FA Authentication
- [ ] Admin bulk user import
- [ ] Subtitle/CC (.vtt) cho video
- [ ] Watermark PDF động
- [ ] MiniTest OPIC (8 câu, đang phát triển)
- [ ] Python FastAPI AI Service (self-hosted scoring)
- [ ] Coupon / Discount system
- [ ] Affiliate / Referral system
