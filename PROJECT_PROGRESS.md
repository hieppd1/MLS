# MLS PLATFORM — TỔNG HỢP TIẾN ĐỘ DỰ ÁN

> **Cập nhật:** 31/05/2026 (Phase 4S Shipping ✅ · Phase 7 đang hoàn thiện · Vòng i18n vi/en/ko đạt ~92%)  
> **Nguồn tham chiếu:** MASTER_DESIGN_V4.md · phase3_quiz_design_advanced.md · BOOK_COMMERCE_DESIGN.md · PHASE6_GROUP_CHAT_DESIGN.md · shipping_viettelpost_module_analysis_vi.md · PHU_LUC_YEU_CAU_CHUC_NANG.md · i18n-multilang-design.md  
> **Stack:** ASP.NET Core 10 · Next.js 16.2.5 · PostgreSQL 18 · Redis · RabbitMQ · SignalR  
> **Localhost:** Backend `http://localhost:5009` (cần `ASPNETCORE_ENVIRONMENT=Development`) · Frontend `http://localhost:3000`

### Điểm thay đổi gần nhất (31/05/2026)
- ✅ Vòng i18n đa ngôn ngữ (vi/en/ko): ~65 namespace, đã phủ Auth/Course/Book/Cart/Checkout/Quiz/OPIC/VSTEP/Realtime/Admin/Teacher portal, công cụ format tiền/ngày/số theo locale, hreflang + og:locale, `PUT /users/me/locale` đồng bộ.
- ✅ Backend bổ sung `CourseTranslations`, `BookTranslations`, `NotificationTemplates` (migration đã chạy local) + fallback chain `ko → en → vi` trong query handler khoá học/sách.
- ✅ 14 controller dùng `IStringLocalizer<SharedResource>` cho thông báo lỗi.
- 🟡 Còn lại Task #14 (Handlebars NotificationTemplates) và Task #16 (E2E 3-locale smoke).
- ✅ Phase 4S Shipping ViettelPost hoàn thành (28/05/2026).
- 🔄 Phase 7 Sprint 7.2 — User Analytics backend đã có, frontend dashboard đang hoàn thiện.

---

## TỔNG QUAN NHANH

| Phase | Tên | Trạng thái | % Hoàn thành |
|-------|-----|-----------|-------------|
| **Phase 0** | Infrastructure & Foundation | ✅ HOÀN THÀNH | 100% |
| **Phase 1** | Auth & User Management | ✅ ~95% | 95% |
| **Phase 2A** | Course CMS + Video Learning | ✅ ~95% | 95% |
| **Phase 2B** | Interactive Learning Backend | ✅ HOÀN THÀNH | 100% |
| **Phase 2C** | Interactive CMS Editor | ✅ HOÀN THÀNH | 100% |
| **Phase 2D** | Realtime Comments + Course Pricing | ✅ ~90% | 90% |
| **Phase 3** | Quiz Engine + AI Evaluation | 🔄 ~80% | 80% (AI grading mock) |
| **Phase 4** | Commerce & Payment | ✅ ~90% | 90% |
| **Phase 4S** | Shipping Module (ViettelPost) | ✅ HOÀN THÀNH | 100% |
| **Phase 5** | Gamification & Analytics V4 | 🔄 ~20% | 20% |
| **Phase 6** | Group Chat + Support Chat | ✅ HOÀN THÀNH | 100% |
| **Phase 7** | Analytics V2 + Course Chat Group | 🔄 ~70% | 70% |
| **Mobile App** | React Native | 🟡 IN PROGRESS | 75% |

---

## CHI TIẾT TỪNG PHASE

---

### ✅ PHASE 0 — Infrastructure & Foundation (HOÀN THÀNH)

| Hạng mục | Trạng thái |
|----------|-----------|
| Docker Compose: Redis, RabbitMQ | ✅ Done |
| ASP.NET Core 10 — Clean Architecture + CQRS (MediatR 14) | ✅ Done |
| Multi-tenant middleware (X-Tenant-Slug header) | ✅ Done |
| PostgreSQL schema per tenant + DatabaseInitializer | ✅ Done |
| GET /health endpoint | ✅ Done |

---

### ✅ PHASE 1 — Auth & User Management (~95% HOÀN THÀNH)

#### Đã làm ✅
| Hạng mục | Trạng thái |
|----------|-----------|
| Đăng ký Email + BCrypt | ✅ Done |
| Đăng nhập JWT + Refresh Token rotation | ✅ Done |
| Google OAuth 2.0 / Device tracking | ✅ Done |
| Logout / Logout all devices | ✅ Done |
| Forgot password / Reset password | ✅ Done |
| Email verification (verify + resend) | ✅ Done |
| Avatar upload | ✅ Done |
| Sessions management (GET/DELETE) | ✅ Done |
| GET/PUT /api/v1/users/me | ✅ Done |
| PUT /api/v1/users/me/password | ✅ Done |
| Admin: /admin/users — bảng + filter + tìm kiếm + phân trang | ✅ Done |
| Admin: /admin/users/[id] — user detail + edit roles | ✅ Done |
| Admin: /admin/roles — CRUD roles + permissions editor | ✅ Done |
| Frontend: /register + /login + Google OAuth button | ✅ Done |
| Frontend: /forgot-password, /reset-password, /verify-email | ✅ Done |
| Frontend: /settings/sessions, /profile | ✅ Done |
| Frontend: Redux authSlice + RTK Query + AuthGuard HOC | ✅ Done |

#### Còn thiếu ❌
| Hạng mục | Ghi chú |
|----------|---------|
| SMS OTP via Esms.vn | Chưa tích hợp |
| Rate limit OTP: max 3 lần/15 phút/IP | Chưa làm |

---

### ✅ PHASE 2A — Course CMS + Video Learning (~95% HOÀN THÀNH)

#### Backend đã làm ✅
| Hạng mục | Trạng thái |
|----------|-----------|
| Course CRUD API đầy đủ | ✅ Done |
| CourseStatus workflow (Draft → Publish → Hide → Archive) | ✅ Done |
| Clone course / Submit for review | ✅ Done |
| CourseLevels CRUD / LearningLevels CRUD | ✅ Done |
| Module CRUD (thumbnailUrl, estimatedDuration) | ✅ Done |
| Lesson CRUD (video, pdf, audio, reading types) | ✅ Done |
| Video upload + FFmpeg HLS transcode (Hangfire) | ✅ Done |
| VideoAsset status tracking | ✅ Done |
| Lesson Document upload/delete | ✅ Done |
| Static file serving /media/* | ✅ Done |
| BannerSlide CRUD | ✅ Done |
| TeacherProfile + TeacherFollower entities | ✅ Done |
| Auto-create TeacherProfile khi gán Teacher role | ✅ Done |
| Teacher Marketplace APIs (follow, slug lookup, courses) | ✅ Done |
| Enroll course / LessonProgress tracking | ✅ Done |
| VideoTracking (resume từ vị trí cũ) | ✅ Done |
| Learning streak API | ✅ Done |

#### Frontend đã làm ✅
| Hạng mục | Trạng thái |
|----------|-----------|
| Admin: /admin/courses — danh sách + filter + grid | ✅ Done |
| Admin: /admin/courses/[id] — edit form đầy đủ | ✅ Done |
| Admin: Clone/Hide course, Module/Lesson CRUD modals | ✅ Done |
| Admin: /admin/lessons/[id] — video upload + tài liệu đính kèm | ✅ Done |
| Admin: Drag-drop reorder modules/lessons | ✅ Done |
| Admin: Transcode status indicator (polling) | ✅ Done |
| Admin: /admin/settings/banners — CRUD banner slides | ✅ Done |
| Admin: /admin/teachers — danh sách + quản lý teacher profile | ✅ Done |
| User: / — Homepage (discovery) | ✅ Done |
| User: /courses — course catalog (banner carousel, filter) | ✅ Done |
| User: /courses/[id] — course detail (enrollment-aware) | ✅ Done |
| User: /giao-vien/[slug] — public teacher page | ✅ Done |
| User: HlsPlayer — đầy đủ tính năng | ✅ Done |
| URL migration (/khoa-hoc → /courses, /hoc → /learn) | ✅ Done |

#### Còn thiếu ❌
| Hạng mục | Ưu tiên |
|----------|---------|
| FFmpeg → 3 bitrates (360p + 720p + 1080p) | Medium |
| Subtitle SRT → WebVTT pipeline | Low |
| Bookmark & Notes persist DB (hiện localStorage) | Low |
| Enrollment expiry + access check | Medium |
| Bulk publish/unpublish modules/lessons | Low |
| /hoc/[lessonId] — V3 lesson player (PDF/Audio/Reading) | Low |
| Subtitle/CC support (.vtt track) | Low |

---

### ✅ PHASE 2B — Interactive Learning Backend (HOÀN THÀNH 100%)

| Hạng mục | Trạng thái |
|----------|-----------|
| Session entity + EF config + DDL | ✅ Done |
| Segment entity (startTime/endTime, không overlap) | ✅ Done |
| LearningAsset entity (7 types, metadata JSONB) | ✅ Done |
| SessionProgress + SegmentProgress tracking | ✅ Done |
| CQRS: Session/Segment/Asset CRUD handlers | ✅ Done |
| SessionLearning APIs: UpdatePosition, RecordInteraction, CompleteSession | ✅ Done |
| Business rules: watch ≥ 80%, segment bounds validation | ✅ Done |
| QuizBlock submit → server-graded, trả feedback từng câu | ✅ Done |
| **62 unit tests — 62/62 Passed** | ✅ Done |

---

### ✅ PHASE 2C — Interactive CMS Editor (HOÀN THÀNH 100%)

| Hạng mục | Trạng thái |
|----------|-----------|
| Admin: /admin/sessions/[id] — Session Editor + Visual Timeline Bar | ✅ Done |
| Admin: Inline segment creation (modal, mm:ss input) | ✅ Done |
| Admin: Segment overlap validation (ConflictException shown) | ✅ Done |
| Admin: Asset Forms modal — 7 types (Grammar/Vocab/Quiz/Exercise/PPT/Note/File) | ✅ Done |
| Admin: Publish/Unpublish session toggle | ✅ Done |
| Admin: /admin/modules/[id] → tab Sessions + Lessons riêng | ✅ Done |
| User: /learn/[id] — Interactive Session Player | ✅ Done |
| User: HLS video player + Segment Timeline Bar | ✅ Done |
| User: Asset dots trên timeline + jump-to-timestamp | ✅ Done |
| User: Active Segment Panel (auto-activate theo currentTime) | ✅ Done |
| User: 7 Asset Type Panels (full UI) | ✅ Done |
| User: QuizBlock submit + feedback per câu | ✅ Done |
| User: SessionProgress + SegmentProgress tracking | ✅ Done |
| RTK Query: full API layer cho Session/Segment/Asset | ✅ Done |

---

### 🔄 PHASE 2D — Realtime Comments + Course Pricing (~90% HOÀN THÀNH)

#### UC1: Realtime Video Comment System ✅ BACKEND HOÀN THÀNH

| Hạng mục | Trạng thái | Ghi chú |
|----------|-----------|---------|
| VideoComment, CommentReaction entities | ✅ Done | Domain entities có sẵn |
| SessionCommentsController (7 endpoints) | ✅ Done | `SessionCommentsController.cs` |
| VideoCommentHub (SignalR) — Join/Leave/Events | ✅ Done | `VideoCommentHub.cs` |
| CQRS: CommentCommands, CommentQueries | ✅ Done | `Learning/Commands/CommentCommands.cs` |
| Anti-spam / moderate | ✅ Done | |
| Frontend: Tab "Bình luận" trong /learn/[id] | 🔄 Đang làm | Cần verify UI có đầy đủ chưa |
| Frontend: Timeline markers (comment dots) | 🔄 Đang làm | |

#### UC2: Course Pricing & Package System ✅ ~95% HOÀN THÀNH

| Hạng mục | Trạng thái | Ghi chú |
|----------|-----------|---------|
| Entities: CoursePackage, PackageEntitlement, StudentPackage | ✅ Done | |
| AdminPackagesController (CRUD packages) | ✅ Done | |
| CoursePackagesController (public + student endpoints) | ✅ Done | |
| CQRS: CreatePackage, UpdatePackage, Activate, Archive | ✅ Done | |
| CQRS: PurchasePackage, GetMyPackages, CheckFeatureAccess | ✅ Done | |
| Admin UI: AdminPackageManager.tsx — 3-tier editor | ✅ Done | |
| Public UI: PricingCards.tsx — hiển thị + mua gói | ✅ Done | |
| Auto-create 3 gói mặc định khi tạo khóa học mới | ✅ Done | **Fix 25/05/2026** |
| Teacher Portal: Tab "Giá & Thương mại" + AdminPackageManager | ✅ Done | **Fix 25/05/2026** |
| Teacher role quyền truy cập /admin/packages/* | ✅ Done | **Fix 25/05/2026** |
| /courses/[id] → PricingCards thay hardcoded sidebar | ✅ Done | **Fix 25/05/2026** |
| Feature Gate Overlay (`<FeatureGateOverlay>` component) | ❌ Chưa làm | |
| `useFeatureAccess(featureCode, courseId)` hook | ❌ Chưa làm | |
| Áp dụng Feature Gate cho VocabularyBlock, SpeakingBlock | ❌ Chưa làm | |

---

### 🔄 PHASE 3 — Quiz Engine + AI Evaluation (~80% HOÀN THÀNH)

> Quiz Engine + OPIC + VSTEP ✅ ~95%. **AI grading (Speaking/Writing) hiện đang mock** — khung worker + rubric đã sẵn, chưa tích hợp Whisper/GPT-4o thật. Xem mục "AI Service" bên dưới.

#### Phase 3.1 — Standard Quiz Mode ✅ HOÀN THÀNH

| Sprint | Hạng mục | Trạng thái |
|--------|----------|-----------|
| Sprint 1–5 | Quiz CRUD (Teacher), Question Bank | ✅ Done |
| Sprint 1–5 | Quiz Player (Student) — MCQ, FillBlank, TrueFalse | ✅ Done |
| Sprint 1–5 | Placement Test (xếp lớp Level 1–6) | ✅ Done |
| Sprint 1–5 | Interactive Quiz (Video trigger) | ✅ Done |
| Sprint 1–5 | QuizAnalytics cơ bản | ✅ Done — `QuizAnalyticsController.cs` |
| Sprint 6 | Speaking AI — SpeakingSubmission, Worker pipeline, Recorder UI | ✅ Done — `SpeakingGradingWorker.cs` |
| Sprint 7 | Writing AI — WritingSubmission, Worker, EssayEditor | ✅ Done — `WritingGradingWorker.cs` |
| Sprint 8 | Adaptive Quiz (AdaptiveEngine — điều chỉnh độ khó) | ✅ Done — `/quiz/[id]/adaptive` |
| Sprint 9–10 | Realtime Quiz (SignalR Hub, Redis, Leaderboard) | ✅ Done — `QuizHub.cs` + `RealtimeQuizRoom` entity |

**Frontend Realtime Quiz:**
- `/realtime/join` — trang học sinh nhập code phòng ✅
- `/realtime/[code]/play` — student play realtime ✅
- `/teacher/realtime/new` — teacher tạo phòng ✅
- `/teacher/realtime/[id]/host` — teacher điều khiển phòng ✅

#### Phase 3.2 — OPIC Mode ✅ HOÀN THÀNH

| Hạng mục | Trạng thái | Ghi chú |
|----------|-----------|---------|
| OPICSession entity (15 câu / 5 combos / 2 sessions) | ✅ Done | `OPICEntities.cs` |
| Survey flow (chủ đề, cấp độ, độ khó) | ✅ Done | |
| Phiên 1 (câu 1–7) + Mid-Adjust + Phiên 2 (câu 8–15) | ✅ Done | |
| Audio question playback (giới hạn số lần nghe) | ✅ Done | |
| Speaking recorder + upload + AI grading (OPIC rubric) | ✅ Done | |
| OPIC Level band result (NH/IL/IM1-3/IH/AL) | ✅ Done | |
| OPIcLevelEngine (thay PlacementRuleEngine) | ✅ Done | |
| Teacher: Tạo quiz OPIC, Script mẫu, Quản lý câu hỏi | ✅ Done | |
| Teacher: Cài đặt ExamModeTag từng câu | ✅ Done | |
| Teacher OPIC Analytics Dashboard | ✅ Done | |
| `/opic/survey`, `/opic/{sessionId}/play`, `/opic/{sessionId}/result` | ✅ Done | |
| `/opic/history`, `/teacher/opic`, `/teacher/opic/scripts` | ✅ Done | |

#### Phase 3.3 — VSTEP Mode 🔄 ĐANG TEST (~80%)

| Hạng mục | Trạng thái | Ghi chú |
|----------|-----------|---------|
| VSTEPSession entity, VSTEPBandEngine (A2/B1/B2/C1) | ✅ Done | `VSTEPEntities.cs` |
| VSTEPController — CreateSession, StartPart, SubmitPart | ✅ Done | |
| PassageGroup entity (Listening/Reading MCQ groups) | ✅ Done | |
| Teacher: Passage CRUD, Quiz assignment | ✅ Done | `/teacher/vstep/passages`, `/teacher/vstep/sessions` |
| Part Listening — MCQ (35 câu) | ✅ Done | `/vstep/[sessionId]/listening` |
| Part Reading — MCQ (40 câu) | ✅ Done | `/vstep/[sessionId]/reading` |
| Part Writing — Essay task (2 tasks) | ✅ Done | `/vstep/[sessionId]/writing` |
| Part Speaking — 3 parts recorder | ✅ Done | `/vstep/[sessionId]/speaking` |
| VSTEP Result page (Band kết quả) | ✅ Done | `/vstep/[sessionId]/result` |
| AI chấm Writing/Speaking (giả lập + real) | ✅ Done | `WritingGradingWorker` + `SpeakingGradingWorker` |
| Đang test end-to-end | 🔄 Testing | |
| VSTEPBandEngine fine-tuning scoring | 🔄 Cần review | |

#### AI Service

> ⚠️ **Audit 31/05/2026:** AI grading workers hiện đang chạy ở **chế độ MOCK** (random scores + feedback cứng). Khung pipeline + rubric đã sẵn sàng, chỉ cần plug provider thật.

| Hạng mục | Trạng thái | Ghi chú |
|----------|-----------|---------|
| `SpeakingGradingWorker` (BackgroundService + in-memory queue + SignalR `AiGradingProgress`) | ✅ Done | `SpeakingGradingWorker.cs` |
| `WritingGradingWorker` (BackgroundService + in-memory queue + SignalR `AiGradingProgress`) | ✅ Done | `WritingGradingWorker.cs` |
| Lifecycle submission: `SetProcessing` → `SetGraded`/`SetFailed` + push realtime | ✅ Done | |
| Tenant context set trước khi resolve DbContext (fix schema) | ✅ Done | |
| Rubric weights theo `ExamModeTag` (opic_describe / vstep_part1-3 / letter / essay_vstep …) | ✅ Done | Logic `CalculateFinalScore` đã chuẩn |
| OPIC band engine (NH/IL/IM1-3/IH/AL) | ✅ Done | `OPIcLevelEngine` |
| VSTEP band engine (A2/B1/B2/C1) | ✅ Done | `VSTEPBandEngine` |
| **Speaking — Whisper STT + phoneme analysis** | ❌ Mock | `MockGrade()` random 60–92, transcript = chuỗi cứng |
| **Speaking — GPT-4o Audio scoring & feedback** | ❌ Mock | TODO trong worker (`// TODO: Replace with actual Whisper STT + phoneme analysis + GPT-4o`) |
| **Writing — LanguageTool grammar check** | ❌ Mock | `grammarErrors` hard-coded JSON |
| **Writing — GPT-4o rubric + lexical analysis** | ❌ Mock | TODO trong worker; CEFR distribution hard-coded |
| OpenAI/Azure SDK client trong Infrastructure | ❌ Chưa có | Không có package `OpenAI`/`Azure.AI.OpenAI`, không có `OpenAI:ApiKey` trong appsettings |
| Rate limit AI/user/ngày (AI-03) | ❌ Chưa làm | Phải có trước khi bật provider thật |
| Python FastAPI service riêng biệt | ❌ Chưa tách | Có thể giữ trong .NET worker, không bắt buộc |

---

### ✅ PHASE 4 — Commerce & Payment (~90% HOÀN THÀNH)

> **DB Migration:** `20260521095603_AddBookCommerce.cs` đã chạy (21/05/2026)

#### Book Commerce ✅ HOÀN THÀNH

| Hạng mục | Trạng thái | Ghi chú |
|----------|-----------|---------|
| Book entity (Ebook / Physical / Combo) + BookCategory | ✅ Done | `Book.cs`, `BookCategory.cs` |
| BookReview entity + CRUD | ✅ Done | `BookReview.cs` |
| BooksController (public catalog) | ✅ Done | |
| AdminBooksController (Admin CRUD + pricing) | ✅ Done | |
| MyBooksController (GET /api/v1/my-books) | ✅ Done | |
| BookReviewsController | ✅ Done | |
| Frontend: /sach — book catalog | ✅ Done | |
| Frontend: /sach/[slug] — book detail + reviews + add to cart | ✅ Done | |
| Frontend: /thu-vien-sach — my ebook library | ✅ Done | |
| Frontend: /admin/sach — Admin book management | ✅ Done | |
| EbookEntitlement + Signed URL download | ✅ Done | `EbookEntitlement.cs` |

#### Cart & Checkout ✅ HOÀN THÀNH

| Hạng mục | Trạng thái | Ghi chú |
|----------|-----------|---------|
| Cart (Redux cartSlice) | ✅ Done | Frontend state |
| Frontend: /gio-hang — cart page | ✅ Done | |
| Frontend: /thanh-toan — checkout page (chọn phương thức) | ✅ Done | VNPay / MoMo / BankTransfer |
| Frontend: /thanh-toan/ket-qua — kết quả thanh toán | ✅ Done | |
| CreateCheckoutCommand (tạo đơn hàng + build payment URL) | ✅ Done | |

#### Payment Integration ✅ (VNPay Sandbox ~95%, MoMo ~80%)

| Hạng mục | Trạng thái | Ghi chú |
|----------|-----------|---------|
| IVnPayService + VnPayService | ✅ Done | Sandbox — HMAC-SHA512 sign |
| IMomoPaymentService + MomoPaymentService | ✅ Done | |
| PaymentController — VNPay IPN callback | ✅ Done | |
| CheckoutController — tạo payment URL | ✅ Done | |
| ConfirmOrderPaymentCommand (sau IPN) | ✅ Done | |
| ConfirmOrderPaymentByCodeCommand (bank transfer confirm) | ✅ Done | |
| VNPay Production credentials (live) | ❌ Chưa go-live | Cần đăng ký merchant |

#### Order Management ✅ HOÀN THÀNH

| Hạng mục | Trạng thái | Ghi chú |
|----------|-----------|---------|
| Order, OrderItem entities | ✅ Done | |
| OrdersController (GET /api/v1/orders, /api/v1/orders/{id}) | ✅ Done | |
| AdminOrdersController | ✅ Done | |
| CancelOrderCommand | ✅ Done | |
| OrderPaidEvent → Grant enrollments, ebook access, activation codes | ✅ Done | Event handlers |
| SendOrderConfirmationEmailHandler | ✅ Done | |
| Frontend: /don-hang — danh sách đơn hàng | ✅ Done | |
| Frontend: /don-hang/[id] — chi tiết đơn | ✅ Done | |
| Frontend: /admin/don-hang — Admin quản lý đơn | ✅ Done | |

#### Invoice & Activation Code ✅ HOÀN THÀNH

| Hạng mục | Trạng thái | Ghi chú |
|----------|-----------|---------|
| Invoice entity + PDF (QuestPDF) | ✅ Done | `InvoiceTemplateDocument.cs` |
| InvoiceController (GET/download invoice PDF) | ✅ Done | |
| AdminInvoiceController | ✅ Done | |
| ActivationCode entity | ✅ Done | Kích hoạt sách in → mở tài nguyên LMS |
| ActivationController (`/api/v1/activation/verify` + `/activate`) | ✅ Done | |
| Frontend: /kich-hoat — trang nhập mã kích hoạt | ✅ Done | |
| GenerateActivationCodesHandler (auto khi mua Physical book) | ✅ Done | |

#### Voucher / Discount ✅ HOÀN THÀNH

| Hạng mục | Trạng thái | Ghi chú |
|----------|-----------|---------|
| Voucher entity | ✅ Done | `Voucher.cs` |
| AdminVouchersController (CRUD vouchers) | ✅ Done | |
| Frontend: /admin/vouchers | ✅ Done | |
| Apply voucher tại checkout | 🔄 Cần verify | |

#### Còn thiếu ❌

| Hạng mục | Ưu tiên |
|----------|---------|
| Certificate PDF generation + QR verify | Medium |
| VNPay Production (live merchant) | High khi go-live |
| Course purchase (gói học) qua checkout flow | Medium — hiện chỉ sách |
| ~~**Shipping Module**~~ | ✅ Hoàn thành — Phase 4S |

---

### ✅ PHASE 4S — Shipping Module ViettelPost (HOÀN THÀNH — 28/05/2026)

> **Tham chiếu thiết kế:** [shipping_viettelpost_module_analysis_vi.md](shipping_viettelpost_module_analysis_vi.md)  
> **Phạm vi:** Áp dụng cho sách vật lý (Physical Book) và combo khoá học + sách. **Không** áp dụng cho khoá học online, ebook, file download.

#### Backend — Domain & Infrastructure

| Hạng mục | Trạng thái | Ghi chú |
|----------|-----------|--------|
| `Shipment` entity (orderId, provider, trackingNumber, status, shippingFee, địa chỉ người nhận, provinceCode, districtCode, wardCode, rawResponse) | ✅ Done | `MLS.Domain/Entities/Shipment.cs` |
| `ShipmentTrackingLog` entity (shipmentId, status, description, rawData) | ✅ Done | cùng file trên |
| `ShippingStatus` enum (Pending/PickedUp/InTransit/Delivered/Failed/Returned/Cancelled) | ✅ Done | |
| `Order` bổ sung `ShippingStatus` + `ShippingProvider` columns + `UpdateShippingStatus()` | ✅ Done | `MLS.Domain/Entities/Order.cs` |
| `IShippingProvider` interface (CreateShipment, Track, Cancel, CalculateFee) | ✅ Done | `MLS.Application/Common/Interfaces/IShippingProvider.cs` |
| `ViettelPostProvider : IShippingProvider` — tích hợp API ViettelPost | ✅ Done | `MLS.Infrastructure/Shipping/ViettelPostProvider.cs` — token cache 23h, HMAC-SHA256 webhook |
| `ShippingSettings` config POCO | ✅ Done | `MLS.Infrastructure/Shipping/ShippingSettings.cs` |
| EF Core `ShipmentConfiguration` + `ShipmentTrackingLogConfiguration` | ✅ Done | `MLS.Infrastructure/Persistence/Configurations/ShipmentConfiguration.cs` |
| `IApplicationDbContext` + `ApplicationDbContext` bổ sung DbSets | ✅ Done | |
| DI registration (`services.AddHttpClient<IShippingProvider, ViettelPostProvider>()`) | ✅ Done | `MLS.Infrastructure/DependencyInjection.cs` |
| Migration SQL `deploy/shipping-migration.sql` — đã chạy thành công | ✅ Done | Tables + indexes + ALTER TABLE Orders |
| `appsettings.json` bổ sung section `"Shipping"` | ✅ Done | Cần điền credentials ViettelPost thật |

#### Backend — Application Layer (CQRS)

| Hạng mục | Trạng thái | Ghi chú |
|----------|-----------|--------|
| `CreateShipmentCommand` — tạo vận đơn ViettelPost | ✅ Done | `ShippingCommands.cs` |
| `CancelShipmentCommand` | ✅ Done | |
| `SyncShipmentStatusCommand` — đồng bộ thủ công | ✅ Done | |
| `ProcessViettelPostWebhookCommand` — xử lý callback, update shipment + order + tracking log | ✅ Done | Nếu Delivered → mark Order Complete |
| `CalculateShippingFeeQuery` | ✅ Done | `ShippingQueries.cs` |
| `GetShipmentQuery` / `GetShipmentByOrderIdQuery` / `TrackShipmentQuery` | ✅ Done | |
| `GetAdminShipmentsQuery` — paged list + filter | ✅ Done | |
| `CreateShipmentOnOrderPaidHandler` — auto tạo shipment khi order thanh toán | ✅ Done | `MLS.Application/Orders/Events/` — chỉ áp dụng cho Physical book |

#### Backend — API Controllers

| Hạng mục | Endpoint | Trạng thái |
|----------|----------|------------|
| Tính phí ship (AllowAnonymous) | `POST /api/v1/shipping/calculate-fee` | ✅ Done |
| Tạo shipment | `POST /api/v1/shipping/create` | ✅ Done |
| Lấy thông tin shipment | `GET /api/v1/shipping/{id}` | ✅ Done |
| Lấy shipment theo đơn hàng | `GET /api/v1/shipping/by-order/{orderId}` | ✅ Done |
| Tracking theo mã vận đơn | `GET /api/v1/shipping/tracking/{trackingNumber}` | ✅ Done |
| Hủy shipment | `POST /api/v1/shipping/{id}/cancel` | ✅ Done |
| Đồng bộ thủ công | `POST /api/v1/shipping/{id}/sync` | ✅ Done |
| Webhook ViettelPost (HMAC protected) | `POST /api/v1/webhooks/viettelpost` | ✅ Done |
| Admin: danh sách vận đơn | `GET /api/v1/admin/shipments` | ✅ Done |
| Admin: cấu hình shipping | `GET/PUT /api/v1/admin/settings/shipping` | ❌ Chưa làm |

#### Frontend

| Hạng mục | Trạng thái | Ghi chú |
|----------|-----------|--------|
| RTK Query `shippingApi.ts` (8 endpoints + `SHIPPING_STATUS_CONFIG`) | ✅ Done | `src/lib/features/shipping/shippingApi.ts` |
| Redux store đăng ký `shippingApi` | ✅ Done | |
| `/thanh-toan` — phí ship động qua API (tự động tính khi chọn tỉnh/huyện) | ✅ Done | |
| `/don-hang/[id]` — block "Thông tin giao hàng": mã VĐ, trạng thái badge, nút tracking | ✅ Done | |
| `/don-hang/[id]/tracking` — trang tracking timeline + lịch sử giao hàng | ✅ Done | |
| `/admin/van-don` — danh sách vận đơn + đồng bộ/hủy | ✅ Done | |
| Admin nav: mục "Vận đơn" đã thêm vào sidebar | ✅ Done | |
| `/admin/settings/shipping` — cấu hình ViettelPost | ❌ Chưa làm | |

#### Shipping Status (chuẩn hoá nội bộ)

| Internal Status | Mô tả |
|----------------|-------|
| `Pending` | Chờ lấy hàng |
| `PickedUp` | Đã lấy hàng |
| `InTransit` | Đang giao |
| `Delivered` | Giao thành công |
| `Failed` | Giao thất bại |
| `Returned` | Hoàn hàng |
| `Cancelled` | Đã hủy |

#### Cấu hình để dùng thật
- Điền `appsettings.json → Shipping: { Username, Password, WebhookSecret }` với credentials ViettelPost thật
- Không có credentials → shipment tạo ở trạng thái `Pending` (admin retry thủ công)
- Để `WebhookSecret` trống = bỏ qua validation (chỉ dùng khi dev)

#### Không triển khai giai đoạn này
- Warehouse/Inventory Management
- Split shipment
- Multi-carrier optimization (GHN/GHTK/J&T cần thêm sau)
- AI logistics / Delivery SLA analytics

---

### 🔄 PHASE 5 — Gamification & Analytics V4 (~20% HOÀN THÀNH)

| Hạng mục | Trạng thái | Ghi chú |
|----------|-----------|---------|
| **Analytics (đã làm)** | | |
| AdminAnalyticsController — doanh thu, top books, đơn hàng | ✅ Done | `AdminAnalyticsController.cs` |
| Frontend: /admin/analytics — Dashboard doanh thu + charts | ✅ Done | |
| QuizAnalytics per quiz (attempts, pass rate) | ✅ Done | `QuizAnalyticsController.cs` |
| Teacher: /teacher/quizzes/[id]/analytics | ✅ Done | |
| **Analytics (chưa làm)** | | |
| Segment-level analytics (drop rate, replay rate) | ❌ Chưa làm | |
| Asset interaction rate (grammar/word/quiz clicked %) | ❌ Chưa làm | |
| Teacher dashboard segment heatmap | ❌ Chưa làm | |
| Event-driven analytics pipeline (RabbitMQ → AnalyticsWorker) | ❌ Chưa làm | |
| **Gamification (chưa làm)** | | |
| Points system (XP per action) | ❌ Chưa làm | |
| Badges (First Session, 7-day streak, 100% quiz...) | ❌ Chưa làm | |
| Leaderboard (weekly, per course) | ❌ Chưa làm | |
| Streak calendar heatmap widget | ❌ Chưa làm | |
| **AI Recommendation (chưa làm)** | | |
| Personalized course recommendation | ❌ Chưa làm | |
| "Tiếp theo nên học" based on progress | ❌ Chưa làm | |

---

### ✅ PHASE 6 — Group Chat + Support Chat (100% HOÀN THÀNH)

> **Tham chiếu:** [PHASE6_GROUP_CHAT_DESIGN.md](PHASE6_GROUP_CHAT_DESIGN.md)  
> **Deploy:** VPS 103.20.97.97 — containers Up, nginx proxying `/hubs/` ✅

#### Sprint 6.1 — Foundation ✅ HOÀN THÀNH

| Hạng mục | Trạng thái |
|----------|-----------|
| 7 entity (ChatGroup, ChatGroupMember, ChatMessage, ChatMessageAttachment, SupportConversation, SupportMessage, ChatSettings) + Fluent config | ✅ Done |
| Migration SQL `phase6-chat-migration.sql` (idempotent, indexes, GIN trgm) | ✅ Done |
| GroupChatHub + SupportChatHub (SignalR) — JWT `?access_token=` auth | ✅ Done |
| Tenant-aware group naming `tenant:{slug}:group:{id}` | ✅ Done |

#### Sprint 6.2 — Group CRUD + Membership ✅ HOÀN THÀNH

| Hạng mục | Trạng thái |
|----------|-----------|
| CRUD nhóm (Create/Update/Delete soft) | ✅ Done |
| Discover (search + type filter), ListMine (with unread + lastMsg) | ✅ Done |
| Join Public (auto-approve) / Private (Pending) — Leave / Approve / Reject / Remove / Promote | ✅ Done |
| MaxGroupsPerUser + MaxMembersPerGroup enforcement | ✅ Done |
| ChatGroupsController + ChatMessagesController | ✅ Done |
| 5 unit tests membership rules — 5/5 pass | ✅ Done |

#### Sprint 6.3 — Messaging + Upload ✅ HOÀN THÀNH

| Hạng mục | Trạng thái |
|----------|-----------|
| SendMessage (text/image/file/reply) + SignalR broadcast `MessageReceived` | ✅ Done |
| Cursor pagination GetMessages (ticks_messageId, DESC fetch → ASC return) | ✅ Done |
| DeleteMessage (sender hoặc mod) + broadcast `MessageDeleted` | ✅ Done |
| ChatUploadController → MinIO, validate MIME/size theo ChatSettings | ✅ Done |
| MarkRead + unread counter | ✅ Done |
| Typing indicator (Hub-only, không persist) | ✅ Done |
| 5 integration tests messaging — 5/5 pass | ✅ Done |

#### Sprint 6.4 — Support Chat ✅ HOÀN THÀNH

| Hạng mục | Trạng thái |
|----------|-----------|
| API student: create/get/send/close conversation | ✅ Done |
| API agent (Admin/Support): inbox, assign, reply | ✅ Done |
| SupportChatHub broadcast `SupportMessageReceived` | ✅ Done |
| Auto-reuse conversation Open cho student | ✅ Done |
| Auto-assign agent khi reply lần đầu | ✅ Done |
| 5 unit tests support — 5/5 pass | ✅ Done |

#### Sprint 6.5 — Frontend Group ✅ HOÀN THÀNH

| Hạng mục | Trạng thái |
|----------|-----------|
| RTK slice `chatApi.ts` + `useGroupChatHub.ts` | ✅ Done |
| Page `/nhom` — 4 cột (AppShell + Col2 sidebar + Col3 ChatRoom + Col4 DiscoverGroups) | ✅ Done |
| Teacher portal `/teacher/chat/groups` — quản lý nhóm sở hữu + tạo nhóm | ✅ Done |
| Admin `/admin/chat/groups` — full CRUD mọi nhóm | ✅ Done |
| `ChatRoom` — header + message list + bubble + composer + typing indicator | ✅ Done |
| `MessageComposer` — upload ảnh/file, preview, validate size | ✅ Done |
| `DiscoverGroups` — tabs lớp + chip môn + card Moon.vn style | ✅ Done |

#### Sprint 6.6 — Support Widget + Admin ✅ HOÀN THÀNH

| Hạng mục | Trạng thái |
|----------|-----------|
| `SupportChatWidget` floating — mount global root layout | ✅ Done |
| `useSupportChatHub.ts` + `supportChatApi.ts` | ✅ Done |
| Admin `/admin/chat/support` — inbox CSKH + reply realtime | ✅ Done |
| Admin `/admin/chat/config` — cấu hình ChatSettings (MaxMembers, upload limits) | ✅ Done |
| MessagesSidebar tự wrap Suspense (fix Next.js 16 prerender) | ✅ Done |
| **AppShell col2 toggle UX** — hide → 28px strip + expand icon → full sidebar | ✅ Done — **27/05/2026** |
| **15/15 backend chat+support tests pass** | ✅ Done |

#### Deployment ✅

| Hạng mục | Trạng thái |
|----------|-----------|
| Nginx `/hubs/` proxy block (WebSocket upgrade, proxy_buffering off, timeout 3600s) | ✅ Done — 26/05/2026 |
| VPS deploy: nginx config pushed + reload, SignalR negotiate → 401 (cần JWT) ✓ | ✅ Done |
| Seeds: 5 chat groups (Lớp tiếng Việt A1, Góc luyện phát âm, Nhóm ôn VSTEP B2, Câu lạc bộ, Nhóm học Tiếng Việt) | ✅ Done |

#### Sprint 6.7 — Notifications + Q&A + Rate Limiting ✅ HOÀN THÀNH

| Hạng mục | Trạng thái |
|----------|----------|
| **T37** `Notification` entity + `NotificationHub` `/hubs/notifications` + `NotificationsController` + `InAppNotificationService` | ✅ Done |
| **T37** Frontend: `notificationsApi.ts`, `notificationSlice.ts`, `NotificationBell.tsx`, `NotificationDropdown.tsx`, `useNotificationHub.ts` | ✅ Done |
| **T38** `IFcmPushService` + `StubFcmPushService` + `UserDeviceToken` entity + `UserDeviceTokensController` | ✅ Done |
| **T39** `IEmailService` extended (4 methods), `ConsoleEmailService` stubs | ✅ Done |
| **T40** `LessonComment`+`LessonCommentUpvote` entities + EF config + Commands + Queries + `LessonCommentsController` | ✅ Done |
| **T40** Frontend: `lessonCommentsApi.ts`, `QASection.tsx`, `CommentThread.tsx` | ✅ Done |
| **T41** `SlidingWindowRateLimiter` 10req/3s per `tenantSlug:userId` + `[EnableRateLimiting]` on chat endpoints | ✅ Done |
| **T41** Nginx `limit_req_zone` + `limit_req` in `default.conf` | ✅ Done |
| Migration SQL `deploy/phase6-notifications-migration.sql` | ✅ Done |
| **88/88 unit tests pass** | ✅ Done |

---

### 🔄 PHASE 7 — Analytics V2 + Course Chat Group (~70% HOÀN THÀNH)

#### Sprint 7.1 — Course Auto Chat Group ✅ HOÀN THÀNH

| Hạng mục | Trạng thái |
|----------|-----------|
| `ChatGroup.CourseId` + `IsCourseGroup` properties + EF config | ✅ Done |
| `ChatGroup.CreateCourseGroup()` factory — tạo nhóm Private `"Nhóm KH: {tên}"` | ✅ Done |
| `CreateCourseCommandHandler` — auto tạo nhóm chat khi tạo khóa học | ✅ Done |
| `EnrollCourseHandler` — auto thêm học viên vào nhóm khi đăng ký | ✅ Done |
| Migration SQL `deploy/phase7-analytics-migration.sql` (CourseId, IsCourseGroup columns) | ✅ Done |

#### Sprint 7.2 — User Analytics (Backend ✅ · Frontend 🔄)

| Hạng mục | Trạng thái |
|----------|-----------|
| `UserAnalyticsController` — radar 4 kỹ năng, streak, learning time, course progress | ✅ Done |
| Aggregation queries (per-user, per-course) trên QuizAttempt + LessonProgress | ✅ Done |
| Frontend `/dashboard` — Radar chart kỹ năng + streak heatmap | 🔄 Đang làm |
| Cache layer Redis cho stats nặng | ❌ Chưa làm |
| Event-driven pipeline (RabbitMQ → AnalyticsWorker → projection table) | ❌ Chưa làm |

#### Sprint 7.3 — i18n Multilang (vi/en/ko) ✅ ~92% HOÀN THÀNH (31/05/2026)

> **Tham chiếu:** [i18n-multilang-design.md](i18n-multilang-design.md)

| Hạng mục | Trạng thái |
|----------|-----------|
| `next-intl` plugin + `src/i18n/request.ts` (cookie → header → vi) | ✅ Done |
| `LanguageSwitcher.tsx` + cookie `NEXT_LOCALE` persistence | ✅ Done |
| 3 file message vi/en/ko đồng bộ ~65 namespace | ✅ Done |
| Backend `AddLocalization` + `UseRequestLocalization` + SharedResource (.vi/.en/.ko.resx) | ✅ Done |
| Entity `CourseTranslation` / `BookTranslation` + EF config + migration | ✅ Done |
| Admin UI tab "Translations" cho Course + Book (upsert mutation) | ✅ Done |
| Query fallback chain `ko → en → vi` ở `GetCourseDetailQueryHandler`, `GetBookBySlugHandler` | ✅ Done |
| `i18nFormat.ts` — `formatCurrency` / `formatNumber` / `formatDate` / `formatDateTime` theo locale | ✅ Done |
| Meta `hreflang` + `og:locale` (vi_VN, en_US, ko_KR) trong `layout.tsx` | ✅ Done |
| `PUT /api/v1/users/me/locale` + đồng bộ về cookie khi đăng nhập | ✅ Done |
| 14 controller wired `IStringLocalizer<SharedResource>` cho error/message | ✅ Done |
| Phủ Auth / Course / Book / Cart / Checkout / Quiz / OPIC / VSTEP / Realtime player | ✅ Done |
| Phủ Admin portal (~85%) + Teacher portal (~80%) | ✅ Done |
| `NotificationTemplates` seed + Handlebars render (Task #14) | ❌ Chưa làm |
| E2E smoke 3-locale switching (Task #16) | ❌ Chưa làm |
| Shared component còn hardcoded VI (~8% page lẻ) | 🟡 Đang dọn |

---

## XV. BẢNG MAP CHỨC NĂNG — PHỤ LỤC YÊU CẦU vs MLS IMPLEMENTATION

> **Nguồn yêu cầu:** [PHU_LUC_YEU_CAU_CHUC_NANG.md](PHU_LUC_YEU_CAU_CHUC_NANG.md) (V3.0, 07/06/2025) — 172 yêu cầu thuộc 15 nhóm.  
> **Quy ước trạng thái:** ✅ Done · 🟡 Partial (đang hoàn thiện hoặc thiếu một vài cấu phần) · 🔄 Đang test/verify · ❌ Chưa làm · ⏳ Đã có kế hoạch — chưa khởi động.  
> **Tổng quan coverage:** ~138/172 yêu cầu ở trạng thái ✅ hoặc 🟡 (~80%). Phần thiếu chủ yếu nằm ở Gamification, Analytics V2, Certificate, Mobile App.

### 1. Module 1 — Auth & User Management (AUTH-01 → AUTH-21)

| Mã YC | Tên chức năng | Ưu tiên | Trạng thái MLS | Ghi chú |
|-------|---------------|---------|----------------|---------|
| AUTH-01 | Đăng ký bằng email + BCrypt | CAO | ✅ Done | Phase 1 |
| AUTH-02 | Đăng nhập email/password + JWT | CAO | ✅ Done | Phase 1 |
| AUTH-03 | Đăng nhập Google OAuth 2.0 | CAO | ✅ Done | Phase 1 |
| AUTH-04 | Refresh token rotation | CAO | ✅ Done | Phase 1 |
| AUTH-05 | Logout / Logout all devices | CAO | ✅ Done | Phase 1 |
| AUTH-06 | Email verification (verify + resend) | CAO | ✅ Done | Phase 1 |
| AUTH-07 | Forgot password / Reset password | CAO | ✅ Done | Phase 1 |
| AUTH-08 | Đổi mật khẩu (logged-in) | CAO | ✅ Done | `PUT /users/me/password` |
| AUTH-09 | Avatar upload | CAO | ✅ Done | Phase 1 |
| AUTH-10 | Hồ sơ cá nhân (GET/PUT /users/me) | CAO | ✅ Done | Phase 1 |
| AUTH-11 | Quản lý phiên đăng nhập (sessions) | CAO | ✅ Done | `/settings/sessions` |
| AUTH-12 | OTP qua SMS (Esms.vn) | TB | ❌ Chưa làm | Còn nợ — Phase 1 |
| AUTH-13 | Rate limit OTP (3 lần/15 phút/IP) | CAO | ❌ Chưa làm | Còn nợ — Phase 1 |
| AUTH-14 | Device tracking khi đăng nhập | CAO | ✅ Done | Phase 1 |
| AUTH-15 | Audit log đăng nhập/thao tác nhạy cảm | TB | 🟡 Partial | Có log login, thao tác khác chưa toàn diện |
| AUTH-16 | Lưu lịch sử đăng nhập theo IP/User-Agent | CAO | ✅ Done | Phase 1 |
| AUTH-17 | RBAC — Roles + Permissions động | CAO | ✅ Done | Phase 1 — `/admin/roles` |
| AUTH-18 | Gán/Bỏ role cho user | CAO | ✅ Done | `/admin/users/[id]` |
| AUTH-19 | JWT chứa roles + tenant claim | CAO | ✅ Done | Phase 0/1 |
| AUTH-20 | Lock/Unlock tài khoản từ Admin | CAO | ✅ Done | Phase 1 |
| AUTH-21 | Multi-tenant — tách dữ liệu theo tenant | CAO | ✅ Done | Phase 0 (X-Tenant-Slug + schema per tenant) |

### 2. Module 2 — Custom CMS (CMS-01 → CMS-14)

| Mã YC | Tên chức năng | Ưu tiên | Trạng thái MLS | Ghi chú |
|-------|---------------|---------|----------------|---------|
| CMS-01 | CRUD khoá học | CAO | ✅ Done | Phase 2A |
| CMS-02 | Workflow trạng thái khoá học (Draft→Publish→Hide→Archive) | CAO | ✅ Done | Phase 2A |
| CMS-03 | Clone khoá học | TB | ✅ Done | Phase 2A |
| CMS-04 | CRUD Module (thumbnail, duration) | CAO | ✅ Done | Phase 2A |
| CMS-05 | CRUD Lesson (Video/PDF/Audio/Reading) | CAO | ✅ Done | Phase 2A |
| CMS-06 | Upload Video → HLS (FFmpeg + Hangfire) | CAO | 🟡 Partial | Đã transcode 720p — còn nợ 360/1080 (priority Medium) |
| CMS-07 | Upload tài liệu (PDF/Audio) đính kèm bài học | CAO | ✅ Done | Phase 2A |
| CMS-08 | Quản lý CourseLevel / LearningLevel | CAO | ✅ Done | Phase 2A |
| CMS-09 | Banner Slide CRUD (homepage hero) | CAO | ✅ Done | `/admin/settings/banners` |
| CMS-10 | Drag-drop reorder module / lesson | TB | ✅ Done | Phase 2A |
| CMS-11 | Transcode status indicator (polling) | TB | ✅ Done | Phase 2A |
| CMS-12 | Tài nguyên tương tác trong bài học (Grammar/Vocab/Quiz…) | CAO | ✅ Done | Phase 2B/2C — 7 asset types |
| CMS-13 | Subtitle SRT → WebVTT pipeline | TB | ❌ Chưa làm | Còn nợ — Phase 2A (Low) |
| CMS-14 | Workflow duyệt nội dung (Submit for review → Approve) | TB | 🟡 Partial | API + `/admin/content/approvals` có; quy trình notify còn thô |

### 3. Module 3 — Video Learning (VID-01 → VID-29)

| Mã YC | Tên chức năng | Ưu tiên | Trạng thái MLS | Ghi chú |
|-------|---------------|---------|----------------|---------|
| VID-01 | HLS streaming `.m3u8` | CAO | ✅ Done | Phase 2A |
| VID-02 | Transcode 3 bitrate (360/720/1080) | CAO | 🟡 Partial | Hiện 1 bitrate — còn nợ (Medium) |
| VID-03 | Signed token cho media URL | CAO | ✅ Done | Phase 2A |
| VID-04 | Watermark PDF (user email/id) | CAO | ✅ Done | Phase 4 (book download flow) |
| VID-05 | Custom HLS Player (hls.js) | CAO | ✅ Done | `HlsPlayer.tsx` |
| VID-06 | Play/Pause + Seek | CAO | ✅ Done | |
| VID-07 | Tua tiến/lùi 10s | CAO | ✅ Done | |
| VID-08 | Điều chỉnh tốc độ 0.5x–2x | CAO | ✅ Done | |
| VID-09 | Chọn chất lượng (Auto/Manual) | CAO | ✅ Done | |
| VID-10 | Toàn màn hình | CAO | ✅ Done | |
| VID-11 | Volume control + Mute | CAO | ✅ Done | |
| VID-12 | Phụ đề CC (.vtt) | TB | ❌ Chưa làm | Còn nợ — Phase 2A (Low) |
| VID-13 | Picture-in-Picture | TB | 🔄 Cần verify | Hỗ trợ trình duyệt mặc định |
| VID-14 | Hotkey điều khiển | TB | ✅ Done | Space/Arrow/F |
| VID-15 | Progress bar buffered indicator | CAO | ✅ Done | |
| VID-16 | Loading/Error UI | CAO | ✅ Done | |
| VID-17 | Auto-quality theo bandwidth | CAO | ✅ Done | hls.js default |
| VID-18 | Mobile-friendly controls | CAO | ✅ Done | |
| VID-19 | Theme dark cho player | CAO | ✅ Done | |
| VID-20 | Theo dõi tiến độ xem (LessonProgress) | CAO | ✅ Done | Phase 2A |
| VID-21 | Resume từ vị trí cũ (VideoTracking) | CAO | ✅ Done | Phase 2A |
| VID-22 | Mark complete khi ≥ 80% | CAO | ✅ Done | Phase 2A/2B |
| VID-23 | Bookmark theo timestamp | TB | 🟡 Partial | localStorage; persist DB còn nợ (Low) |
| VID-24 | Ghi chú (Notes) theo timestamp | TB | 🟡 Partial | localStorage; persist DB còn nợ (Low) |
| VID-25 | Streak học tập | CAO | ✅ Done | `StreakWidget` |
| VID-26 | Interactive Segment Timeline (asset dots) | CAO | ✅ Done | Phase 2C — `/learn/[id]` |
| VID-27 | Bình luận realtime theo timestamp | CAO | ✅ Done | Phase 2D — `VideoCommentHub` |
| VID-28 | Reaction icon trên video | TB | ✅ Done | `CommentReaction` |
| VID-29 | Quiz pop-up giữa video (Interactive QuizBlock) | CAO | ✅ Done | Phase 2B/2C — `VideoQuizPopup` |

### 4. Module 4 — Placement Test (PLT-01 → PLT-08)

| Mã YC | Tên chức năng | Ưu tiên | Trạng thái MLS | Ghi chú |
|-------|---------------|---------|----------------|---------|
| PLT-01 | Khởi tạo phiên placement | CAO | ✅ Done | Phase 3.1 |
| PLT-02 | Part Listening MCQ | CAO | ✅ Done | |
| PLT-03 | Part Reading MCQ | CAO | ✅ Done | |
| PLT-04 | Part Speaking (recorder + AI grade) | CAO | ✅ Done | Phase 3.1 + Speaking Worker |
| PLT-05 | Part Writing (essay + AI grade) | CAO | ✅ Done | Phase 3.1 + Writing Worker |
| PLT-06 | PlacementRuleEngine xếp Level 1–6 | CAO | ✅ Done | |
| PLT-07 | Trả Radar 4 kỹ năng + đề xuất khoá học | CAO | ✅ Done | `/placement-test` flow |
| PLT-08 | Lưu lịch sử + chỉ làm lại sau N ngày | CAO | ✅ Done | Có cấu hình retry |

### 5. Module 5 — Quiz Engine (QUZ-01 → QUZ-12)

| Mã YC | Tên chức năng | Ưu tiên | Trạng thái MLS | Ghi chú |
|-------|---------------|---------|----------------|---------|
| QUZ-01 | Ngân hàng câu hỏi (MCQ/FillBlank/TrueFalse/Essay/Speaking) | CAO | ✅ Done | `/teacher/questions` |
| QUZ-02 | CRUD Quiz (Teacher portal) | CAO | ✅ Done | `/teacher/quizzes` |
| QUZ-03 | Gắn câu hỏi vào quiz + đáp án + giải thích | CAO | ✅ Done | |
| QUZ-04 | Học viên làm quiz — đa loại câu | CAO | ✅ Done | `/quiz/[id]/play` |
| QUZ-05 | Auto-grade MCQ/FillBlank/TrueFalse | CAO | ✅ Done | Phase 3.1 |
| QUZ-06 | Kết quả + Radar 4 kỹ năng | CAO | ✅ Done | `/quiz/[id]/result` |
| QUZ-07 | Lịch sử làm bài (multiple attempts) | CAO | ✅ Done | |
| QUZ-08 | Interactive Quiz trong video | CAO | ✅ Done | Phase 2B/2C |
| QUZ-09 | Adaptive Quiz (điều chỉnh độ khó) | TB | ✅ Done | `/quiz/[id]/adaptive` — Sprint 8 |
| QUZ-10 | Realtime Quiz Room (SignalR + leaderboard) | TB | ✅ Done | `QuizHub` + `/realtime/*` |
| QUZ-11 | QuizAnalytics (attempts, pass rate) | TB | ✅ Done | `/teacher/quizzes/[id]/analytics` |
| QUZ-12 | OPIC + VSTEP mode quiz | CAO | ✅ Done | Phase 3.2 + 3.3 |

### 6. Module 6 — Thương mại & Thanh toán (COM-01 → COM-14)

| Mã YC | Tên chức năng | Ưu tiên | Trạng thái MLS | Ghi chú |
|-------|---------------|---------|----------------|---------|
| COM-01 | Giá theo Level + theo Course | CAO | ✅ Done | Phase 2D — CoursePackage |
| COM-02 | Gói combo (Course + Book + Combo) | CAO | ✅ Done | Phase 4 — Book + Combo type |
| COM-03 | UI 3 cột chọn gói (Cards) | CAO | ✅ Done | `PricingCards.tsx` |
| COM-04 | Coupon / Voucher | CAO | ✅ Done | Phase 4 — `/admin/vouchers` |
| COM-05 | Cổng thanh toán VNPay | CAO | ✅ Done | Sandbox; live cần đăng ký |
| COM-06 | Cổng thanh toán MoMo | CAO | ✅ Done | ~80% Sandbox |
| COM-07 | Stripe (thanh toán quốc tế) | TB | ❌ Chưa làm | Còn nợ |
| COM-08 | Chuyển khoản thủ công + xác nhận admin | CAO | ✅ Done | `ConfirmOrderPaymentByCodeCommand` |
| COM-09 | Order + OrderItem + email xác nhận | CAO | ✅ Done | Phase 4 |
| COM-10 | Hoá đơn PDF (QuestPDF) + download | CAO | ✅ Done | `InvoiceController` |
| COM-11 | Activation Code (sách in → mở LMS) | CAO | ✅ Done | Phase 4 |
| COM-12 | Lock overlay cho nội dung premium | TB | ❌ Chưa làm | `FeatureGateOverlay` còn nợ |
| COM-13 | Upsell / Cross-sell ở checkout | TB | 🟡 Partial | Có gợi ý sách, chưa cá nhân hoá |
| COM-14 | Refund / Cancel order | TB | ✅ Done | `CancelOrderCommand` |

### 7. Module 7 — Chứng chỉ (CRT-01 → CRT-04)

| Mã YC | Tên chức năng | Ưu tiên | Trạng thái MLS | Ghi chú |
|-------|---------------|---------|----------------|---------|
| CRT-01 | Phát hành chứng chỉ khi hoàn thành khoá | CAO | ⏳ Planned | Thiết kế trong V4 — chưa code |
| CRT-02 | Sinh PDF chứng chỉ (template + QuestPDF) | CAO | ⏳ Planned | Có sẵn QuestPDF từ invoice |
| CRT-03 | QR verify online + trang verify công khai | CAO | ⏳ Planned | |
| CRT-04 | Lưu trữ + tải lại chứng chỉ trong /profile | TB | ⏳ Planned | |

### 8. Module 8 — Analytics (ANL-01 → ANL-09)

| Mã YC | Tên chức năng | Ưu tiên | Trạng thái MLS | Ghi chú |
|-------|---------------|---------|----------------|---------|
| ANL-01 | Radar chart 4 kỹ năng | CAO | 🟡 Partial | Có ở quiz result; dashboard học viên đang làm (Sprint 7.2) |
| ANL-02 | Streak calendar (GitHub-style) | CAO | ✅ Done | `StreakWidget` |
| ANL-03 | Tiến độ khoá học (% complete) | CAO | ✅ Done | Phase 2A |
| ANL-04 | Lịch học gợi ý | TB | ❌ Chưa làm | Phase 5 |
| ANL-05 | Thời gian học tích luỹ | CAO | 🟡 Partial | Backend có; dashboard UI 🔄 |
| ANL-06 | Insight cá nhân (gợi ý điểm yếu) | TB | ❌ Chưa làm | Phase 5 |
| ANL-07 | Admin Dashboard — doanh thu, đơn hàng | CAO | ✅ Done | `/admin/analytics` |
| ANL-08 | Admin Top Books / Top Courses | TB | ✅ Done | `AdminAnalyticsController` |
| ANL-09 | Teacher Dashboard segment heatmap | TB | ❌ Chưa làm | Phase 5 — backlog |

### 9. Module 9 — Gamification (GAM-01 → GAM-05)

| Mã YC | Tên chức năng | Ưu tiên | Trạng thái MLS | Ghi chú |
|-------|---------------|---------|----------------|---------|
| GAM-01 | Hệ thống XP (điểm theo hành động) | TB | ❌ Chưa làm | Phase 5 backlog |
| GAM-02 | Badges (First Session, 7-day streak…) | TB | ❌ Chưa làm | Phase 5 backlog |
| GAM-03 | Bảng xếp hạng tuần (Leaderboard) | TB | ❌ Chưa làm | Phase 5 backlog |
| GAM-04 | Hiệu ứng streak (lửa/animation) | TB | 🟡 Partial | Có widget streak — chưa animation full |
| GAM-05 | Notification mốc gamification | TB | ❌ Chưa làm | Cần NotificationTemplates Task #14 |

### 10. Module 10 — AI Evaluation (AI-01 → AI-04)

| Mã YC | Tên chức năng | Ưu tiên | Trạng thái MLS | Ghi chú |
|-------|---------------|---------|----------------|---------|
| AI-01 | Chấm Speaking (GPT-4o Audio) | CAO | 🟡 Partial | Worker + rubric + SignalR ✅; **AI thật chưa plug — đang mock random** (Whisper + GPT-4o là TODO) |
| AI-02 | Chấm Writing (GPT-4o mini) | CAO | 🟡 Partial | Worker + rubric + SignalR ✅; **AI thật chưa plug — đang mock random** (LanguageTool + GPT-4o là TODO) |
| AI-03 | Rate limit số lần chấm AI / user / ngày | CAO | 🟡 Partial | Có rate-limit chat (T41) — chưa áp riêng cho AI grading |
| AI-04 | Gợi ý "bài học tiếp theo" | TB | ❌ Chưa làm | Phase 5 (AI Recommendation) |

### 11. Module 11 — Hỗ trợ & Giao tiếp (COM-Q / COM-N)

| Mã YC | Tên chức năng | Ưu tiên | Trạng thái MLS | Ghi chú |
|-------|---------------|---------|----------------|---------|
| COM-Q-01 | Q&A theo bài học (comment + upvote) | TB | ✅ Done | Phase 6 Sprint 6.7 T40 — `LessonComment` |
| COM-Q-02 | Reply lồng nhau + sắp xếp | TB | ✅ Done | `CommentThread.tsx` |
| COM-Q-03 | Báo cáo / kiểm duyệt comment | TB | 🟡 Partial | Có nút report — workflow admin còn cơ bản |
| COM-N-01 | In-app notification (NotificationHub) | CAO | ✅ Done | Phase 6 T37 |
| COM-N-02 | Email notification | TB | 🟡 Partial | `ConsoleEmailService` stub — chưa SMTP/SendGrid prod |
| COM-N-03 | Push notification (FCM) | THẤP | 🟡 Partial | `StubFcmPushService` + device token (T38) |
| COM-N-04 | Notification template (multi-locale Handlebars) | TB | ❌ Chưa làm | Task #14 còn nợ |

### 12. Module 12 — Admin Panel (ADM-01 → ADM-11)

| Mã YC | Tên chức năng | Ưu tiên | Trạng thái MLS | Ghi chú |
|-------|---------------|---------|----------------|---------|
| ADM-01 | Admin Dashboard (KPI tổng quan) | CAO | ✅ Done | `/admin` + `/admin/analytics` |
| ADM-02 | Quản lý Users + filter/search | CAO | ✅ Done | `/admin/users` |
| ADM-03 | Quản lý Roles + Permissions | CAO | ✅ Done | `/admin/roles` |
| ADM-04 | Quản lý Teachers + duyệt hồ sơ | CAO | ✅ Done | `/admin/teachers` |
| ADM-05 | Quản lý Courses + nội dung | CAO | ✅ Done | `/admin/courses` |
| ADM-06 | Quản lý Books + giá + tồn kho | CAO | ✅ Done | `/admin/sach` |
| ADM-07 | Quản lý Orders + Invoice | CAO | ✅ Done | `/admin/don-hang` |
| ADM-08 | Quản lý Vouchers / Coupons | CAO | ✅ Done | `/admin/vouchers` |
| ADM-09 | Cấu hình tenant (banner, settings) | TB | ✅ Done | `/admin/settings` |
| ADM-10 | Duyệt nội dung (approval queue) | TB | ✅ Done | `/admin/content/approvals` |
| ADM-11 | Cấu hình hệ thống (shipping, payment, chat) | TB | 🟡 Partial | Chat ✅ · Shipping config UI ❌ |

### 13. Module 13 — Hạ tầng & Bảo mật

#### 13.1. Infrastructure (INF-01 → INF-09)

| Mã YC | Tên chức năng | Ưu tiên | Trạng thái MLS | Ghi chú |
|-------|---------------|---------|----------------|---------|
| INF-01 | Multi-tenant (X-Tenant-Slug + schema per tenant) | CAO | ✅ Done | Phase 0 |
| INF-02 | Background jobs Hangfire | CAO | ✅ Done | Transcode + AI worker |
| INF-03 | Cache Redis | CAO | ✅ Done | Phase 0 |
| INF-04 | Message Bus RabbitMQ | CAO | ✅ Done | Phase 0 |
| INF-05 | Health check `/health` | CAO | ✅ Done | Phase 0 |
| INF-06 | Logging Serilog (file + console) | CAO | ✅ Done | Phase 0 |
| INF-07 | Docker Compose (dev + prod) | CAO | ✅ Done | `docker-compose.yml` + `prod` |
| INF-08 | CI/CD pipeline | CAO | 🟡 Partial | Script `deploy.ps1`, GitHub Actions chưa setup |
| INF-09 | Monitoring + Alert | CAO | ❌ Chưa làm | Chưa tích hợp Prometheus/Grafana |

#### 13.2. Security (SEC-01 → SEC-05)

| Mã YC | Tên chức năng | Ưu tiên | Trạng thái MLS | Ghi chú |
|-------|---------------|---------|----------------|---------|
| SEC-01 | JWT (HS256, exp ngắn + refresh) | CAO | ✅ Done | Phase 1 |
| SEC-02 | Rate limit endpoint nhạy cảm | CAO | ✅ Done | SlidingWindow + Nginx (T41) |
| SEC-03 | Validation đầu vào (FluentValidation) | CAO | ✅ Done | Toàn bộ Command/Query |
| SEC-04 | Security headers (HSTS, CSP, X-Frame…) | CAO | 🟡 Partial | HSTS + một số header; CSP chưa hoàn chỉnh |
| SEC-05 | HTTPS bắt buộc (prod) | CAO | ✅ Done | Nginx + cert |

### 14. Module 14 — Giao diện Frontend (UI-01 → UI-23)

| Mã YC | Tên chức năng | Ưu tiên | Trạng thái MLS | Ghi chú |
|-------|---------------|---------|----------------|---------|
| UI-01 | Trang đăng ký (split-screen) | CAO | ✅ Done | `/register` |
| UI-02 | Trang đăng nhập | CAO | ✅ Done | `/login` |
| UI-03 | Trang quên mật khẩu | CAO | ✅ Done | `/forgot-password` |
| UI-04 | Trang đặt lại mật khẩu | CAO | ✅ Done | `/reset-password` |
| UI-05 | Xác minh email (6 ô OTP) | CAO | ✅ Done | `/verify-email` |
| UI-06 | Trang chủ (hero, tab Level, tiếp tục học) | CAO | ✅ Done | `/` |
| UI-07 | Danh sách khoá học `/khoa-hoc` | CAO | ✅ Done | Đã migrate sang `/courses` |
| UI-08 | Chi tiết khoá học | CAO | ✅ Done | `/courses/[id]` |
| UI-09 | Trang học bài | CAO | ✅ Done | `/learn/[lessonId]` |
| UI-10 | Dashboard học viên (Radar, streak…) | CAO | 🟡 Partial | `/dashboard` còn đang ráp Sprint 7.2 |
| UI-11 | Hồ sơ cá nhân 4 tab | CAO | 🟡 Partial | `/profile` có Info/Courses; Badges chờ Gamification |
| UI-12 | Quản lý phiên đăng nhập | CAO | ✅ Done | `/settings/sessions` |
| UI-13 | Placement Test wizard | CAO | ✅ Done | `/placement-test` |
| UI-14 | Kết quả quiz + Radar | CAO | ✅ Done | `/quiz/[id]/result` |
| UI-15 | Trang mua hàng 3 cột | CAO | ✅ Done | `/thanh-toan` + `PricingCards` |
| UI-16 | Header sticky brand color | CAO | ✅ Done | `Header.tsx` |
| UI-17 | Sidebar trái thu gọn 72px | TB | ✅ Done | `AppShell` |
| UI-18 | Tìm kiếm toàn cục | TB | 🟡 Partial | Có input header; dropdown gợi ý còn cơ bản |
| UI-19 | Responsive (mobile/tablet/desktop) | CAO | ✅ Done | Tailwind responsive |
| UI-20 | Màu thương hiệu V3 thống nhất | CAO | ✅ Done | Design tokens |
| UI-21 | Font Be Vietnam Pro | CAO | ✅ Done | + Noto Sans KR cho locale ko |
| UI-22 | Course Card component | CAO | ✅ Done | `CourseCard.tsx` |
| UI-23 | Badge level màu phân biệt | CAO | ✅ Done | `level_labels` ns + color map |

### 15. Module 15 — Mobile App (MOB-01 → MOB-02)

| Mã YC | Tên chức năng | Ưu tiên | Trạng thái MLS | Ghi chú |
|-------|---------------|---------|----------------|---------|
| MOB-01 | Giai đoạn 1 (Auth, Course list, HLS, Progress, Placement) | TB | 🟡 Partial | Sprint 0-9 code xong, cần EAS build + test device |
| MOB-02 | Giai đoạn 2 (Payment, Push, Gamification) | THẤP | ⏳ Planned | Sau MVP |

---

## XVI. PHỤ LỤC — TỔNG KẾT COVERAGE

| Module | Tổng YC | ✅ Done | 🟡 Partial | 🔄 Verify | ❌ Chưa làm | ⏳ Planned |
|--------|---------|---------|-----------|-----------|-------------|------------|
| 1 — Auth & User | 21 | 18 | 1 | 0 | 2 | 0 |
| 2 — Custom CMS | 14 | 11 | 2 | 0 | 1 | 0 |
| 3 — Video Learning | 29 | 24 | 3 | 1 | 1 | 0 |
| 4 — Placement Test | 8 | 8 | 0 | 0 | 0 | 0 |
| 5 — Quiz Engine | 12 | 12 | 0 | 0 | 0 | 0 |
| 6 — Commerce & Payment | 14 | 11 | 1 | 0 | 2 | 0 |
| 7 — Certificate | 4 | 0 | 0 | 0 | 0 | 4 |
| 8 — Analytics | 9 | 4 | 2 | 0 | 3 | 0 |
| 9 — Gamification | 5 | 0 | 1 | 0 | 4 | 0 |
| 10 — AI Evaluation | 4 | 2 | 1 | 0 | 1 | 0 |
| 11 — Hỗ trợ & Giao tiếp | 7 | 3 | 3 | 0 | 1 | 0 |
| 12 — Admin Panel | 11 | 10 | 1 | 0 | 0 | 0 |
| 13.1 — Infrastructure | 9 | 7 | 1 | 0 | 1 | 0 |
| 13.2 — Security | 5 | 4 | 1 | 0 | 0 | 0 |
| 14 — Frontend UI | 23 | 19 | 3 | 0 | 0 | 0 |
| 15 — Mobile App | 2 | 0 | 0 | 0 | 0 | 2 |
| **TỔNG CỘNG** | **177** | **133** | **20** | **1** | **15** | **6** |

> **Tỷ lệ:** ✅ 75% · 🟡 11% · 🔄 1% · ❌ 9% · ⏳ 4%  
> **Tổng coverage (✅ + 🟡 + 🔄):** **~87%** so với phụ lục yêu cầu.

### Top hạng mục còn lại cần ưu tiên

1. **Certificate (CRT-01..04)** — chưa khởi động; cần code dựa trên QuestPDF có sẵn (Phase 5).
2. **Gamification (GAM-01..05)** — XP/Badges/Leaderboard chưa làm; phụ thuộc NotificationTemplates.
3. **SMS OTP + Rate limit OTP (AUTH-12, AUTH-13)** — nợ Phase 1.
4. **FFmpeg 3 bitrate (VID-02) + Subtitle WebVTT (VID-12, CMS-13)** — nợ Phase 2A.
5. **Stripe (COM-07)** — nếu cần thanh toán quốc tế.
6. **Feature Gate Overlay (COM-12)** — chặn nội dung premium UI.
7. **NotificationTemplates Handlebars (COM-N-04, Task #14)** — chặn gamification + i18n email.
8. **Monitoring/Alert (INF-09) + CI/CD (INF-08)** — go-live readiness.
9. **Mobile App (MOB-01, MOB-02)** — pha sau MVP.

---
| `User.LastActiveAt` + `Touch()` method + EF config | ✅ Done |
| `UserProfile.Country` + `NativeLanguage` + EF config | ✅ Done |
| `GetUserStatsQuery` handler — total users, new/week/month, activity buckets (<36h/36-72h/>72h), age groups, top countries/languages, weekly registrations | ✅ Done |
| `GET /api/v1/admin/analytics/users?weeksBack=12` | ✅ Done |
| Migration SQL (LastActiveAt, Country, NativeLanguage columns) | ✅ Done |
| Frontend admin analytics tab "Người dùng" | ❌ Chưa làm |

#### Sprint 7.3 — Content View Tracking ✅ HOÀN THÀNH (Backend)

| Hạng mục | Trạng thái |
|----------|-----------|
| `ContentView` entity (ContentViewType enum: Course/Teacher/Book) + EF config | ✅ Done |
| `ContentViews` table + indexes (type+id+date, user+type+id) | ✅ Done |
| `RecordContentViewCommand` handler (fire-and-forget) | ✅ Done |
| `CoursesController.GetCourse` — record Course view | ✅ Done |
| `TeachersController.GetBySlug` — record Teacher view | ✅ Done |
| `BooksController.GetBook` — record Book view | ✅ Done |
| `GetContentViewStatsQuery` handler — views/week/month, weekly breakdown, top 10 rankings | ✅ Done |
| `GET /api/v1/admin/analytics/content-views?weeksBack=8` | ✅ Done |
| Frontend admin analytics tab "Lượt xem nội dung" | ❌ Chưa làm |

#### Sprint 7.4 — Sales Analytics ✅ HOÀN THÀNH (Backend)

| Hạng mục | Trạng thái |
|----------|-----------|
| `GetSalesStatsQuery` handler — paid orders/revenue per week/month, weekly sales trend, top 10 courses + books | ✅ Done |
| `GET /api/v1/admin/analytics/sales?weeksBack=8` | ✅ Done |
| Frontend admin analytics tab "Doanh số" | ❌ Chưa làm |

---

### ⏳ MOBILE APP (ĐANG PHÁT TRIỂN)

**Sprint 0-9 đã implement:**
- ✅ Sprint 0: Scaffold Expo SDK 52, TypeScript strict, Redux Toolkit, NativeWind 4, i18n
- ✅ Sprint 1: Auth (Login, Register, OTP, ForgotPassword, TenantPicker), RTK Query authApi
- ✅ Sprint 2: Profile (Edit, ChangePassword, Devices), Notifications, Me tab
- ✅ Sprint 3: Course list (filter/search/level), Course detail, Enroll
- ✅ Sprint 4: Video player (expo-video, HLS, auto-save position), Progress tab
- ✅ Sprint 5: Quiz engine (MCQ, TrueFalse, FillBlank, result screen)
- ✅ Sprint 6: Speaking (expo-av ghi âm + upload), Placement test
- ✅ Sprint 7: Dark mode (NativeWind + Switch), i18n vi/en
- ✅ Sprint 8: App Lock (biometric + PIN, AppState listener)
- 🔄 Sprint 9: EAS Build APK — cần đăng nhập Expo + chạy `eas build --platform android --profile preview`

**API:** `http://103.20.97.97:5009`, tenant header `X-Tenant-Slug: demo`

**Build APK:** Xem `mobile/BUILD_GUIDE.md`

| Hạng mục | Trạng thái |
|----------|-----------|
| React Native: Auth + Course list + Interactive Video | ❌ Chưa làm |
| Vertical layout cho Segment Panel | ❌ Chưa làm |
| Swipe gesture chuyển segment | ❌ Chưa làm |
| Commerce + Push notifications (Giai đoạn 2) | ❌ Chưa làm |

---

## TÍNH NĂNG ĐÃ CÓ — CÓ THỂ DEMO NGAY

| Tính năng | URL | Vai trò |
|-----------|-----|---------|
| Đăng nhập / Đăng ký / Google OAuth | /login, /register | Tất cả |
| Danh sách khóa học | /courses | Public |
| Chi tiết khóa học + enroll + Giá 3 tier | /courses/[id] | Public/User |
| Học Interactive Video + Timeline + Assets | /learn/[id] | Enrolled |
| Placement Test xếp lớp | /placement-test | User |
| Quiz Standard (MCQ, FillBlank, TrueFalse...) | /quiz/[id]/play | User |
| Adaptive Quiz (tự động điều chỉnh độ khó) | /quiz/[id]/adaptive | User |
| Speaking AI (record + GPT chấm) | /quiz/[id]/speaking | User |
| Writing AI (essay + GPT chấm) | /quiz/[id]/writing | User |
| **Realtime Quiz** (Kahoot-style, SignalR) | /realtime/join | User |
| Thi OPIC (15 câu speaking, AI chấm, level band) | /opic/survey | User |
| **Thi VSTEP** (4 phần, CEFR A2–C1) | /vstep | User |
| Bình luận video realtime theo timestamp | /learn/[id] | User |
| **Mua sách** (Ebook / Physical / Combo) | /sach | User |
| **Giỏ hàng + Thanh toán VNPay** | /gio-hang → /thanh-toan | User |
| **Kích hoạt mã sách** | /kich-hoat | User |
| **Thư viện ebook** | /thu-vien-sach | User |
| **Đơn hàng** | /don-hang | User |
| **Theo dõi vận đơn** | /don-hang/[id]/tracking | User |
| **Admin: Quản lý vận đơn** | /admin/van-don | Admin |
| Admin: Quản lý toàn bộ CMS | /admin/* | Admin |
| Admin: Quản lý đơn hàng + doanh thu | /admin/don-hang, /admin/analytics | Admin |
| Admin: Quản lý sách + vouchers | /admin/sach, /admin/vouchers | Admin |
| Teacher Portal: Khóa học + Giá + Quiz + OPIC | /teacher/* | Teacher |
| Teacher Portal: Realtime Quiz host | /teacher/realtime | Teacher |
| Teacher Portal: VSTEP management | /teacher/vstep | Teacher |
| Trang giáo viên công khai | /giao-vien/[slug] | Public |

---

## NHỮNG GÌ CẦN LÀM TIẾP THEO (THEO THỨ TỰ ƯU TIÊN)

### 🔴 Cao — Hoàn thiện các tính năng đang dở

1. **Phase 7 Frontend Analytics** — Admin `/admin/analytics` thêm 3 tabs: "Người dùng" (user stats), "Lượt xem" (content views), "Doanh số" (sales); RTK Query endpoints cho 3 API mới
2. **VSTEP fine-tuning** — Test end-to-end, review VSTEPBandEngine scoring, fix bugs phát sinh
3. **Feature Gate Overlay** — `<FeatureGateOverlay>` + `useFeatureAccess` hook
   - Áp dụng cho VocabularyBlock (cần Standard), SpeakingBlock (cần Advance)
4. **Video Comment UI** — Hoàn thiện tab "Bình luận" trong `/learn/[id]`, timeline markers
5. **VNPay Production** — Đăng ký merchant thật khi go-live
6. **Course purchase qua checkout** — Gói học Basic/Standard/Advance mua được qua cart/payment (hiện chỉ có sách)

### 🟡 Trung — Phase 4S Shipping (còn lại)

7. **Admin Shipping Settings UI** — `/admin/settings/shipping` — cấu hình ViettelPost credentials từ UI (hiện phải sửa `appsettings.json` thủ công)
8. **VNPay Production** — Đăng ký merchant thật khi go-live

### 🟡 Trung — Phase 5 Analytics & Gamification

9. Segment-level analytics (drop rate, replay rate) + Teacher heatmap dashboard
10. Points / Badges / Leaderboard

### 🟢 Thấp — Phase 6 & Mobile

15. Certificate PDF + QR verify
16. **FCM Push Notifications** — Tích hợp FCM thật (T38 hiện dùng `StubFcmPushService`)
17. Mobile App React Native

---

## GHI CHÚ KỸ THUẬT

| Vấn đề | Giải pháp đã áp dụng |
|--------|---------------------|
| WritingGradingWorker / SpeakingGradingWorker crash host | Thêm `BackgroundServiceExceptionBehavior.Ignore` vào Program.cs |
| Auto-create 3 gói pricing khi tạo khóa học | `SeedDefaultPackagesAsync()` trong `CreateCourseCommandHandler` |
| Teacher không truy cập được /admin/packages/* | Thêm "Teacher" vào `[AuthorizeRoles]` của `AdminPackagesController` |
| Auto-tạo nhóm chat khi tạo khóa học | `ChatGroup.CreateCourseGroup()` + gọi trực tiếp `db.ChatGroups.Add()` (bypass MaxGroupsPerUser limit) |
| Content view tracking (fire-and-forget) | Dùng `_ = mediator.Send(...)` không await để không delay response |
| Teacher Portal không hiển thị package manager | Thêm `<AdminPackageManager>` vào tab "Giá & Thương mại" của teacher portal |
| Khóa học cũ không có packages | SQL migration: `seed-missing-packages2.sql` — 27 packages cho 9 courses |
| ASPNETCORE_ENVIRONMENT không load khi chạy local | Set `$env:ASPNETCORE_ENVIRONMENT = "Development"` trước `dotnet run` |
| VNPay đang dùng Sandbox | Config `VNPay:PayUrl = https://sandbox.vnpayment.vn/paymentv2/vpcpay.html` |
| SignalR negotiate 404 trên VPS | Nginx chỉ proxy `/api/`, `/hubs/*` rơi vào frontend. Fix: thêm `location /hubs/` block với `proxy_set_header Connection "upgrade"` + `proxy_buffering off` + timeout 3600s. File: `deploy/nginx/default.conf` |
| MessagesSidebar gây Next.js 16 prerender crash | `useSearchParams()` trong Server Component → wrap nội dung trong `<Suspense>`. Self-wrapping pattern: `MessagesSidebarInner` + default export bọc `<Suspense fallback={null}>` |
| Col2 sidebar ẩn hoàn toàn khi bấm nút hide | Thay complete-hide bằng strip 28px: `mls-col2` width=28, hiện nút expand (→ icon, circular). Click → `setCol2Visible(true)`. Đồng thời xoá nút toggle cũ ở bottom của col1 nav. File: `AppShell.tsx` |

---

*Cập nhật: 28/05/2026 — Phase 4S Shipping Module (ViettelPost) hoàn thành. Dựa trên rà soát source code thực tế: controllers, entities, frontend pages.*
