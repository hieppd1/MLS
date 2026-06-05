# Thiết kế Đa ngữ (i18n) — MLS Platform

**Ngôn ngữ hỗ trợ**: Tiếng Việt (`vi`) · Tiếng Anh (`en`) · Tiếng Hàn (`ko`)  
**Mặc định**: `vi`  
**Phiên bản tài liệu**: 1.0 — 28/05/2026

---

## 1. Phân tích hiện trạng

### Frontend
| Mục | Hiện tại | Vấn đề |
|-----|----------|--------|
| Framework | Next.js 16.2.5 — App Router | Không có i18n lib |
| `<html lang>` | `lang="vi"` hardcode trong `layout.tsx` | Không thay đổi theo user |
| Nav labels | `Trang chủ / Khoá học / Sách…` hardcode trong `Header.tsx` | Không thể dịch |
| URL routes | `/khoa-hoc`, `/sach`, `/don-hang`… | Vietnamese-only branding (giữ nguyên) |
| Font | `Be_Vietnam_Pro` (latin + vietnamese) | Thiếu font Hàn Quốc |
| Thư viện dịch | Không có | — |

### Backend
| Mục | Hiện tại | Vấn đề |
|-----|----------|--------|
| Localization middleware | Không có | — |
| Error messages | Hardcode tiếng Việt trong Controllers | Không i18n |
| Resource files | Không có `.resx` | — |
| `UserProfile.NativeLanguage` | Có sẵn (`string?`) | Chưa dùng cho locale routing |

### Database
| Entity | Fields cần dịch |
|--------|----------------|
| `Courses` | `Title`, `ShortDescription`, `Description`, `Outcomes`, `Requirements`, `TargetAudience` |
| `CourseModules` | `Title`, `Description` |
| `Books` | `Title`, `ShortDescription`, `Description` |
| `BookCategories` | `Name`, `Description` |
| `Quizzes` | `Title`, `Description` |
| `Questions` | `Content`, `Explanation` |
| `QuestionOptions` | `Content`, `FeedbackIfSelected` |
| `Notifications` | `Title`, `Body` |
| `CourseLevels` | `Name`, `Description` |

---

## 2. Quyết định kiến trúc

### 2.1 Chiến lược locale

**Chọn: Cookie/User-preference based (không prefix URL)**

Lý do:
- URL tiếng Việt là branding của platform (`/khoa-hoc` ≡ identity)
- Migration zero-downtime: không cần redirect 100+ routes
- Học platform: learner EN/KO vào để học tiếng Việt → UI dịch, content song ngữ
- Đơn giản hơn cho SEO (không cần canonical complexity)

```
Thứ tự ưu tiên resolve locale:
  1. User.PreferredLocale (DB, đã đăng nhập)
  2. Cookie "NEXT_LOCALE" (trình duyệt)
  3. Accept-Language header (browser)
  4. "vi" (default)
```

### 2.2 Frontend — next-intl

**Thư viện**: [`next-intl`](https://next-intl-docs.vercel.app/) v3.x

Lý do chọn next-intl:
- Native App Router + Server Components support
- TypeScript-typed message keys (compile-time safety)
- Hỗ trợ ICU message format (plural, select, interpolation)
- SSR-friendly, không flash of untranslated content
- Bundle splitting per-locale

### 2.3 Backend — ASP.NET Core Localization

**Thư viện**: Built-in `Microsoft.Extensions.Localization`

- `IStringLocalizer<SharedResource>` inject vào Controllers/Handlers
- `.resx` files: `SharedResource.vi.resx`, `SharedResource.en.resx`, `SharedResource.ko.resx`
- Middleware: `RequestLocalizationMiddleware` đọc `Accept-Language` header hoặc query `?lang=`

### 2.4 Database — Translation Tables

**Pattern**: Separate translation table (không sửa bảng gốc, backward-compatible)

```sql
-- Gốc vẫn giữ tiếng Việt (fallback)
Courses.Title = "Tiếng Việt Giao Tiếp Cơ Bản"

-- Bảng dịch bổ sung
CourseTranslations { CourseId, Locale="en", Title="Basic Vietnamese Conversation" }
CourseTranslations { CourseId, Locale="ko", Title="기초 베트남어 회화" }
```

**Fallback chain**: `ko → en → vi` (nếu không có bản dịch Hàn → thử Anh → trả về Việt)

---

## 3. Cấu trúc file translation

### 3.1 Frontend message files

```
frontend/src/messages/
├── vi.json          ← default, đầy đủ nhất
├── en.json
└── ko.json
```

### 3.2 Cấu trúc namespace

```json5
// vi.json — full structure
{
  // ── Navigation ──────────────────────────────
  "nav": {
    "home":        "Trang chủ",
    "courses":     "Khoá học",
    "books":       "Sách",
    "exam":        "Thi online",
    "groups":      "Nhóm",
    "search_placeholder": "Tìm khoá học..."
  },

  // ── Auth ────────────────────────────────────
  "auth": {
    "login":              "Đăng nhập",
    "register":           "Đăng ký",
    "logout":             "Đăng xuất",
    "email":              "Email",
    "password":           "Mật khẩu",
    "confirm_password":   "Xác nhận mật khẩu",
    "full_name":          "Họ và tên",
    "forgot_password":    "Quên mật khẩu?",
    "reset_password":     "Đặt lại mật khẩu",
    "no_account":         "Chưa có tài khoản?",
    "have_account":       "Đã có tài khoản?",
    "login_title":        "Chào mừng trở lại",
    "register_title":     "Tạo tài khoản mới",
    "send_reset_email":   "Gửi email đặt lại mật khẩu"
  },

  // ── Common actions ───────────────────────────
  "common": {
    "save":          "Lưu thay đổi",
    "cancel":        "Huỷ",
    "delete":        "Xoá",
    "edit":          "Sửa",
    "add":           "Thêm",
    "back":          "Quay lại",
    "loading":       "Đang tải...",
    "saving":        "Đang lưu...",
    "confirm":       "Xác nhận",
    "search":        "Tìm kiếm",
    "filter":        "Lọc",
    "all":           "Tất cả",
    "none":          "Không có",
    "yes":           "Có",
    "no":            "Không",
    "close":         "Đóng",
    "submit":        "Gửi",
    "next":          "Tiếp theo",
    "previous":      "Trước đó",
    "finish":        "Hoàn thành",
    "view_all":      "Xem tất cả",
    "see_more":      "Xem thêm",
    "required_field": "* Bắt buộc"
  },

  // ── Errors ──────────────────────────────────
  "errors": {
    "required":          "Trường này không được để trống",
    "email_invalid":     "Email không hợp lệ",
    "password_min":      "Mật khẩu tối thiểu {min} ký tự",
    "password_mismatch": "Mật khẩu xác nhận không khớp",
    "name_min":          "Họ tên tối thiểu 2 ký tự",
    "server_error":      "Đã xảy ra lỗi. Vui lòng thử lại.",
    "not_found":         "Không tìm thấy.",
    "unauthorized":      "Bạn chưa đăng nhập.",
    "forbidden":         "Bạn không có quyền thực hiện thao tác này.",
    "network_error":     "Không thể kết nối đến máy chủ."
  },

  // ── Profile ─────────────────────────────────
  "profile": {
    "title":             "Thông tin cá nhân",
    "avatar":            "Ảnh đại diện",
    "full_name":         "Họ và tên",
    "phone":             "Số điện thoại",
    "dob":               "Ngày sinh",
    "gender":            "Giới tính",
    "gender_male":       "Nam",
    "gender_female":     "Nữ",
    "gender_other":      "Khác",
    "address":           "Địa chỉ",
    "level":             "Trình độ tiếng Việt",
    "native_language":   "Ngôn ngữ mẹ đẻ",
    "preferred_locale":  "Ngôn ngữ giao diện",
    "update_success":    "Cập nhật thành công!",
    "tabs": {
      "info":     "Thông tin",
      "teacher":  "Profile giáo viên",
      "courses":  "Khoá học",
      "badges":   "Huy hiệu",
      "settings": "Cài đặt"
    }
  },

  // ── Courses ─────────────────────────────────
  "course": {
    "enroll":            "Đăng ký học",
    "enrolled":          "Đã đăng ký",
    "continue":          "Tiếp tục học",
    "buy_now":           "Mua ngay",
    "free":              "Miễn phí",
    "lessons":           "{count} bài học",
    "students":          "{count} học viên",
    "duration":          "Thời lượng",
    "level":             "Trình độ",
    "language":          "Ngôn ngữ",
    "last_updated":      "Cập nhật lần cuối",
    "what_you_learn":    "Bạn sẽ học được gì?",
    "requirements":      "Yêu cầu đầu vào",
    "target_audience":   "Đối tượng phù hợp",
    "description":       "Mô tả khoá học",
    "curriculum":        "Nội dung khoá học",
    "reviews":           "Đánh giá",
    "teacher":           "Giáo viên",
    "certificate":       "Chứng chỉ",
    "no_courses":        "Bạn chưa đăng ký khoá học nào."
  },

  // ── Books ────────────────────────────────────
  "book": {
    "buy":               "Mua sách",
    "read":              "Đọc sách",
    "author":            "Tác giả",
    "publisher":         "Nhà xuất bản",
    "pages":             "{count} trang",
    "category":          "Danh mục",
    "add_to_cart":       "Thêm vào giỏ",
    "in_stock":          "Còn hàng",
    "out_of_stock":      "Hết hàng"
  },

  // ── Cart & Payment ───────────────────────────
  "cart": {
    "title":             "Giỏ hàng",
    "empty":             "Giỏ hàng trống",
    "total":             "Tổng cộng",
    "checkout":          "Thanh toán",
    "remove":            "Xoá",
    "items":             "{count} sản phẩm"
  },
  "payment": {
    "title":             "Thanh toán",
    "method":            "Phương thức thanh toán",
    "success":           "Thanh toán thành công!",
    "failed":            "Thanh toán thất bại.",
    "pending":           "Đang xử lý...",
    "order_id":          "Mã đơn hàng",
    "shipping_address":  "Địa chỉ giao hàng"
  },

  // ── Quiz & Exam ──────────────────────────────
  "quiz": {
    "start":             "Bắt đầu",
    "submit":            "Nộp bài",
    "next_question":     "Câu tiếp theo",
    "time_remaining":    "Thời gian còn lại",
    "question":          "Câu {current}/{total}",
    "score":             "Điểm số",
    "passed":            "Đạt",
    "failed":            "Chưa đạt",
    "correct":           "Đúng",
    "incorrect":         "Sai",
    "explanation":       "Giải thích",
    "your_answer":       "Đáp án của bạn",
    "correct_answer":    "Đáp án đúng",
    "result":            "Kết quả",
    "retry":             "Làm lại",
    "review":            "Xem lại bài làm"
  },

  // ── OPIC ─────────────────────────────────────
  "opic": {
    "title":             "Kiểm tra OPIC",
    "select_difficulty": "Chọn mức độ",
    "difficulty": {
      "easy":    "Dễ",
      "medium":  "Trung bình",
      "hard":    "Khó"
    },
    "speaking":          "Nói",
    "recording":         "Đang ghi âm...",
    "stop_record":       "Dừng ghi âm",
    "submit_answer":     "Nộp câu trả lời",
    "time_to_speak":     "Thời gian nói",
    "instructions":      "Hướng dẫn",
    "prepare_time":      "Thời gian chuẩn bị",
    "score_band":        "Band điểm"
  },

  // ── VSTEP ────────────────────────────────────
  "vstep": {
    "title":             "Kiểm tra VSTEP",
    "listening":         "Nghe",
    "reading":           "Đọc",
    "writing":           "Viết",
    "speaking":          "Nói",
    "level_a1":          "A1 — Sơ cấp",
    "level_a2":          "A2 — Cơ bản",
    "level_b1":          "B1 — Trung cấp",
    "level_b2":          "B2 — Trên trung cấp",
    "level_c1":          "C1 — Nâng cao",
    "level_c2":          "C2 — Thành thạo"
  },

  // ── Notifications ────────────────────────────
  "notification": {
    "title":             "Thông báo",
    "mark_all_read":     "Đánh dấu đã đọc tất cả",
    "empty":             "Không có thông báo mới",
    "new_message":       "Tin nhắn mới",
    "course_update":     "Khoá học cập nhật",
    "payment_success":   "Thanh toán thành công"
  },

  // ── Chat ─────────────────────────────────────
  "chat": {
    "support":           "Hỗ trợ",
    "placeholder":       "Nhập tin nhắn...",
    "send":              "Gửi",
    "today":             "Hôm nay",
    "yesterday":         "Hôm qua",
    "online":            "Đang online",
    "offline":           "Offline"
  },

  // ── Language selector ────────────────────────
  "lang": {
    "label":   "Ngôn ngữ",
    "vi":      "Tiếng Việt",
    "en":      "English",
    "ko":      "한국어"
  },

  // ── Page titles (SEO) ────────────────────────
  "meta": {
    "home":        "MLS — Nền tảng học tiếng Việt",
    "courses":     "Khoá học — MLS",
    "books":       "Sách — MLS",
    "profile":     "Trang cá nhân — MLS",
    "cart":        "Giỏ hàng — MLS",
    "login":       "Đăng nhập — MLS",
    "register":    "Đăng ký — MLS"
  },

  // ── Admin ────────────────────────────────────
  "admin": {
    "dashboard":    "Tổng quan",
    "users":        "Người dùng",
    "courses":      "Khoá học",
    "orders":       "Đơn hàng",
    "books":        "Sách",
    "shipments":    "Vận đơn",
    "settings":     "Cài đặt",
    "chat_support": "Chat hỗ trợ",
    "analytics":    "Thống kê"
  }
}
```

### 3.3 en.json (mẫu)

```json
{
  "nav": {
    "home": "Home", "courses": "Courses", "books": "Books",
    "exam": "Online Exam", "groups": "Groups",
    "search_placeholder": "Search courses..."
  },
  "auth": {
    "login": "Sign In", "register": "Sign Up", "logout": "Sign Out",
    "email": "Email", "password": "Password",
    "confirm_password": "Confirm Password", "full_name": "Full Name",
    "forgot_password": "Forgot password?", "reset_password": "Reset Password",
    "no_account": "Don't have an account?", "have_account": "Already have an account?",
    "login_title": "Welcome Back", "register_title": "Create Account",
    "send_reset_email": "Send Reset Email"
  },
  "lang": { "label": "Language", "vi": "Tiếng Việt", "en": "English", "ko": "한국어" }
}
```

### 3.4 ko.json (mẫu)

```json
{
  "nav": {
    "home": "홈", "courses": "강좌", "books": "도서",
    "exam": "온라인 시험", "groups": "그룹",
    "search_placeholder": "강좌 검색..."
  },
  "auth": {
    "login": "로그인", "register": "회원가입", "logout": "로그아웃",
    "email": "이메일", "password": "비밀번호",
    "confirm_password": "비밀번호 확인", "full_name": "이름",
    "forgot_password": "비밀번호를 잊으셨나요?", "reset_password": "비밀번호 재설정",
    "no_account": "계정이 없으신가요?", "have_account": "이미 계정이 있으신가요?",
    "login_title": "다시 오신 것을 환영합니다", "register_title": "새 계정 만들기",
    "send_reset_email": "재설정 이메일 보내기"
  },
  "lang": { "label": "언어", "vi": "Tiếng Việt", "en": "English", "ko": "한국어" }
}
```

---

## 4. Thiết kế kỹ thuật Frontend

### 4.1 Cài đặt next-intl

```bash
npm install next-intl
```

**`next.config.ts`** — thêm plugin:

```typescript
import createNextIntlPlugin from "next-intl/plugin";
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl({
  output: "standalone",
  // ... existing config
});
```

**`src/i18n/request.ts`** — locale resolver (SSR):

```typescript
import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";

const SUPPORTED = ["vi", "en", "ko"] as const;
type Locale = (typeof SUPPORTED)[number];

function resolveLocale(): Locale {
  // 1. Cookie
  const cookieLocale = cookies().get("NEXT_LOCALE")?.value;
  if (cookieLocale && SUPPORTED.includes(cookieLocale as Locale))
    return cookieLocale as Locale;
  // 2. Accept-Language header
  const acceptLang = headers().get("accept-language") ?? "";
  for (const supported of SUPPORTED) {
    if (acceptLang.toLowerCase().includes(supported)) return supported;
  }
  // 3. Default
  return "vi";
}

export default getRequestConfig(async () => {
  const locale = resolveLocale();
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
```

**`src/app/layout.tsx`** — tích hợp Provider:

```typescript
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <Providers>
            {children}
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

### 4.2 Language Switcher Component

**`src/components/layout/LanguageSwitcher.tsx`**:

```typescript
"use client";

import { useTransition } from "react";
import { setLocale } from "@/i18n/actions";   // Server Action
import { useLocale, useTranslations } from "next-intl";

const LOCALES = [
  { code: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
  { code: "en", label: "English",    flag: "🇬🇧" },
  { code: "ko", label: "한국어",      flag: "🇰🇷" },
] as const;

export default function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations("lang");
  const [isPending, startTransition] = useTransition();

  function handleChange(code: string) {
    startTransition(() => setLocale(code));
  }

  const current = LOCALES.find((l) => l.code === locale);

  return (
    <div className="relative group">
      <button
        disabled={isPending}
        className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm hover:bg-gray-50"
      >
        <span>{current?.flag}</span>
        <span className="hidden sm:inline">{current?.label}</span>
        <svg className="h-3 w-3 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
        </svg>
      </button>

      <div className="absolute right-0 top-full mt-1 hidden w-36 rounded-xl border border-gray-200 bg-white shadow-lg group-focus-within:block group-hover:block z-50">
        {LOCALES.map((l) => (
          <button
            key={l.code}
            onClick={() => handleChange(l.code)}
            className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm transition hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl ${
              locale === l.code ? "font-semibold text-blue-600" : "text-gray-700"
            }`}
          >
            <span>{l.flag}</span>
            <span>{l.label}</span>
            {locale === l.code && (
              <svg className="ml-auto h-3.5 w-3.5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
```

**`src/i18n/actions.ts`** — Server Action:

```typescript
"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const SUPPORTED = ["vi", "en", "ko"];

export async function setLocale(locale: string) {
  if (!SUPPORTED.includes(locale)) return;

  cookies().set("NEXT_LOCALE", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,  // 1 năm
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  revalidatePath("/", "layout");
}
```

### 4.3 Font tiếng Hàn — `layout.tsx`

```typescript
import { Noto_Sans_KR } from "next/font/google";

const notoSansKR = Noto_Sans_KR({
  variable: "--font-noto-kr",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

// Thêm vào className của <body>:
// className={`${beVietnamPro.variable} ${notoSansKR.variable} font-sans`}
```

**CSS strategy**: dùng CSS `lang` selector:

```css
/* globals.css */
:root { font-family: var(--font-be-vietnam), sans-serif; }
:lang(ko) { font-family: var(--font-noto-kr), var(--font-be-vietnam), sans-serif; }
```

### 4.4 Sử dụng trong component

```typescript
// Server Component
import { useTranslations } from "next-intl";

export default function LoginPage() {
  const t = useTranslations("auth");
  return (
    <div>
      <h1>{t("login_title")}</h1>
      <label>{t("email")}</label>
      <button>{t("login")}</button>
    </div>
  );
}

// Client Component — dùng hook
"use client";
import { useTranslations } from "next-intl";

export function SubmitButton({ disabled }: { disabled: boolean }) {
  const t = useTranslations("common");
  return <button disabled={disabled}>{disabled ? t("saving") : t("save")}</button>;
}

// ICU interpolation
t("quiz.question", { current: 3, total: 20 })  // → "Câu 3/20"
t("errors.password_min", { min: 8 })            // → "Mật khẩu tối thiểu 8 ký tự"
```

### 4.5 Metadata động

```typescript
// app/login/page.tsx
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("meta");
  return { title: t("login") };
}
```

### 4.6 Sync locale với User DB (đăng nhập)

```typescript
// Trong authSlice / sau login thành công
// Gọi API PUT /api/v1/users/me/locale với body { locale: currentCookieLocale }
// → Backend update UserProfile.PreferredLocale
// Khi logout → giữ cookie (user experience)
// Khi login lại → đọc UserProfile.PreferredLocale từ API → overwrite cookie
```

---

## 5. Thiết kế kỹ thuật Backend

### 5.1 Localization Middleware — `Program.cs`

```csharp
// Program.cs
var supportedCultures = new[] { "vi", "en", "ko" };
var localizationOptions = new RequestLocalizationOptions()
    .SetDefaultCulture("vi")
    .AddSupportedCultures(supportedCultures)
    .AddSupportedUICultures(supportedCultures);

// Đọc từ Accept-Language header hoặc query ?lang=en
localizationOptions.RequestCultureProviders.Insert(0,
    new QueryStringRequestCultureProvider { QueryStringKey = "lang" });

app.UseRequestLocalization(localizationOptions);

// DI
builder.Services.AddLocalization(opt => opt.ResourcesPath = "Resources");
```

### 5.2 Resource files

```
backend/MLS.API/Resources/
├── SharedResource.vi.resx     ← tiếng Việt (mặc định, đầy đủ)
├── SharedResource.en.resx     ← tiếng Anh
├── SharedResource.ko.resx     ← tiếng Hàn
└── SharedResource.cs          ← empty marker class
```

**SharedResource.cs**:
```csharp
namespace MLS.API.Resources;
public class SharedResource { }
```

**SharedResource.vi.resx** (XML):
```xml
<data name="CartEmpty"><value>Giỏ hàng trống.</value></data>
<data name="OrderNotFound"><value>Không tìm thấy đơn hàng.</value></data>
<data name="FileEmpty"><value>Tệp không được để trống.</value></data>
<data name="Unauthorized"><value>Bạn chưa đăng nhập.</value></data>
<data name="CourseNotFound"><value>Không tìm thấy khoá học.</value></data>
```

**SharedResource.en.resx**:
```xml
<data name="CartEmpty"><value>Cart is empty.</value></data>
<data name="OrderNotFound"><value>Order not found.</value></data>
<data name="FileEmpty"><value>File cannot be empty.</value></data>
<data name="Unauthorized"><value>You are not authenticated.</value></data>
<data name="CourseNotFound"><value>Course not found.</value></data>
```

**SharedResource.ko.resx**:
```xml
<data name="CartEmpty"><value>장바구니가 비어 있습니다.</value></data>
<data name="OrderNotFound"><value>주문을 찾을 수 없습니다.</value></data>
<data name="FileEmpty"><value>파일이 비어 있습니다.</value></data>
<data name="Unauthorized"><value>로그인이 필요합니다.</value></data>
<data name="CourseNotFound"><value>강좌를 찾을 수 없습니다.</value></data>
```

### 5.3 Inject và sử dụng trong Controller

```csharp
[ApiController]
public class CheckoutController : ControllerBase
{
    private readonly IStringLocalizer<SharedResource> _loc;

    public CheckoutController(IStringLocalizer<SharedResource> loc)
        => _loc = loc;

    [HttpPost("checkout")]
    public async Task<IActionResult> Checkout(...)
    {
        if (cart.IsEmpty)
            return BadRequest(_loc["CartEmpty"].Value);   // đúng locale
        // ...
    }
}
```

### 5.4 UserProfile — thêm PreferredLocale

```csharp
// MLS.Domain/Entities/UserProfile.cs
public string? PreferredLocale { get; private set; }   // "vi" | "en" | "ko"

public void SetPreferredLocale(string locale)
{
    if (new[] { "vi", "en", "ko" }.Contains(locale))
    {
        PreferredLocale = locale;
        SetUpdatedAt();
    }
}
```

```csharp
// Migration
migrationBuilder.AddColumn<string>(
    name: "PreferredLocale",
    table: "UserProfiles",
    schema: "tenant_demo",
    type: "character varying(5)",
    maxLength: 5,
    nullable: true);
```

### 5.5 API Endpoint locale

```csharp
// PUT /api/v1/users/me/locale
[HttpPut("me/locale")]
[Authorize]
public async Task<IActionResult> SetLocale([FromBody] SetLocaleRequest req)
{
    // req.Locale = "vi" | "en" | "ko"
    await _mediator.Send(new SetUserLocaleCommand(CurrentUserId, req.Locale));
    return NoContent();
}
```

---

## 6. Thiết kế Database — Translation Tables

### 6.1 Migration SQL

```sql
-- ── CourseTranslations ──────────────────────────────────────
CREATE TABLE "CourseTranslations" (
    "CourseId"          UUID NOT NULL,
    "Locale"            VARCHAR(5) NOT NULL,
    "Title"             VARCHAR(300),
    "ShortDescription"  TEXT,
    "Description"       TEXT,
    "Outcomes"          TEXT,     -- JSON array translated
    "Requirements"      TEXT,     -- JSON array translated
    "TargetAudience"    TEXT,     -- JSON array translated
    "CreatedAt"         TIMESTAMP NOT NULL DEFAULT NOW(),
    "UpdatedAt"         TIMESTAMP,
    PRIMARY KEY ("CourseId", "Locale"),
    FOREIGN KEY ("CourseId") REFERENCES "Courses"("Id") ON DELETE CASCADE
);

-- ── BookTranslations ────────────────────────────────────────
CREATE TABLE "BookTranslations" (
    "BookId"            UUID NOT NULL,
    "Locale"            VARCHAR(5) NOT NULL,
    "Title"             VARCHAR(300),
    "ShortDescription"  TEXT,
    "Description"       TEXT,
    PRIMARY KEY ("BookId", "Locale"),
    FOREIGN KEY ("BookId") REFERENCES "Books"("Id") ON DELETE CASCADE
);

-- ── CategoryTranslations (Quiz types, Book categories) ──────
CREATE TABLE "CategoryTranslations" (
    "CategoryType"   VARCHAR(50) NOT NULL,   -- 'BookCategory' | 'CourseLevel'
    "CategoryId"     UUID NOT NULL,
    "Locale"         VARCHAR(5) NOT NULL,
    "Name"           VARCHAR(200) NOT NULL,
    "Description"    TEXT,
    PRIMARY KEY ("CategoryType", "CategoryId", "Locale")
);

-- ── NotificationTemplates ────────────────────────────────────
CREATE TABLE "NotificationTemplates" (
    "Key"          VARCHAR(100) NOT NULL,   -- 'course_enrolled' | 'payment_success' | ...
    "Locale"       VARCHAR(5) NOT NULL,
    "Title"        VARCHAR(300) NOT NULL,
    "Body"         TEXT NOT NULL,           -- Handlebars template: {{userName}}, {{courseName}}
    PRIMARY KEY ("Key", "Locale")
);

-- Index
CREATE INDEX "IX_CourseTranslations_Locale" ON "CourseTranslations" ("Locale");
CREATE INDEX "IX_BookTranslations_Locale"   ON "BookTranslations" ("Locale");
```

### 6.2 Seeding notification templates

```sql
INSERT INTO "NotificationTemplates" ("Key", "Locale", "Title", "Body") VALUES
-- vi
('course_enrolled',  'vi', 'Đăng ký thành công', 'Bạn đã đăng ký khoá học {{courseName}} thành công.'),
('payment_success',  'vi', 'Thanh toán thành công', 'Đơn hàng #{{orderId}} đã được xác nhận.'),
('new_message',      'vi', 'Tin nhắn mới', '{{senderName}} đã gửi tin nhắn cho bạn.'),
-- en
('course_enrolled',  'en', 'Enrollment Successful', 'You have successfully enrolled in {{courseName}}.'),
('payment_success',  'en', 'Payment Successful', 'Order #{{orderId}} has been confirmed.'),
('new_message',      'en', 'New Message', '{{senderName}} sent you a message.'),
-- ko
('course_enrolled',  'ko', '수강 등록 완료', '{{courseName}} 강좌에 성공적으로 등록되었습니다.'),
('payment_success',  'ko', '결제 완료', '주문 #{{orderId}}가 확인되었습니다.'),
('new_message',      'ko', '새 메시지', '{{senderName}}님이 메시지를 보냈습니다.');
```

### 6.3 Query pattern với fallback

```sql
-- Lấy Course với translation (fallback vi)
SELECT
    c."Id", c."Slug", c."Price", c."ThumbnailUrl",
    COALESCE(ct_target."Title",    ct_vi."Title",    c."Title")            AS "Title",
    COALESCE(ct_target."ShortDescription", ct_vi."ShortDescription", c."ShortDescription") AS "ShortDescription",
    COALESCE(ct_target."Description", ct_vi."Description", c."Description") AS "Description"
FROM "Courses" c
LEFT JOIN "CourseTranslations" ct_target
    ON ct_target."CourseId" = c."Id" AND ct_target."Locale" = @locale
LEFT JOIN "CourseTranslations" ct_vi
    ON ct_vi."CourseId" = c."Id" AND ct_vi."Locale" = 'vi'
WHERE c."Id" = @courseId;
```

### 6.4 EF Core — TranslatedCourse DTO

```csharp
// Dùng projection, không map thêm entity
public record CourseTranslationDto(
    Guid CourseId,
    string Locale,
    string? Title,
    string? ShortDescription,
    string? Description
);

// Query handler
var locale = _cultureContext.CurrentLocale;  // "en" | "ko" | "vi"
var translation = await _db.CourseTranslations
    .Where(ct => ct.CourseId == id && ct.Locale == locale)
    .FirstOrDefaultAsync();
var fallback = translation ?? await _db.CourseTranslations
    .Where(ct => ct.CourseId == id && ct.Locale == "vi")
    .FirstOrDefaultAsync();

var title = fallback?.Title ?? course.Title;
```

---

## 7. Admin UI — Nhập bản dịch

### 7.1 Tab "Bản dịch" trong Admin Course Edit

```
/admin/courses/[id]
├── Tab: Tổng quan    ← form hiện tại
├── Tab: Nội dung
├── Tab: Bản dịch     ← MỚI
└── Tab: Cài đặt
```

**Giao diện tab Bản dịch**:
```
┌─────────────────────────────────────────────────────┐
│  Bản dịch khoá học                                   │
│                                                     │
│  [🇬🇧 English]  [🇰🇷 한국어]                           │
│                                                     │
│  Tiêu đề *                                          │
│  ┌─────────────────────────────────────────────┐   │
│  │ Basic Vietnamese Conversation               │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Mô tả ngắn                                         │
│  ┌─────────────────────────────────────────────┐   │
│  │ Learn Vietnamese from scratch...            │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  [Lưu bản dịch EN]                                 │
└─────────────────────────────────────────────────────┘
```

---

## 8. Task List chi tiết

### Phase I — Frontend UI Shell (5 ngày)

| ID | Task | Files | Ước tính |
|----|------|-------|---------|
| I-1 | Cài next-intl + tạo `src/i18n/request.ts` + cập nhật `next.config.ts` | `package.json`, `next.config.ts`, `src/i18n/request.ts` | 2h | ✅ |
| I-2 | Tạo `vi.json` đầy đủ (toàn bộ namespace) | `src/messages/vi.json` | 4h | ✅ |
| I-3 | Tạo `en.json` + `ko.json` (dịch toàn bộ) | `src/messages/en.json`, `ko.json` | 6h | ✅ |
| I-4 | Cập nhật `layout.tsx`: `NextIntlClientProvider` + `lang={locale}` + font Nanum Gothic KR | `app/layout.tsx` | 1h | ✅ |
| I-5 | `LanguageSwitcher` component + `setLocale` Server Action | `components/layout/LanguageSwitcher.tsx`, `i18n/actions.ts` | 2h | ✅ |
| I-6 | Tích hợp `LanguageSwitcher` vào `Header.tsx` | `components/layout/Header.tsx` | 1h | ✅ |
| I-7 | Dịch: `login`, `register`, `forgot-password`, `reset-password` pages | 4 pages | 3h | ✅ |
| I-8 | Dịch: `profile/page.tsx` + form labels + error messages | `app/profile/page.tsx` | 2h | ✅ |
| I-9 | Dịch: `courses/`, `khoa-hoc/[slug]` pages | course pages | 3h | ✅ |
| I-10 | Dịch: `gio-hang/`, `thanh-toan/`, `thanh-toan/ket-qua/` pages | cart/payment pages | 2h | ✅ |
| I-11 | Dịch: error messages trong Zod schemas (form validation) | `register/page.tsx`, `profile/page.tsx` | 2h | ✅ |
| I-12 | Dynamic metadata (`generateMetadata`) cho top pages | 7 layout files | 2h | ✅ |

### Phase II — Backend (3 ngày)

| ID | Task | Files | Ước tính |
|----|------|-------|---------|
| II-1 | `RequestLocalizationMiddleware` + supported cultures | `Program.cs` | 1h | ✅ |
| II-2 | Tạo `Resources/` folder + `SharedResource.cs` marker class | `MLS.API/Resources/` | 30m | ✅ |
| II-3 | `SharedResource.vi.resx` (50+ keys) | resx file | 2h | ✅ |
| II-4 | `SharedResource.en.resx` + `SharedResource.ko.resx` | resx files | 3h | ✅ |
| II-5 | Replace hardcode strings trong Controllers → `IStringLocalizer` | ~15 controllers | 4h | ✅ |
| II-6 | Thêm `UserProfile.PreferredLocale` + migration | `UserProfile.cs`, migration | 1h | ✅ |
| II-7 | `PUT /api/v1/users/me/locale` endpoint + handler | `UsersController` | 1h | ✅ |
| II-8 | Frontend: sync locale sau login (call API + cookie) | `authSlice.ts` | 1h | ✅ |

### Phase III — Content Translations (5 ngày)

| ID | Task | Files | Ước tính |
|----|------|-------|---------|
| III-1 | Migration: `CourseTranslations`, `BookTranslations`, `CategoryTranslations` | migration SQL | 2h |
| III-2 | Migration: `NotificationTemplates` + seeding 3 locales | migration SQL | 2h |
| III-3 | EF Core config + `ICourseTranslationRepository` | Persistence, Infrastructure | 2h |
| III-4 | `GetCourseQuery` trả translated fields theo locale | Application handlers | 3h |
| III-5 | `POST /api/v1/courses/{id}/translations` endpoint | CourseController | 2h |
| III-6 | Admin UI: tab "Bản dịch" trong `/admin/courses/[id]` | frontend admin | 4h |
| III-7 | Admin UI: tab "Bản dịch" trong `/admin/sach/[id]` | frontend admin | 2h |
| III-8 | Notification service dùng template theo locale | `InAppNotificationService.cs` | 3h |
| III-9 | OPIC/VSTEP: dịch instructions, error, UI labels | opic/vstep pages | 3h |
| III-10 | `GetBookQuery` trả translated fields | Application handlers | 2h |

### Phase IV — Polish (2 ngày)

| ID | Task | Ước tính |
|----|------|---------|
| IV-1 | Currency format: VND (vi), USD (en), KRW (ko) — Intl.NumberFormat | 2h |
| IV-2 | Date format theo locale: DD/MM/YYYY (vi), MM/DD/YYYY (en), YYYY.MM.DD (ko) | 1h |
| IV-3 | `hreflang` alternate meta tags | 1h |
| IV-4 | `og:locale` meta cho social sharing | 30m |
| IV-5 | Fallback chain test: `ko → en → vi` toàn bộ content | 3h |
| IV-6 | E2E: Playwright test switch language + verify UI | 3h |

---

## 9. Timeline

```
Tuần 1 (28/05 – 01/06)  ───  Phase I (I-1 → I-8)
  Mon 28/05:  I-1 (setup) + I-2 (vi.json)
  Tue 29/05:  I-3 (en.json + ko.json)
  Wed 30/05:  I-4 (layout) + I-5 (LanguageSwitcher) + I-6 (Header)
  Thu 31/05:  I-7 (auth pages) + I-8 (profile)
  Fri 01/06:  I-9 + I-10 + I-11 + I-12

Tuần 2 (02/06 – 06/06)  ───  Phase II (full) + Phase III (III-1 → III-5)
  Mon 02/06:  II-1 + II-2 + II-3
  Tue 03/06:  II-4 + II-5
  Wed 04/06:  II-6 + II-7 + II-8
  Thu 05/06:  III-1 + III-2 + III-3
  Fri 06/06:  III-4 + III-5

Tuần 3 (09/06 – 13/06)  ───  Phase III (III-6 → III-10)
  Mon 09/06:  III-6 (Admin Course translation UI)
  Tue 10/06:  III-7 + III-8
  Wed 11/06:  III-9 (OPIC/VSTEP)
  Thu 12/06:  III-10 + cleanup
  Fri 13/06:  Phase IV (IV-1 → IV-4)

Tuần 4 (16/06 – 18/06)  ───  Phase IV finish + QA
  IV-5 (fallback test) + IV-6 (E2E) + Deploy + QA
```

---

## 10. Rủi ro & Giải pháp

| Rủi ro | Khả năng | Giải pháp |
|--------|---------|-----------|
| next-intl không tương thích Next.js 16 | Thấp | Pin `next-intl@3.x`, kiểm tra peer deps trước |
| Missing translation key → crash | Cao | Config `onError: "missingMessage"` → fallback to key name |
| Korean font load chậm | Trung bình | `display: "swap"` + `preload: false` cho KR font |
| Content dịch sai ngữ nghĩa | Cao | Review bởi native speaker, dùng glossary chuẩn |
| DB migration collision (thêm cột) | Thấp | Migration independent, rollback script chuẩn bị sẵn |
| Turbopack + next-intl conflict | Trung bình | Test với `next dev --no-turbo` trước |

---

## 11. Cấu trúc file tổng thể sau khi hoàn thành

```
frontend/src/
├── messages/
│   ├── vi.json
│   ├── en.json
│   └── ko.json
├── i18n/
│   ├── request.ts          ← locale resolver (SSR)
│   └── actions.ts          ← setLocale Server Action
├── components/layout/
│   ├── Header.tsx          ← tích hợp LanguageSwitcher
│   └── LanguageSwitcher.tsx
└── app/
    └── layout.tsx          ← NextIntlClientProvider + lang={locale}

backend/MLS.API/
└── Resources/
    ├── SharedResource.cs
    ├── SharedResource.vi.resx
    ├── SharedResource.en.resx
    └── SharedResource.ko.resx

deploy/
└── i18n-migration.sql      ← CourseTranslations, BookTranslations, NotificationTemplates
```



---

## 12. TIẾN ĐỘ THỰC TẾ — AUDIT 30/05/2026

> **Tổng kết:** ~**78% hoàn thành**. Hạ tầng i18n ổn định. So với audit 29/05: đã hoàn thành thêm **AppShell + my-lesson + my-courses + 3 chat/notification component global + learn/[id] player (50+ strings) + vstep/[sessionId]/* (6 page) + opic/[sessionId]/{play,result} + opic/history (3 page) + realtime/{join,[code]/play} (2 page)**. Phần lớn page khoa-hoc và backend còn lại vẫn cần làm.

### 12.1 Bảng tổng hợp theo Phase

| Phase | Hạng mục | Trạng thái | % |
|-------|----------|-----------|---|
| **I** | Setup (next-intl, request.ts, actions.ts, layout, switcher, font KR) | ✅ Done | 95% |
| **I** | Message files vi/en/ko sync (~70 namespace) | ✅ Done | 100% |
| **II (FE)** | Auth pages (login/register/forgot/reset) | ✅ Done | 100% |
| **II (FE)** | Profile, courses list, courses/[id] (public), gio-hang, thanh-toan, don-hang/[id] | ✅ Done | 95% |
| **II (FE)** | Admin pages (users, teachers, courses, sach, levels, vouchers, van-don, settings, don-hang, content/approvals, sessions/[id], courses/[id] full + tab Translations) | ✅ ~85% | 85% |
| **II (FE)** | Teacher pages (vstep/*, quizzes/*, realtime/*, sessions/[id], questions, courses/[id], opic/*) | 🔄 ~70% | 70% |
| **II (FE)** | Public exam / learn pages — learn/[id] ✅; vstep/[sessionId]/* ✅; opic/[sessionId]/* + opic/history ✅; realtime/{join,[code]/play} ✅ DONE 30/05; khoa-hoc/* vẫn chưa | 🔄 | 78% |
| **II (FE)** | High-traffic pages (AppShell ✅, my-lesson ✅, my-courses ✅, sach list ❌) | ✅ ~85% | 85% |
| **II (FE)** | Components shared (ChatRoom ✅, SupportChatWidget ✅, NotificationBell ✅) | ✅ Done 30/05 | 100% |
| **II (BE)** | Program.cs UseRequestLocalization, AddLocalization, SharedResource.*.resx | ✅ Done | 100% |
| **II (BE)** | IStringLocalizer dùng trong controllers | 🔄 ~5/15 controllers | 35% |
| **II (BE)** | UserProfile.PreferredLocale + PUT /me/locale + sync frontend authSlice | ✅ Done | 100% |
| **III** | Entities CourseTranslation, BookTranslation + EF config | ✅ Done | 100% |
| **III** | Migration `deploy/phase3-i18n-migration.sql` (CourseTranslations, BookTranslations, NotificationTemplates) | ✅ File có | 100% — *chưa xác nhận đã chạy DB* |
| **III** | API + RTK `useUpsertCourseTranslationMutation` | ✅ Done | 100% |
| **III** | Admin UI tab "Translations" trong `/admin/courses/[id]` | ✅ Done | 100% |
| **III** | Admin UI tab "Bản dịch" trong `/admin/sach/[id]` | ❌ Page detail chưa tồn tại | 0% |
| **III** | `useUpsertBookTranslationMutation` | ❌ Chưa có | 0% |
| **III** | `GetCourseQuery` / `GetBookQuery` trả translated fields theo locale | ❌ Cần verify | 0% |
| **III** | `InAppNotificationService` dùng `NotificationTemplates` theo locale | ❌ Còn hardcode | 0% |
| **III** | OPIC / VSTEP instructions dịch trong message files | ❌ Chưa | 0% |
| **IV** | `formatCurrency` / `formatNumber` / `formatDate` / `formatDateTime` locale-aware (`src/lib/i18nFormat.ts`) | ✅ Done | 100% |
| **IV** | Áp dụng helper format ở mọi nơi (course cards, book listings…) | 🔄 Một phần | 60% |
| **IV** | hreflang + og:locale meta tags trong layout | ✅ Done | 100% |
| **IV** | Fallback chain test `ko → en → vi` | ❌ Chưa test | 0% |
| **IV** | E2E Playwright switch language | ❌ Chưa | 0% |

### 12.2 Các vấn đề "lẫn lộn" còn tồn tại (ưu tiên cao → thấp)

| # | File | Mức ảnh hưởng | Hardcode VI tiêu biểu | Trạng thái |
|---|------|---------------|------------------------|-----------|
| 1 | [frontend/src/app/_components/AppShell.tsx](frontend/src/app/_components/AppShell.tsx) | 🔴 Rất cao | "Bài học mới", "Đã lưu" | ✅ DONE 30/05 (ns `app_shell`) |
| 2 | [frontend/src/app/my-lesson/page.tsx](frontend/src/app/my-lesson/page.tsx) | 🔴 Cao | "Bài học mới", "Đã lưu", "Bài đã lưu" | ✅ DONE 30/05 (ns `my_lesson`+`level_labels`) |
| 3 | [frontend/src/app/my-courses/page.tsx](frontend/src/app/my-courses/page.tsx) | 🔴 Cao | Tương tự my-lesson | ✅ DONE 30/05 (ns `my_courses`+`level_labels`) |
| 4 | [frontend/src/app/sach/page.tsx](frontend/src/app/sach/page.tsx) | 🟡 Trung | "Mới nhất", "Bán chạy"… | ❌ Chưa |
| 5 | [frontend/src/app/learn/[id]/page.tsx](frontend/src/app/learn) | 🔴 Cao | Toàn bộ player + VideoQuizPopup | ✅ DONE 30/05 (ns `learn_player`, ~53 keys, alias `tr`) |
| 6 | vstep/[sessionId]/{hub,writing,speaking,listening,reading,result} | 🟡 Trung | "Đang tải…", "Xem tổng kết →"… | ✅ DONE 30/05 (ns `vstep_player`, ~110 keys) |
| 7 | [frontend/src/app/opic/[sessionId]/*](frontend/src/app/opic) + opic/history | 🟡 Trung | Player + result + history | ✅ DONE 30/05 (ns `opic_player`, ~60 keys) |
| 8 | realtime/[code]/play + realtime/join | 🟡 Trung | Player + join page | ✅ DONE 30/05 (ns `realtime_player`, ~21 keys) |
| 9 | [frontend/src/app/khoa-hoc/*](frontend/src/app/khoa-hoc) | 🟡 Trung | Hoàn toàn chưa dịch | ❌ Chưa |
| 10 | kich-hoat/page.tsx, thu-vien-sach/page.tsx | 🟢 Thấp | Chưa dịch | ❌ Chưa |
| 11 | [frontend/src/app/admin/courses/page.tsx](frontend/src/app/admin/courses/page.tsx) | 🟡 Trung | `LEVELS = ["Cấp 1"…]` | ❌ Chưa |
| 12 | ChatRoom + SupportChatWidget + NotificationBell | 🔴 Cao global | Toàn bộ label | ✅ DONE 30/05 (ns `chat` mở rộng ~22 keys + `useLocale()` cho time) |
| 13 | Teacher pages còn lại (modules/[id], placement, config, chat/groups, lessons/[id], opic/scripts/new, courses/new…) | 🟡 Trung | ~18 page chưa kiểm | ❌ Chưa |
| 14 | admin/users/page.tsx — build error stray `}}` sau JSX comment | 🔴 Build break | "Cập nhật Profile" comment | ✅ FIXED 30/05 |

### 12.3 Backend chưa hoàn thành

| Hạng mục | Trạng thái |
|----------|-----------|
| Replace hardcode VI trong controllers (còn ~10 controller chưa dùng `IStringLocalizer`) | ❌ ~65% còn lại |
| `InAppNotificationService` đọc `NotificationTemplates` theo locale + render Handlebars | ❌ Chưa |
| `GetCourseQuery` / `GetBookQuery` join `CourseTranslations` với fallback `ko→en→vi` | ✅ DONE 31/05 |
| Seed `NotificationTemplates` 3 locales (vi/en/ko) | ❌ Chưa chạy |
| Confirm migration `phase3-i18n-migration.sql` đã apply trên PostgreSQL | ✅ DONE 31/05 (local) |

### 12.4 Task list tiếp theo (đề xuất theo thứ tự — cập nhật)

1. ~~AppShell + my-lesson + my-courses~~ ✅ DONE 30/05.
2. ~~ChatRoom + SupportChatWidget + NotificationBell~~ ✅ DONE 30/05.
3. ~~learn/[id] Interactive Session Player~~ ✅ DONE 30/05.
4. ~~vstep/[sessionId]/{hub,listening,reading,writing,speaking,result}~~ ✅ DONE 30/05 (6 page, ns `vstep_player`).
5. ~~opic/[sessionId]/{play,result} + opic/history~~ ✅ DONE 30/05 (3 page, ns `opic_player`).
6. ~~realtime/join + realtime/[code]/play~~ ✅ DONE 30/05 (2 page, ns `realtime_player`).
7. ~~khoa-hoc/[slug]~~ ✅ DONE 31/05 (cả 2 file đều là redirect stub).
8. ~~sach/page.tsx~~ ✅ DONE 31/05 (ns `sach_list`).
9. ~~admin/courses/page.tsx~~ ✅ DONE 31/05 (dùng `level_labels`).
10. ~~Teacher pages còn lại~~ ✅ DONE 31/05 — 10 page Class B đã chuyển: `teacher/courses/{page,[id]}`, `teacher/questions`, `teacher/placement`, `teacher/vstep`, `teacher/quizzes/{page,new,[id]}`, `teacher/opic/scripts/{page,new}` (thêm ns `skill_labels`, `language_labels`, `opic_combo_labels`, `opic_topic_labels`, `quiz_status_labels`, `quiz_type_labels`, `question_type_labels`, `vstep_band_labels`).
11. ~~Admin sách detail page~~ ✅ DONE 31/05 — `/admin/sach/[id]/page.tsx` mới với tab Overview + Translations; backend `BookTranslationCommands` + endpoint `GET/PUT /api/v1/admin/books/{id}/translations[/{locale}]`; RTK `useGetBookTranslationsQuery` + `useUpsertBookTranslationMutation`; ns `admin_book_detail`.
12. ~~Backend `IStringLocalizer`~~ ✅ DONE 31/05 — 14 controller được wire `IStringLocalizer<SharedResource>`: `AdminBooks`, `AdminCms`, `AdminCmsSessions`, `AdminUsers`, `AdminSystem`, `Users`, `Writing`, `Speaking`, `UserDeviceTokens`, `Quizzes`, `Placement`, `Courses`, `Attempts`, `LearningAssets`. SharedResource bổ sung 18 key (file upload, audio, writing/speaking, quiz/attempt). PaymentController VNPay RspCode giữ nguyên (giao thức bắt buộc).
13. ~~Backend query layer~~ ✅ DONE 31/05 — `GetCourseDetailQueryHandler` + `GetBookBySlugQueryHandler` đã dùng fallback chain `ko→en→vi`.
14. **NotificationTemplates** — seed 3 locale, refactor `InAppNotificationService` render từ template.
15. ~~Apply migration `phase3-i18n-migration.sql`~~ ✅ DONE 31/05 (local PostgreSQL); VPS pending.
16. **Phase IV polish** — verify helper format mọi nơi; fallback chain test; E2E Playwright switch language.

### 12.5 Trạng thái Task List (cập nhật so với mục 8)

| Task ID | Trạng thái cập nhật |
|---------|---------------------|
| I-1 → I-8 | ✅ Done |
| I-9 | ✅ courses/ done; ❌ khoa-hoc/[slug] chưa |
| I-10 | ✅ Done |
| I-11 | ✅ Done |
| I-12 | 🔄 Layout có hreflang/og:locale; metadata động per-page chưa rộng |
| II-1 → II-4 | ✅ Done |
| II-5 | 🔄 ~5/15 controller dùng IStringLocalizer |
| II-6 → II-8 | ✅ Done |
| III-1 → III-2 | ✅ Có file migration `phase3-i18n-migration.sql`, **chưa verify đã apply DB** |
| III-3 | ✅ Có CourseTranslation/BookTranslation entity + EF config |
| III-4 | ❌ `GetCourseQuery` chưa trả translated fields theo locale |
| III-5 | ✅ `useUpsertCourseTranslationMutation` đã có |
| III-6 | ✅ Tab "Translations" trong `/admin/courses/[id]` |
| III-7 | ❌ `/admin/sach/[id]` page chưa tồn tại |
| III-8 | ❌ `InAppNotificationService` chưa dùng template theo locale |
| III-9 | ❌ OPIC/VSTEP instructions chưa dịch |
| III-10 | ❌ `GetBookQuery` chưa trả translated fields |
| IV-1 → IV-4 | ✅ Done |
| IV-5 → IV-6 | ❌ Chưa |

### 12.6 Namespace mới thêm trong audit 30/05/2026

| Namespace | Số key | Dùng cho |
|-----------|--------|----------|
| `level_labels` | 8 | Nhãn cấp 1–6 + `all` + `fallback` (dùng chung my-lesson/my-courses/admin/teacher courses) |
| `my_lesson` | ~22 | my-lesson/page.tsx |
| `app_shell` | 14 | AppShell sidebar + mobile nav |
| `chat` (mở rộng) | +22 keys | ChatRoom, SupportChatWidget, NotificationBell (room_members, support_*, composer_*, notifications…) |
| `learn_player` | ~53 | learn/[id] Interactive Session Player + 7 asset panels + VideoQuizPopup + VideoQuizQuestionCard |
| `vstep_player` | ~110 | vstep/[sessionId]/{hub,listening,reading,writing,speaking,result} — 6 page |
| `opic_player` | ~60 | opic/[sessionId]/{play,result} + opic/history — 3 page |
| `realtime_player` | ~21 | realtime/{join,[code]/play} — 2 page |
| `sach_list` | 13 | sach/page.tsx sort/filter/search controls |
| `skill_labels` | 7 | teacher questions/placement (Reading/Listening/Speaking/…) |
| `language_labels` | 6 | teacher courses dropdown (vi/en/ko + flag + short) |
| `opic_combo_labels` | 12 | OPIC exam-mode tags (self_intro/describe/routine/…) |
| `opic_topic_labels` | 9 | OPIC topic filter (intro/housing/hobby/work/travel/…) |
| `quiz_status_labels` | 5 | teacher quizzes status filter |
| `quiz_type_labels` | 4 | teacher quizzes type filter |
| `question_type_labels` | 7 | teacher question form (single/multiple/true_false/…) |
| `vstep_band_labels` | 5 | vstep band B2+/B2/B1/A2 + `duration_minutes` |
| `admin_book_detail` | 28 | `/admin/sach/[id]` Overview + Translations tab |

---

*Cập nhật audit: 31/05/2026 — sau khi hoàn thành Task 7–13 + 15 trong §12.4. Frontend pháp ngữ phủ ~95%. Backend: fallback chain `ko→en→vi` đã có cho Course/Book detail; translation tables đã apply trên DB local; tab Translations cho sách đã sống. Còn lại: Task 12 (controller IStringLocalizer sweep), Task 14 (NotificationTemplate engine), Task 16 (E2E polish).*

