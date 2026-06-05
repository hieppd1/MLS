# THIẾT KẾ ỨNG DỤNG MOBILE — MLS (My Language School)

| | |
|---|---|
| **Mã tài liệu** | MLS-MOB-DESIGN-V1 |
| **Phiên bản** | V1.0 |
| **Ngày lập** | 31/05/2026 |
| **Trạng thái** | Draft — chờ KH/PO duyệt |
| **Liên quan** | [PHU_LUC_YEU_CAU_CHUC_NANG.md](PHU_LUC_YEU_CAU_CHUC_NANG.md) (MOB-01, MOB-02), [PROJECT_PROGRESS.md](PROJECT_PROGRESS.md), [AI_GRADING_INTEGRATION_DESIGN.md](AI_GRADING_INTEGRATION_DESIGN.md), [updated_course_learning_flow_business_spec_vi.md](updated_course_learning_flow_business_spec_vi.md) §9.3 |

> **TÓM TẮT QUYẾT ĐỊNH KH (31/05/2026)**: RN+Expo · iOS+Android cùng V1 · iOS15+/Android8 · **đóng gói APK + TestFlight cài offline nghiệm thu trước khi submit store** · **OTA hỏi user** · **không cho tải video offline** · **iOS dùng IAP** · **multi-account/multi-tenant V1** · **VI+EN + plug-in thêm ngôn ngữ** · Sentry+Firebase · **App Lock biometric+PIN V1** · **Full dark mode V1**.

---

## MỤC LỤC

1. Mục tiêu & phạm vi
2. Lựa chọn công nghệ (so sánh + đề xuất)
3. Kiến trúc tổng thể & cấu trúc thư mục
4. Tính năng theo phase (MOB-01 / MOB-02 / MOB-03)
5. Thiết kế UX/UI & navigation
6. Tích hợp Backend (API, Auth, Realtime, AI)
7. Tính năng đặc thù mobile (Offline, Push, Deep link, IAP)
8. Bảo mật, đa tenant, đa ngôn ngữ
9. Hiệu năng & monitoring
10. Kế hoạch phát triển — break task theo sprint
11. Kiểm thử, CI/CD, phát hành store
12. Chi phí & rủi ro
13. Bảng quyết định KH/PO cần duyệt
14. Phụ lục: danh sách màn hình, API endpoint, package

---

## 1. MỤC TIÊU & PHẠM VI

### 1.1 Mục tiêu

- Cung cấp trải nghiệm học **liên tục, anywhere/anytime** trên Android + iOS, đồng bộ tiến độ với web.
- Tận dụng phần cứng mobile: **mic ghi âm cho Speaking (OPIC/VSTEP)**, camera (ảnh đại diện/upload bài viết tay), **push notification** (nhắc học/streak), **offline cache** video & quiz.
- Giữ **một codebase duy nhất** cho iOS + Android để tối ưu chi phí bảo trì.
- Tuân thủ kiến trúc multi-tenant hiện có (tenant slug trong header, schema PostgreSQL riêng).

### 1.2 In-scope (V1)

- **Học viên (Student)** là người dùng chính. Không build Admin/Teacher trên mobile (dùng web).
- Auth (Email/Google), khoá học, video HLS, quiz (Listening/Reading/Writing/Speaking), placement test, tiến độ, thông báo, thanh toán (deep link sang VNPAY/Momo), chat nhóm cơ bản, gamification.

### 1.3 Out-of-scope (V1)

| # | Tính năng | Lý do |
|---|---|---|
| 1 | Tải video offline có DRM | Phức tạp về license; chỉ cache HLS thường |
| 2 | Livestream tự xây | Embed Zoom/YouTube qua WebView |
| 3 | Soạn bài / tạo quiz cho giáo viên | Web đã đủ |
| 4 | In chứng chỉ PDF trên mobile | Mở qua web link |
| 5 | Apple Pay / In-app Purchase nội dung số (Apple 30%) | Dùng gateway VN, có thể bị Apple từ chối → §7.4 |

---

## 2. LỰA CHỌN CÔNG NGHỆ

### 2.1 So sánh framework

| Tiêu chí | **React Native (Expo)** | Flutter | Native (Swift + Kotlin) |
|---|---|---|---|
| Codebase dùng lại web | ✅ Cao (chia sẻ RTK Query, types, i18n JSON với Next.js) | ❌ Phải viết lại | ❌ Hoàn toàn riêng |
| Tốc độ dev | Nhanh (OTA update qua EAS) | Nhanh | Chậm (2 team) |
| HLS player | `expo-video` / `react-native-video` (hls.js native) | `video_player` (HLS ổn từ 3.0) | AVPlayer / ExoPlayer |
| Ghi âm | `expo-av` / `expo-audio` ổn định | `record` package | Native |
| Push | `expo-notifications` (FCM + APNs) | `firebase_messaging` | FCM/APNs |
| Realtime SignalR | `@microsoft/signalr` chạy được trên RN | Cần SignalR client TS riêng (không official) | Không official |
| Cộng đồng VN | Rất lớn | Vừa | Lớn |
| Effort 2 nền tảng | 1× | 1× | 2× |

> **Đề xuất:** **React Native + Expo SDK 52 (Bare workflow khi cần native module)** vì:
> - Reuse code TypeScript, RTK Query, types từ frontend Next.js hiện tại.
> - SignalR có client TypeScript chính thức.
> - EAS Build + EAS Update (OTA) → release nhanh, không cần upload store cho fix nhỏ.
> - Đội đang quen React.

### 2.2 Stack chi tiết

| Lớp | Chọn | Ghi chú |
|---|---|---|
| Runtime | **Expo SDK 52** (React Native 0.76, New Architecture/Fabric) | Bật Hermes |
| Ngôn ngữ | **TypeScript 5.6** strict | Share types với web qua workspace npm |
| State | **Redux Toolkit + RTK Query** | Reuse `*.api.ts` từ frontend với baseUrl khác |
| Navigation | **Expo Router v4** (file-based) | Tương tự Next.js App Router → cong việc thấp |
| UI | **Tamagui** hoặc **NativeWind** (Tailwind cho RN) | Đề xuất NativeWind để đồng bộ design tokens với web |
| Form | React Hook Form + Zod | Reuse schema từ web |
| Video | `expo-video` (HLS native, PiP, background) | iOS dùng AVPlayer, Android dùng ExoPlayer |
| Audio record | `expo-audio` (Speaking submissions) | webm/m4a |
| Realtime | `@microsoft/signalr` 8.x | QuizHub / NotificationHub |
| Push | `expo-notifications` + FCM + APNs | Server gọi qua Expo Push API hoặc trực tiếp FCM |
| Storage | `expo-secure-store` (token), `AsyncStorage`, `expo-file-system` | Refresh token trong SecureStore |
| Offline DB | `expo-sqlite` + redux-persist | Cache khoá học/quiz/progress |
| i18n | `i18next` + `react-i18next` | Dùng cùng file JSON với web |
| Analytics | Sentry + Firebase Analytics | Crash + funnel |
| Build | **EAS Build** + **EAS Update** (OTA) | Hai env: staging / production |

---

## 3. KIẾN TRÚC TỔNG THỂ

### 3.1 Sơ đồ

```
┌─────────────────────────────────────────────────────────────┐
│                  Mobile App (Expo / RN)                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Expo Router (file-based)                            │   │
│  │  ├─ (auth)/   login, register, otp, forgot          │   │
│  │  ├─ (tabs)/   home, courses, learn, progress, me    │   │
│  │  ├─ course/[id], lesson/[id]                         │   │
│  │  ├─ quiz/[id], speaking/[attemptId]                  │   │
│  │  └─ chat/[roomId], notifications                     │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Redux Store  +  RTK Query (api slices)              │   │
│  │  ├─ authSlice (token, user, tenant)                  │   │
│  │  ├─ offlineSlice (queued actions)                    │   │
│  │  └─ *Api (auth, course, lesson, quiz, payment...)    │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Services                                            │   │
│  │  ├─ SignalRService (QuizHub, NotificationHub)        │   │
│  │  ├─ AudioRecorder (Speaking)                         │   │
│  │  ├─ VideoCacheService (expo-file-system)             │   │
│  │  ├─ PushService (expo-notifications + token sync)    │   │
│  │  └─ DeepLinkHandler (mls://, https://app.mls.vn/...) │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │  HTTPS / WSS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Backend hiện tại — ASP.NET Core 10 (KHÔNG đổi)             │
│  REST + SignalR + MinIO signed URL                          │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Cấu trúc thư mục đề xuất

```
mobile/
├─ app/                       # Expo Router screens
│  ├─ (auth)/
│  ├─ (tabs)/
│  ├─ course/[id].tsx
│  ├─ lesson/[id].tsx
│  ├─ quiz/[id].tsx
│  ├─ speaking/[attemptId].tsx
│  └─ _layout.tsx
├─ src/
│  ├─ api/                   # RTK Query slices (reuse từ frontend nếu được)
│  ├─ components/            # UI components
│  │  ├─ video/VideoPlayer.tsx
│  │  ├─ quiz/QuestionRenderer.tsx
│  │  └─ ui/                 # button, card, input
│  ├─ hooks/                 # useAuth, useTenant, useOnline
│  ├─ services/              # signalr, push, audio, storage
│  ├─ store/                 # redux store + persist
│  ├─ i18n/                  # vi.json, en.json (symlink/share với web)
│  ├─ theme/                 # tokens, dark mode (video player)
│  ├─ utils/
│  └─ types/                 # shared types
├─ assets/                   # icons, splash, fonts
├─ eas.json                  # build profiles
├─ app.config.ts             # Expo config (dynamic per env)
└─ package.json
```

### 3.3 Đa môi trường (env)

| Env | apiBaseUrl | bundleId / package | OTA channel |
|---|---|---|---|
| dev | `http://10.0.2.2:5009` (Android emu) / `localhost:5009` (iOS sim) | `vn.mls.dev` | dev |
| staging | `https://staging-api.mls.vn` | `vn.mls.staging` | staging |
| prod | `https://api.mls.vn` | `vn.mls` | production |

---

## 4. TÍNH NĂNG THEO PHASE

### 4.1 MOB-01 — MVP Mobile (V1.0)

| Nhóm | Tính năng | Mã YC liên quan |
|---|---|---|
| Auth | Đăng ký email + OTP, đăng nhập email, Google OAuth (expo-auth-session), logout, refresh token rotation, danh sách thiết bị | AUTH-01→15 |
| Profile | Xem/sửa hồ sơ, đổi mật khẩu, đổi avatar (camera/gallery) | AUTH-16→21 |
| Khoá học | Danh sách (theo level/skill), tìm kiếm, chi tiết, mua/đăng ký miễn phí | COURSE-01→10 |
| Học | Roadmap → Session → Segment, video HLS (PiP, background audio cho RN), tiến độ tự lưu, "tiếp tục học" | VID-01→18, LRN-01→08 |
| Quiz cơ bản | MCQ, True/False, Fill blank, Reading, Listening (audio in-quiz) | QZ-01→06 |
| Placement test | Làm test xếp lớp (có Speaking) | PT-01→08 |
| Speaking | Ghi âm OPIC/VSTEP, upload theo từng câu (per-question, không batch) | QZ-Speaking-01→05 |
| Thông báo | Inbox + push token register | COM-N-01→03 |
| i18n | VI / EN cơ bản | UI-22 |

### 4.2 MOB-02 — Mở rộng (V1.1)

| Nhóm | Tính năng |
|---|---|
| Thanh toán | Android: deep link VNPAY/Momo. **iOS: IAP (StoreKit 2)** — xem §7.4. Lịch sử đơn hàng, invoice viewer |
| Push nâng cao | Lịch nhắc học hàng ngày, streak warning, kết quả AI grading sẵn sàng |
| Gamification | XP, badges, leaderboard tenant |
| Chat nhóm | Tham gia/đọc/gửi tin (SignalR ChatHub), reply, typing indicator |
| Offline | ~~Cache video~~ (KH không cho phép tải video). Cache metadata khoá học/quiz đã tải + queue answer khi mất mạng |
| Deep link | `mls://course/123`, Universal Link / App Link cho marketing email |

### 4.3 MOB-03 — Nâng cao (V1.2+)

| Nhóm | Tính năng |
|---|---|
| Book Commerce | Mua sách giấy + ebook (reader EPUB tích hợp) |
| Live class | Embed Zoom SDK hoặc deep link Zoom app |
| Widget iOS/Android | Streak + bài học hôm nay |
| Apple Sign-In | Bắt buộc nếu phát hành App Store có Google sign-in |
| Watch / Wear OS | Hiển thị streak (optional) |

---

## 5. UX/UI & NAVIGATION

### 5.1 Bottom tab (4–5 tabs)

```
┌──────────────────────────────────────────────┐
│  Trang chủ │ Khoá học │ Học │ Tiến độ │ Tôi │
└──────────────────────────────────────────────┘
```

- **Trang chủ**: chào, streak, "tiếp tục học", khoá đề xuất, thông báo mới
- **Khoá học**: filter level/skill/price, search
- **Học** (Continue): mở thẳng segment đang học gần nhất
- **Tiến độ**: % theo khoá, lịch sử quiz, kết quả Speaking, biểu đồ tuần/tháng
- **Tôi**: hồ sơ, đơn hàng, chứng chỉ, settings, logout

### 5.2 Màn hình quan trọng

| ID | Màn hình | Ghi chú UX |
|---|---|---|
| S-01 | Splash + onboarding 3 step | Chỉ lần đầu |
| S-02 | Đăng nhập / Đăng ký / OTP | Lưu email gần nhất |
| S-03 | Home | Card streak (giữ lửa), CTA "Học tiếp" |
| S-04 | Course list | Sticky filter chip |
| S-05 | Course detail | Tab Mô tả / Lộ trình / Đánh giá |
| S-06 | Player | Full-screen landscape, double-tap seek ±10s, speed 0.75–2x, captions VI/EN |
| S-07 | Segment list (drawer) | Mở từ player |
| S-08 | Quiz runner | 1 câu/màn (mobile-first), progress bar, lưu nháp tự động |
| S-09 | Speaking recorder | Hiển thị câu hỏi, đồng hồ đếm, waveform, nút Retry/Submit |
| S-10 | Placement test | Wizard nhiều bước, không cho back |
| S-11 | Result / Grading pending | Skeleton + poll SignalR `gradingDone` |
| S-12 | Notifications | List + pull-to-refresh + swipe to read |
| S-13 | Profile / Settings | Đổi mật khẩu, ngôn ngữ, gỡ thiết bị |
| S-14 | Payment WebView | Hiển thị banner "Bạn đang ở cổng VNPAY" |
| S-15 | Offline banner | Hiển thị khi mất mạng, queued count |

### 5.3 Design system

- **Token màu / spacing** đồng bộ với web (xuất `tokens.json` từ Tailwind → NativeWind).
- **Font**: Inter (UI) + Be Vietnam Pro (tiếng Việt).
- **Accessibility**: VoiceOver/TalkBack labels, contrast ≥ 4.5, font scaling theo OS.

---

## 6. TÍCH HỢP BACKEND

### 6.1 Auth & Tenant

- Mỗi request gửi header: `Authorization: Bearer {access}`, `X-Tenant: {slug}` (tenant slug chọn lúc đăng nhập / cấu hình lần đầu).
- **Refresh token rotation** giống web: 401 → gọi `/api/auth/refresh` → retry; nếu refresh fail → logout về login.
- **Access token** giữ trong RAM (Redux). **Refresh token** giữ trong `expo-secure-store` (Keychain / Keystore).
- **Google OAuth**: dùng `expo-auth-session` với clientId Web hoặc Native; sau khi nhận `idToken` → POST `/api/auth/google` → nhận cặp token.

### 6.2 API client

```ts
// src/api/baseQuery.ts
const rawBase = fetchBaseQuery({
  baseUrl: Config.apiBaseUrl,
  prepareHeaders: async (headers, { getState }) => {
    const { token, tenantSlug } = (getState() as RootState).auth;
    if (token) headers.set('Authorization', `Bearer ${token}`);
    if (tenantSlug) headers.set('X-Tenant', tenantSlug);
    return headers;
  },
});

export const baseQueryWithReauth: BaseQueryFn = async (args, api, extra) => {
  let result = await rawBase(args, api, extra);
  if (result.error?.status === 401) {
    const refreshed = await tryRefresh(api);
    if (refreshed) result = await rawBase(args, api, extra);
    else api.dispatch(logout());
  }
  return result;
};
```

### 6.3 Realtime (SignalR)

- Hub: `NotificationHub` (push in-app), `QuizHub` (grading done), `ChatHub` (Phase 6).
- Connect khi app vào foreground, disconnect khi background > 30s (tiết kiệm pin).
- Reconnect tự động với exponential backoff.

### 6.4 Video HLS

- Server đã sinh `m3u8` qua MinIO + signed URL TTL 2h → cần **refresh URL khi sắp hết hạn** trong khi đang phát.
- Mobile player: `expo-video` (`useVideoPlayer`), bật PiP iOS 15+, background audio (cấu hình `UIBackgroundModes`).
- Theo dõi tiến độ: gọi `POST /api/learning/progress` mỗi 10s (throttle) + on pause/finish.

### 6.5 Speaking upload (per-question)

Giữ đúng pattern web (xem [SpeakingCommands.cs](backend/MLS.Application/Quiz/Commands/SpeakingCommands.cs)):

1. Record bằng `expo-audio` → file `.m4a` (iOS) / `.webm` hoặc `.m4a` (Android).
2. `POST /api/quiz/speaking/upload` (multipart) — backend lưu MinIO, trả `submissionId`.
3. Subscribe `QuizHub.OnGradingDone(submissionId)` để cập nhật điểm.
4. Khi mất mạng → cho vào **upload queue (SQLite + redux-persist)**, retry khi online.

### 6.6 AI integration

Mobile **không gọi OpenAI trực tiếp**. Tất cả qua backend (xem [AI_GRADING_INTEGRATION_DESIGN.md](AI_GRADING_INTEGRATION_DESIGN.md)). Mobile chỉ:

- Hiển thị progress "Đang chấm AI…" (skeleton).
- Subscribe SignalR event để render kết quả + transcript.

---

## 7. TÍNH NĂNG ĐẶC THÙ MOBILE

### 7.1 Offline-first (KHÔNG cache video — Q6)

| Layer | Cơ chế |
|---|---|
| Profile/courses | redux-persist (AsyncStorage) — TTL 24h |
| Video | **KHÔNG cache** theo quyết định KH. Player chỉ stream HLS online; offline → banner "Cần kết nối mạng để xem video" |
| Quiz answers | SQLite queue: `pending_actions(id, type, payload, createdAt, retries)` |
| Sync | `NetInfo` listener → khi online → flush queue tuần tự |

### 7.2 Push notification

- `expo-notifications` register → lấy **ExpoPushToken** hoặc **FCM token**.
- POST `/api/users/me/devices` để backend lưu.
- Backend dùng Hangfire job gọi FCM/APNs. Topic mẫu: `daily_reminder`, `streak_warning`, `grading_done`, `new_course`.
- Deep link payload: `{ "type": "lesson", "id": "..." }` → handler điều hướng.

### 7.3 Deep link / Universal Link

- Scheme: `mls://` cho dev.
- iOS Universal Link + Android App Link: `https://app.mls.vn/...` (cần `apple-app-site-association` + `assetlinks.json` trên server).

### 7.4 Thanh toán (KH chọn: dual track Android = VNPAY/Momo, iOS = IAP)

- **Android**: `WebBrowser.openAuthSessionAsync(url, returnUrl)` → VNPAY/Momo → callback `mls://payment/return?orderId=...`.
- **iOS**: dùng **Apple In-App Purchase (StoreKit 2)** qua thư viện `react-native-iap` hoặc `expo-in-app-purchases`.
  - Mỗi khoá học mua ngoài (chargeable) phải khai báo **Non-Consumable Product** trong App Store Connect.
  - Subscription (nếu có gói tháng/năm) khai báo **Auto-Renewable Subscription Group**.
  - Flow: user tap Mua → IAP sheet Apple → nhận `transactionReceipt` → POST `/api/payment/apple-iap/verify` → backend gọi App Store Server API verify → cấp quyền học.
  - Backend cần endpoint **mới**: `POST /api/payment/apple-iap/verify`, `POST /api/payment/apple-iap/webhook` (Server-to-Server notifications V2).
  - **Lưu ý**: phí Apple 30% (15% năm thứ 2 với subscription) — đã được KH chấp nhận.
- **Routing client**: `if (Platform.OS === 'ios') useIapFlow() else useVnpayFlow()`.
- **Đồng bộ catalog**: backend cần map mỗi `courseId/planId` ↔ Apple `productId` (bảng `apple_iap_products`).

### 7.5 Permissions

| Quyền | Khi nào | Lý do hiển thị |
|---|---|---|
| Mic | Trước câu Speaking đầu tiên | "Để ghi âm bài nói của bạn" |
| Camera | Khi đổi avatar / quét QR | Tuỳ chọn |
| Notifications | Sau onboarding | "Nhận nhắc học và kết quả chấm bài" |
| Face ID / Touch ID / Biometric | Khi bật App Lock (§8.4) | "Mở khoá nhanh bằng sinh trắc học" |

### 7.6 OTA update (KH chọn: hỏi người dùng — Q5)

Dùng **EAS Update** nhưng không `runtimeVersion` auto-apply. Flow:

1. App khởi động → `Updates.checkForUpdateAsync()` background.
2. Nếu có bản mới → hiện dialog: "Có bản cập nhật mới (v1.x.y). Cập nhật ngay? [Để sau] [Cập nhật]".
3. User chọn Cập nhật → `Updates.fetchUpdateAsync()` + `Updates.reloadAsync()`.
4. Tôn trọng lựa chọn "Để sau" trong 24h (lưu timestamp AsyncStorage), không nhắc lại trong khoảng đó.
5. **Bản update bắt buộc** (security/critical): flag `force=true` từ manifest → không có nút "Để sau".

Code mẫu:
```ts
useEffect(() => {
  (async () => {
    const u = await Updates.checkForUpdateAsync();
    if (u.isAvailable) {
      const dismissed = await getDismissedAt();
      if (Date.now() - dismissed < 24 * 3600_000 && !u.manifest?.extra?.force) return;
      Alert.alert('Có bản cập nhật', 'Cập nhật ngay để có trải nghiệm tốt nhất?', [
        { text: 'Để sau', onPress: () => setDismissedAt(Date.now()) },
        { text: 'Cập nhật', onPress: async () => { await Updates.fetchUpdateAsync(); await Updates.reloadAsync(); } },
      ]);
    }
  })();
}, []);
```

---

## 8. BẢO MẬT, MULTI-TENANT, I18N

### 8.1 Bảo mật

- Token: refresh trong SecureStore, access trong RAM.
- Bật **SSL pinning** ở môi trường prod (gói `react-native-ssl-pinning`).
- Bật **jailbreak/root detection** (warning, không block trừ khi KH yêu cầu).
- Tắt screenshot ở màn hình chứa nội dung trả phí (`expo-screen-capture`) — tuỳ chọn.
- Obfuscate JS bundle (Hermes bytecode + ProGuard).
- OWASP MASVS L1 checklist (xem §11.3).

### 8.2 Multi-tenant + Multi-account (KH chọn làm V1 — Q8)

- Lần đầu chạy: chọn tenant từ danh sách public (`GET /api/tenants/public`) hoặc nhập slug.
- Cache `tenantSlug` trong SecureStore; mọi request đính `X-Tenant`.
- **Account switcher** từ V1: lưu mảng `accounts: [{ tenantSlug, userId, displayName, avatarUrl, refreshTokenRef }]` trong SecureStore (mỗi refresh token lưu key riêng).
  - Màn Tôi → "Chuyển tài khoản" → bottom sheet list account → tap để switch (gọi refresh để lấy access token mới + reset Redux store + reload tab Home).
  - Nút "+ Thêm tài khoản" → quay về flow login (giữ accounts cũ).
  - Logout đơn lẻ chỉ xoá account hiện tại; vẫn còn account khác.

### 8.3 Đa ngôn ngữ (KH chọn cấu trúc mở rộng — Q9)

- Reuse cấu trúc JSON namespace từ web ([i18n-multilang-design.md](i18n-multilang-design.md)).
- V1 bundle sẵn: `vi`, `en`.
- **Hot-add language**: thêm file `src/i18n/locales/{lang}.json` + đăng ký vào `supportedLngs` → build OTA, không cần đổi native.
- Lazy load namespace (`auth`, `course`, `quiz`, …) để giảm bundle.
- Settings → "Ngôn ngữ" → list dropdown động theo `supportedLngs`.

### 8.4 App Lock (Biometric / PIN) — V1, Q11

- Dùng `expo-local-authentication` (Face ID / Touch ID / Android Biometric) + fallback **PIN 4–6 số** (hash bcrypt lưu SecureStore).
- Settings → "Khoá ứng dụng": [Tắt | Sau khi app vào background X giây | Mỗi lần mở].
- Khi app `AppState` chuyển `active` mà đã quá threshold → push màn `lock-screen` (overlay) → user mở khoá → quay lại màn trước.
- Khoá cũng áp dụng trước khi xem **lịch sử thanh toán** và **đổi mật khẩu** (nhạy cảm).
- Nếu device không có biometric → bắt buộc dùng PIN.

---

## 9. HIỆU NĂNG & MONITORING

| Mục tiêu | KPI |
|---|---|
| Cold start | < 2.5s trên thiết bị tầm trung (Galaxy A23) |
| Time to interactive trang Home | < 1.5s sau cold start |
| Bundle (Android APK) | < 35MB |
| Crash-free sessions | ≥ 99.5% |
| Video start time | < 2s |
| Battery khi xem video 30 phút | < 8% pin |

Công cụ:

- **Sentry React Native** (crash + performance trace).
- **Firebase Analytics** (funnel: install → register → first lesson → first quiz → first purchase).
- **Flipper** (dev only).
- **React Native Performance** + Hermes profile khi cần tối ưu.

---

## 10. KẾ HOẠCH PHÁT TRIỂN — BREAK TASK

### 10.1 Tổng quan

- **Tổng thời lượng V1 (MOB-01)**: 10 sprint × 1 tuần = ~2.5 tháng với 1 RN dev + 0.5 designer + 0.5 QA.
- **V1.1 (MOB-02)**: **5 sprint** (đã +1 cho IAP iOS sau khi chốt Q7).
- **V1.2 (MOB-03)**: tuỳ scope.
- Sau khi xong Sprint 9 → đóng gói APK + TestFlight gửi KH **cài offline** nghiệm thu trước khi submit store (Q4).

### 10.2 Sprint plan chi tiết (MOB-01)

#### Sprint 0 — Khởi tạo (1 tuần)

| Task | Output |
|---|---|
| MOB-S0-01 Tạo monorepo / folder `mobile/` + Expo SDK 52 init | Repo chạy được trên iOS/Android sim |
| MOB-S0-02 Cấu hình EAS Build + 3 profile (dev/staging/prod) | `eas.json` |
| MOB-S0-03 Cấu hình TypeScript strict + ESLint + Prettier dùng chung với web | Lint pass |
| MOB-S0-04 Setup NativeWind + design tokens từ Tailwind web | Theme provider |
| MOB-S0-05 Setup Expo Router + bottom tabs khung | App chạy 5 tab trống |
| MOB-S0-06 Setup Redux Toolkit + redux-persist + baseQuery | Store hoạt động |
| MOB-S0-07 Setup i18next + load vi/en | Toggle ngôn ngữ |
| MOB-S0-08 Cấu hình Sentry + Firebase | Test crash báo về Sentry |
| MOB-S0-09 Setup CI GitHub Actions: lint + typecheck + EAS build dev | Build artifact |

#### Sprint 1 — Auth & Onboarding (1 tuần)

| Task | Endpoint backend đã có |
|---|---|
| MOB-S1-01 Splash + Onboarding 3-step | — |
| MOB-S1-02 Màn Đăng ký email + OTP 6 số | `POST /api/auth/register`, `/api/auth/verify-otp` |
| MOB-S1-03 Đăng nhập email | `POST /api/auth/login` |
| MOB-S1-04 Quên mật khẩu / Reset | `POST /api/auth/forgot-password` |
| MOB-S1-05 Google sign-in (expo-auth-session) | `POST /api/auth/google` |
| MOB-S1-06 Token lưu SecureStore + interceptor refresh | `POST /api/auth/refresh` |
| MOB-S1-07 Tenant picker (lần đầu) | `GET /api/tenants/public` |
| MOB-S1-08 Logout + revoke session | `POST /api/auth/logout` |
| MOB-S1-09 Unit test auth flow | Jest |

#### Sprint 2 — Hồ sơ + Multi-account + Thông báo (1 tuần)

| Task | API |
|---|---|
| MOB-S2-01 Profile screen + edit | `GET/PUT /api/users/me` |
| MOB-S2-02 Đổi avatar (camera/gallery + upload MinIO) | `POST /api/users/me/avatar` |
| MOB-S2-03 Đổi mật khẩu | `POST /api/auth/change-password` |
| MOB-S2-04 Quản lý thiết bị (xem + revoke) | `GET /api/auth/devices`, `DELETE …` |
| MOB-S2-05 Đăng ký push token | `POST /api/users/me/devices` |
| MOB-S2-06 Inbox notifications + pull-to-refresh | `GET /api/notifications` |
| MOB-S2-07 SignalR `NotificationHub` connect/disconnect theo lifecycle | — |
| MOB-S2-08 **Account store** SecureStore (`accounts[]`) + switcher bottom sheet | — |
| MOB-S2-09 **"Thêm tài khoản"** → quay về login, không xoá account cũ | — |
| MOB-S2-10 Logout chỉ remove account hiện tại | `POST /api/auth/logout` |

#### Sprint 3 — Khoá học (1 tuần)

| Task |
|---|
| MOB-S3-01 Course list + filter (level, skill) + infinite scroll |
| MOB-S3-02 Search debounce |
| MOB-S3-03 Course detail (tabs Mô tả / Lộ trình / Đánh giá) |
| MOB-S3-04 Enroll khoá miễn phí |
| MOB-S3-05 Lưu "khoá đã xem gần đây" |
| MOB-S3-06 Cache RTK Query 5 phút |

#### Sprint 4 — Video Player & Tiến độ (1 tuần)

| Task |
|---|
| MOB-S4-01 VideoPlayer dùng `expo-video` (HLS + signed URL refresh) |
| MOB-S4-02 Captions VI/EN (WebVTT) |
| MOB-S4-03 Speed control 0.75–2x + PiP |
| MOB-S4-04 Theo dõi watchTime → `POST /api/learning/progress` throttle 10s |
| MOB-S4-05 "Tiếp tục học" trên Home |
| MOB-S4-06 Segment drawer |
| MOB-S4-07 Background audio cho phép tắt màn nghe tiếp |

#### Sprint 5 — Quiz Engine (1 tuần)

| Task |
|---|
| MOB-S5-01 QuizRunner: 1 câu/màn, progress bar, timer |
| MOB-S5-02 MCQ + True/False renderer |
| MOB-S5-03 Fill blank (keyboard avoiding) |
| MOB-S5-04 Reading passage scroll + question pane |
| MOB-S5-05 Listening: audio player trong câu |
| MOB-S5-06 Auto-save nháp mỗi câu (`POST /api/quiz/attempts/{id}/answer`) |
| MOB-S5-07 Submit attempt + result screen |

#### Sprint 6 — Speaking + Placement (1 tuần)

| Task |
|---|
| MOB-S6-01 AudioRecorder component (expo-audio) + waveform |
| MOB-S6-02 Speaking question screen: hiển thị prompt + countdown |
| MOB-S6-03 Per-question upload + retry |
| MOB-S6-04 Pending grading + SignalR subscribe `OnGradingDone` |
| MOB-S6-05 Placement test wizard (no back) |
| MOB-S6-06 Kết quả placement + đề xuất level |

#### Sprint 7 — Polish UX + Đa ngôn ngữ + Dark mode + Accessibility (1 tuần)

| Task |
|---|
| MOB-S7-01 Skeleton loader cho mọi list |
| MOB-S7-02 Empty state + error state đồng nhất |
| MOB-S7-03 Pull-to-refresh tất cả list |
| MOB-S7-04 Accessibility labels + dynamic type |
| MOB-S7-05 i18n hoàn thiện vi/en + cơ chế hot-add language |
| MOB-S7-06 **Full dark mode** (Q12): tokens light/dark, theo system + override manual trong Settings |
| MOB-S7-07 Audit mọi màn render đúng cả light & dark |
| MOB-S7-08 App icon, splash (light/dark), store screenshots |

#### Sprint 8 — Hiệu năng + Bảo mật + App Lock + OTA prompt (1 tuần)

| Task |
|---|
| MOB-S8-01 SSL pinning prod |
| MOB-S8-02 Tắt screenshot màn paid (tuỳ chọn) |
| MOB-S8-03 Hermes bytecode + ProGuard |
| MOB-S8-04 Bundle analyzer + giảm icon set |
| MOB-S8-05 Cold start profiling, lazy load module nặng |
| MOB-S8-06 Crash & ANR review trên Sentry |
| MOB-S8-07 **App Lock** (Q11): biometric + PIN fallback, settings, lock-screen overlay |
| MOB-S8-08 **OTA prompt** (Q5): dialog hỏi user + dismiss 24h + force flag |
| MOB-S8-09 Verify khoá ứng dụng cũng áp dụng trước payment history & change password |

#### Sprint 9 — QA toàn diện + Đóng gói cài đặt offline cho KH (1 tuần) — Q4

| Task |
|---|
| MOB-S9-01 Test ma trận thiết bị: iPhone SE/13/15, Pixel 5, Galaxy A23, Xiaomi tầm trung |
| MOB-S9-02 Test mạng 3G/Wi-Fi/offline |
| MOB-S9-03 Test long-session video + recovery |
| MOB-S9-04 **Build APK release (Android)** ký bằng keystore riêng → file `mls-v1.0.0.apk` gửi KH cài tay |
| MOB-S9-05 **Build IPA (iOS) Ad Hoc** + register UDID thiết bị KH (max 100/năm) HOẶC **TestFlight Internal** (mời email KH) |
| MOB-S9-06 Viết **hướng dẫn cài đặt offline** (PDF): Android cho phép "Cài app từ nguồn không xác định"; iOS chấp nhận thư mời TestFlight |
| MOB-S9-07 KH nghiệm thu trên máy thật → thu feedback → fix |
| MOB-S9-08 Sau khi KH OK → submit Play Store / App Store production |

### 10.3 Sprint plan MOB-02 (5 sprint × 1 tuần — đã +1 cho IAP iOS)

| Sprint | Nội dung |
|---|---|
| MOB-10 | **Thanh toán Android**: deep link VNPAY/Momo + lịch sử đơn hàng + invoice viewer |
| MOB-11 | **Thanh toán iOS (IAP — Q7)**: tích hợp `react-native-iap`/StoreKit 2, khai báo product trên App Store Connect, backend `POST /api/payment/apple-iap/verify` + S2S webhook, restore purchases |
| MOB-12 | Push notification nâng cao (lịch hàng ngày, streak, grading done) + Notification preferences |
| MOB-13 | Gamification (XP, badge, leaderboard) + Streak UI |
| MOB-14 | Chat nhóm cơ bản (join, send, typing) — ~~bỏ offline cache video~~ |

### 10.4 Backlog ưu tiên thấp (MOB-03)

- Book Commerce + EPUB reader
- Live class embed
- Apple Sign-In (bắt buộc nếu giữ Google Sign-In trên iOS)
- iOS Widget streak

---

## 11. KIỂM THỬ, CI/CD, PHÁT HÀNH

### 11.1 Test pyramid

| Loại | Tool | Mục tiêu coverage |
|---|---|---|
| Unit | Jest + React Native Testing Library | ≥ 60% utils/hooks/reducers |
| Component | RNTL + jest snapshots cẩn trọng | Smoke cho mọi screen chính |
| E2E | **Maestro** (đơn giản, YAML) | 10 user journey lõi |
| Manual exploratory | QA test plan | Mọi sprint trước release |

### 11.2 CI/CD

```
GitHub Actions:
  on: PR
    ├─ lint + typecheck + jest
    └─ EAS Build dev (Android APK) cho QA
  on: push main
    ├─ EAS Build staging
    └─ EAS Update staging channel (OTA)
  on: tag v*
    ├─ EAS Build production
    ├─ EAS Submit lên TestFlight + Play Internal
    └─ EAS Update production channel sau khi smoke pass
```

### 11.3 Checklist phát hành store

- [ ] App icon 1024×1024, splash, adaptive icon Android
- [ ] Privacy policy URL + Data safety form (Google), App Privacy (Apple)
- [ ] Permission usage description trong `Info.plist` (mic/camera/notification/biometric)
- [ ] Khai báo encryption (App Store: `ITSAppUsesNonExemptEncryption=false`)
- [ ] Khai báo IAP product trong App Store Connect (Q7)
- [ ] Google: target API 35 (Android 15)
- [ ] Screenshot 6.7" + 5.5" iOS, phone + 7" + 10" Android (cả light & dark mode)
- [ ] Demo account cho reviewer (multi-tenant: cung cấp 2 tenant slug để test switcher)
- [ ] OWASP MASVS L1 self-check

### 11.4 Đóng gói cài đặt offline cho KH (Q4)

Trước khi submit store, **bắt buộc** giai đoạn nghiệm thu trên máy thật của KH:

| Nền tảng | Cách phân phối | Lệnh build |
|---|---|---|
| **Android** | File `.apk` ký bằng release keystore, gửi qua Google Drive / link tải. KH bật "Cài app từ nguồn không xác định" để cài. | `eas build --platform android --profile preview` → output `.apk` |
| **iOS (cách 1)** | **TestFlight Internal** (khuyến nghị): mời email KH → cài qua app TestFlight. Không cần UDID. Giới hạn 100 internal tester, không cần Apple review. | `eas build --platform ios --profile production` + `eas submit --platform ios --testflight` |
| **iOS (cách 2)** | **Ad Hoc** `.ipa`: thu thập UDID thiết bị KH → thêm vào provisioning profile → build → gửi `.ipa` + hướng dẫn cài qua AltStore/Apple Configurator. Giới hạn 100 device/năm. | `eas build --platform ios --profile preview` (resign Ad Hoc) |

Tài liệu kèm theo (PDF, song ngữ VI/EN):

- Hướng dẫn cài APK trên Android (mở settings → cho phép nguồn không xác định)
- Hướng dẫn TestFlight: nhận email mời → tải TestFlight app → accept → install
- Demo account + tenant slug để test
- Bug report template (mô tả + screenshot + step + device + OS version)

Chỉ submit store sau khi **KH ký biên bản nghiệm thu**.

---

## 12. CHI PHÍ & RỦI RO

### 12.1 Chi phí cố định / năm

| Khoản | Chi phí |
|---|---|
| Apple Developer Program | $99/năm |
| Google Play Console | $25 một lần |
| EAS Production plan | $99/tháng (build không giới hạn) — hoặc tự host build server |
| Sentry team plan | $26/tháng (hoặc free tier nếu ít event) |
| Firebase | Free tier đủ giai đoạn đầu |
| FCM | Free |
| APNs | Free (đã trong Apple Dev) |

### 12.2 Rủi ro chính

| # | Rủi ro | Mitigation |
|---|---|---|
| R1 | ~~Apple từ chối vì thanh toán ngoài IAP~~ → đã giải quyết bằng IAP (Q7) | Vẫn cần test sandbox kỹ trước submit |
| R2 | HLS signed URL hết hạn giữa video | Refresh URL khi còn < 5 phút TTL |
| R3 | Ghi âm Android một số máy ROM tuỳ biến (Xiaomi) | Test ma trận thiết bị Sprint 9 |
| R4 | Push không nhận trên Xiaomi/Huawei (battery saver) | Hướng dẫn user whitelist + dùng socket fallback |
| R5 | OTA update phá hỏng prod | Bật **rollout %** + rollback EAS; dialog hỏi user (Q5) giảm rủi ro |
| R6 | New Architecture (Fabric) gây crash 3rd-party lib | Có flag tắt nếu cần |
| R7 | Bundle size tăng nhanh | Bundle analyzer mỗi sprint |
| R8 | Multi-tenant slug sai → user vào nhầm tenant | Validate trước login + cache an toàn |
| R9 | IAP catalog sync sai (Apple price tier ≠ giá VND) | Bảng map `apple_iap_products` + cron sync giá; ẩn khoá không có productId trên iOS |
| R10 | KH cài APK trên Android 14+ bị chặn (Restricted Settings) | Hướng dẫn cấp quyền + ký APK đúng |
| R11 | App Lock biometric fail trên Android cũ | Fallback PIN bắt buộc |

---

## 13. BẢNG QUYẾT ĐỊNH KH/PO — ĐÃ CHỐT (31/05/2026)

| # | Câu hỏi | KH quyết | Tác động thiết kế |
|---|---|---|---|
| Q1 | Framework | ✅ React Native + Expo SDK 52 | Giữ §2 |
| Q2 | iOS + Android ngay V1 | ✅ Có | Sprint 9 test ma trận cả 2 nền tảng |
| Q3 | OS tối thiểu | ✅ iOS 15+, Android 8 (API 26) | Giữ §2 |
| Q4 | Đóng gói cài đặt offline để test trước store | ✅ **Sau khi implement, build file APK (Android) + IPA (iOS, Ad Hoc/TestFlight) để KH cài tay** | §11.4 (mới) — distribute APK trực tiếp + TestFlight internal trước khi submit store |
| Q5 | OTA update | ✅ **Hỏi người dùng trước khi áp dụng** | §7.6 (mới) — dialog "Có bản cập nhật, cập nhật ngay?" |
| Q6 | Tải video offline | ✅ **Không cho phép tải video offline** | Bỏ task offline video khỏi MOB-02; chỉ cache metadata/quiz |
| Q7 | Thanh toán iOS | ✅ **Bổ sung IAP cho iOS** (chấp nhận Apple 30%) | §7.4 mở rộng + Sprint MOB-10 thêm task IAP |
| Q8 | Đa tài khoản / multi-tenant trên 1 device | ✅ **Làm V1** | §8.2 — account switcher từ V1, Sprint 2 |
| Q9 | Ngôn ngữ V1 | ✅ **VI + EN + cấu trúc mở rộng (thêm ngôn ngữ qua JSON)** | §8.3 — namespace plug-in |
| Q10 | Crash/analytics | ✅ Sentry + Firebase Analytics | Giữ §9 |
| Q11 | App lock (PIN/Biometric) | ✅ **Làm V1** | §8.4 (mới) — Sprint 8 thêm task |
| Q12 | Dark mode | ✅ **Full dark mode V1** | §5.3 — design tokens 2 theme; Sprint 7 mở rộng |

---

## 14. PHỤ LỤC

### 14.1 Danh sách màn hình (28 màn V1)

```
Auth (6): splash, onboarding, login, register, otp, forgot
Tabs (5): home, courses, learn-continue, progress, me
Course (3): course-detail, lesson-player, segment-drawer
Quiz (4): quiz-runner, quiz-result, speaking-recorder, grading-pending
Placement (2): pt-intro, pt-runner
Profile (5): edit, change-password, devices, notifications-inbox, settings
System (3): payment-webview, offline-banner, error-fallback
```

### 14.2 Endpoint backend cần (đã có hoặc cần bổ sung)

| Endpoint | Trạng thái |
|---|---|
| `/api/auth/*` | ✅ Có |
| `/api/users/me`, `/api/users/me/devices` | ✅/🟡 cần bổ sung device register |
| `/api/tenants/public` | 🟡 Cần endpoint public list (cho tenant picker + multi-account) |
| `/api/courses`, `/api/courses/{id}` | ✅ |
| `/api/learning/progress` | ✅ |
| `/api/quiz/attempts/*` | ✅ |
| `/api/quiz/speaking/upload` | ✅ |
| `/api/payment/*` (VNPAY/Momo) | ✅ (web đang dùng) |
| `/api/payment/apple-iap/verify` | ❌ **Cần build mới** (Q7) |
| `/api/payment/apple-iap/webhook` (S2S V2) | ❌ **Cần build mới** (Q7) |
| `apple_iap_products` mapping table | ❌ **Cần migration mới** |
| SignalR `QuizHub`, `NotificationHub`, `ChatHub` | ✅ |
| `/api/notifications/*` | ✅ |

### 14.3 NPM packages chính

```
expo, expo-router, expo-secure-store, expo-file-system,
expo-video, expo-audio, expo-notifications, expo-auth-session,
expo-image, expo-localization, expo-sqlite, expo-screen-capture,
expo-local-authentication,           # App Lock (Q11)
expo-updates,                        # OTA + prompt (Q5)
@reduxjs/toolkit, react-redux, redux-persist,
@microsoft/signalr, react-hook-form, zod,
nativewind, tailwindcss,
i18next, react-i18next,
react-native-iap,                    # iOS IAP (Q7)
@sentry/react-native, @react-native-firebase/app + analytics,
@react-native-community/netinfo
```

### 14.4 Glossary

| Từ | Nghĩa |
|---|---|
| OTA | Over-the-air JS update qua EAS Update |
| HLS | HTTP Live Streaming (.m3u8) |
| PiP | Picture-in-Picture |
| FCM / APNs | Firebase Cloud Messaging / Apple Push Notification Service |
| MASVS | Mobile Application Security Verification Standard |
| Bare workflow | Expo nhưng có thư mục `ios/`, `android/` để custom native |

### 14.5 Tham chiếu

- [PHU_LUC_YEU_CAU_CHUC_NANG.md](PHU_LUC_YEU_CAU_CHUC_NANG.md) §XVI MOB-01/02
- [updated_course_learning_flow_business_spec_vi.md](updated_course_learning_flow_business_spec_vi.md) §9.3
- [AI_GRADING_INTEGRATION_DESIGN.md](AI_GRADING_INTEGRATION_DESIGN.md) §6 (mobile gọi qua backend)
- [PHASE6_GROUP_CHAT_DESIGN.md](PHASE6_GROUP_CHAT_DESIGN.md) (chat mobile-first)
- [i18n-multilang-design.md](i18n-multilang-design.md) (reuse JSON namespace)
- [book commerce.md](book%20commerce.md) (payment flow)

---

> **Bước tiếp theo:** KH/PO duyệt §13 → khởi tạo repo `mobile/` (Sprint 0) → bắt đầu Sprint 1 Auth.
