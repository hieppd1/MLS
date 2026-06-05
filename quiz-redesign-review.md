# Quiz Manager Redesign — Review Document
> Tạo ngày 2026-05-24 | Mục đích: review trước khi implement

---

## 1. Vấn đề hiện tại

### 1.1 — Tên field bị nhầm lẫn

| Tên hiện tại | Thực chất là | Vấn đề |
|---|---|---|
| `quizType` (QuizType enum) | **Mục đích / loại bài thi** (PracticeQuiz, MockTest, PlacementTest…) | Khi thêm Standard/OPIC/VSTEP thì trùng với tên "Quiz Type" |
| `ExamMode` enum (đã có trong DB) | **Nền tảng** (Standard, OPIC, VSTEP) | Tồn tại trên entity nhưng **chưa bao giờ được truyền vào** khi tạo quiz — luôn là `Standard` |

**Đề xuất đổi tên để rõ nghĩa:**
- `ExamMode` → gọi là **"Nền tảng"** hoặc **"Platform"** trong UI
- `QuizType` → gọi là **"Mục đích"** hoặc **"Purpose"** trong UI

---

### 1.2 — Bug: Frontend gửi sai giá trị QuizType lên backend

File: `frontend/src/app/teacher/quizzes/new/page.tsx` dòng 26:
```ts
// HIỆN TẠI — SAI
const QUIZ_TYPES = ["Placement", "Chapter", "Midterm", "Final", "Practice", "Mini"];
```

Backend enum `QuizType` thực tế:
```csharp
PlacementTest, SegmentQuiz, PracticeQuiz, MockTest,
AdaptiveQuiz, SpeakingTest, WritingTest, GrammarQuiz,
VocabularyQuiz, RealtimeQuiz,
OPICMockTest, OPICMiniTest,
VSTEPMockTest, VSTEPListening, VSTEPReading, VSTEPWriting, VSTEPSpeaking
```

"Chapter", "Midterm", "Final", "Mini" **không tồn tại** trong enum. Khi gửi lên backend handler:
```csharp
var quizType = Enum.TryParse<QuizType>(cmd.QuizType, out var qt) ? qt : QuizType.PracticeQuiz;
```
→ Parse fail → tất cả quiz tạo mới đều thành `PracticeQuiz`.

---

### 1.3 — Bug: `ExamMode` không được truyền vào khi tạo quiz

File: `backend/MLS.Domain/Entities/Quiz.cs` — `Quiz.Create()` **không có tham số `ExamMode`**:
```csharp
public static Quiz Create(string title, Guid createdBy, QuizType quizType = QuizType.PracticeQuiz, ...)
// ExamMode KHÔNG có → luôn default = ExamMode.Standard
```

`CreateQuizCommand` và `CreateQuizHandler` cũng không truyền `ExamMode`.  
→ Không có cách nào tạo được OPIC/VSTEP quiz từ giao diện.

---

### 1.4 — Logic OPIC tab trên edit page bị cứng (hard-code)

File: `frontend/src/app/teacher/quizzes/[id]/page.tsx` dòng ~20:
```ts
const IS_OPIC = (type: string) => type === "OPICMockTest" || type === "OPICMiniTest";
```
→ Khi quiz có `ExamMode = OPIC` nhưng `QuizType` khác thì không hiện tab OPIC.  
→ Khi quiz là Standard thì không có tab VSTEP dù type là `VSTEPMockTest`.

---

## 2. Toàn bộ QuizType — Phân loại & Giải thích

### Platform: STANDARD
| QuizType (backend enum) | Tên UI đề xuất | Mục đích |
|---|---|---|
| `PlacementTest` | Kiểm tra xếp lớp | Chạy 1 lần khi học viên mới, tự phân level 1–6 |
| `PracticeQuiz` | Luyện tập tự do | Học viên tự làm bất kỳ lúc nào |
| `SegmentQuiz` | Quiz trong video | Auto pop-up tại giây N khi xem video |
| `MockTest` | Thi thử | Mô phỏng bài thi thật, có điểm đậu/rớt |
| `RealtimeQuiz` | Quiz nhóm live | Giáo viên mở phòng, học viên join bằng mã |
| `AdaptiveQuiz` | Quiz thích ứng | Độ khó tự điều chỉnh theo câu trả lời trước |
| `GrammarQuiz` | Ngữ pháp | Quiz chuyên về Grammar |
| `VocabularyQuiz` | Từ vựng | Quiz chuyên về Vocabulary |
| `SpeakingTest` | Nói (chung) | Bài nói không theo chuẩn OPIC |
| `WritingTest` | Viết (chung) | Bài viết không theo chuẩn VSTEP |

### Platform: OPIC
| QuizType | Tên UI | Mục đích |
|---|---|---|
| `OPICMockTest` | OPIC Mock Test | Thi thử đầy đủ OPIC: 15 câu (describe, routine, experience, roleplay, question-asking, intro) |
| `OPICMiniTest` | OPIC Mini Test | Luyện tập 5–10 câu, tập trung 1–2 dạng câu |

### Platform: VSTEP
| QuizType | Tên UI | Mục đích |
|---|---|---|
| `VSTEPMockTest` | VSTEP Full Mock | Thi đầy đủ 4 kỹ năng chuẩn VSTEP B1/B2 |
| `VSTEPListening` | VSTEP Listening | Thi kỹ năng Nghe |
| `VSTEPReading` | VSTEP Reading | Thi kỹ năng Đọc |
| `VSTEPWriting` | VSTEP Writing | Thi kỹ năng Viết |
| `VSTEPSpeaking` | VSTEP Speaking | Thi kỹ năng Nói |

---

## 3. Mapping ExamMode ↔ QuizType

Khi user chọn Platform, danh sách "Mục đích" sẽ lọc theo:

```
ExamMode.Standard → [PlacementTest, PracticeQuiz, SegmentQuiz, MockTest,
                      RealtimeQuiz, AdaptiveQuiz, GrammarQuiz, VocabularyQuiz,
                      SpeakingTest, WritingTest]

ExamMode.OPIC     → [OPICMockTest, OPICMiniTest]

ExamMode.VSTEP    → [VSTEPMockTest, VSTEPListening, VSTEPReading,
                      VSTEPWriting, VSTEPSpeaking]
```

---

## 4. Phương án thiết kế lại

### 4.1 — Flow tạo quiz mới (New Quiz — 3 bước)

**Bước 1: Chọn Platform** (thêm vào đầu, trước bước hiện tại)
```
[ Standard ]   [ OPIC ]   [ VSTEP ]
  Card chọn     Card chọn   Card chọn
  (default)
```

**Bước 2: Thông tin cơ bản** (giống hiện tại nhưng sửa field names + options)
- "Nền tảng": hiển thị read-only (đã chọn ở bước 1)
- "Mục đích" (đổi từ "Loại quiz"): dropdown lọc theo Platform đã chọn
- Các field còn lại giữ nguyên

**Bước 3: Chọn câu hỏi** (giữ nguyên)

**Bước 4: Xác nhận** (giữ nguyên)

Sau khi tạo → redirect đến edit page, auto chọn tab cấu hình phù hợp.

---

### 4.2 — Tab trên Edit Quiz Page

Hiện tại: Settings | Questions (N) | OPIC Config (chỉ khi IS_OPIC)

Sau khi sửa:
```
Standard quiz: [ Settings ] [ Questions (N) ]
OPIC quiz:     [ Settings ] [ Questions (N) ] [ OPIC Config ]
VSTEP quiz:    [ Settings ] [ Questions (N) ] [ VSTEP Config ]
```

Logic detect:
```ts
// Đọc từ quiz.examMode thay vì hard-code từ quizType
const isOpicQuiz  = quiz?.examMode === "OPIC";
const isVstepQuiz = quiz?.examMode === "VSTEP";
```

---

## 5. Danh sách thay đổi cần thực hiện

### 5.1 BACKEND

#### File 1: `MLS.Domain/Entities/Quiz.cs`
**Thay đổi:** Thêm tham số `ExamMode examMode = ExamMode.Standard` vào `Quiz.Create()`
```csharp
// TRƯỚC
public static Quiz Create(string title, Guid createdBy, QuizType quizType = ...)

// SAU
public static Quiz Create(string title, Guid createdBy, QuizType quizType = ...,
    ExamMode examMode = ExamMode.Standard, ...)
```
Và gán `ExamMode = examMode` trong object initializer.

#### File 2: `MLS.Application/Quiz/Commands/QuizCommands.cs`
**Thay đổi:** Thêm `string ExamMode = "Standard"` vào `CreateQuizCommand` record  
Và truyền vào `Quiz.Create(...)` trong handler.

#### File 3: `MLS.Application/Quiz/Queries/QuizQueries.cs`
**Thay đổi:** Thêm `ExamMode` vào DTO response của `GetQuizDetailQuery` và `GetQuizListQuery`  
Để frontend biết quiz thuộc platform nào mà hiện đúng tab.

> **Không cần migration** vì cột `ExamMode` đã tồn tại trong DB từ trước.

---

### 5.2 FRONTEND

#### File 4: `frontend/src/lib/features/quiz/quizApi.ts`
**Thay đổi:**
- Thêm `examMode: string` vào `QuizDetailDto`
- Thêm `examMode?: string` vào `CreateQuizRequest` (nếu có type riêng)

#### File 5: `frontend/src/app/teacher/quizzes/new/page.tsx`
**Thay đổi lớn — rewrite toàn bộ:**
- Thêm Step 0 (hoặc Step 1): chọn Platform card (Standard / OPIC / VSTEP)
- Đổi tên field "Loại quiz" → "Mục đích"
- Sửa `QUIZ_TYPES` thành mapping đúng theo Platform:
  ```ts
  const PURPOSE_BY_PLATFORM = {
    Standard: ["PracticeQuiz","PlacementTest","MockTest","SegmentQuiz","RealtimeQuiz","AdaptiveQuiz"],
    OPIC:     ["OPICMockTest","OPICMiniTest"],
    VSTEP:    ["VSTEPMockTest","VSTEPListening","VSTEPReading","VSTEPWriting","VSTEPSpeaking"],
  };
  ```
- Thêm `examMode` vào payload khi gọi `createQuiz`

#### File 6: `frontend/src/app/teacher/quizzes/page.tsx` (danh sách)
**Thay đổi nhỏ:**
- Sửa `QUIZ_TYPE_LABEL` thành mapping đúng (bỏ "Chapter","Midterm"... sai)
- Thêm badge Platform (Standard / OPIC / VSTEP) nếu `examMode` có trong response

#### File 7: `frontend/src/app/teacher/quizzes/[id]/page.tsx` (edit page)
**Thay đổi:**
- Đổi `IS_OPIC` từ check `quizType` → check `quiz.examMode === "OPIC"`
- Thêm `isVstepQuiz = quiz?.examMode === "VSTEP"`
- Thêm tab "VSTEP Config" khi `isVstepQuiz` (nội dung có thể để placeholder trước)
- Trên tab Settings: đổi label "Loại quiz" → "Mục đích", thêm hiển thị read-only "Nền tảng"
- Sửa danh sách options của "Mục đích" dropdown theo Platform

---

## 6. Tóm tắt thứ tự implement

```
1. [Backend] Quiz.cs       — thêm ExamMode vào Create()
2. [Backend] QuizCommands  — thêm ExamMode vào CreateQuizCommand
3. [Backend] QuizQueries   — thêm examMode vào GetQuizDetail/List DTO
4. [Frontend] quizApi.ts   — thêm examMode vào types
5. [Frontend] new/page.tsx — rewrite: Platform selector + đúng QuizType values
6. [Frontend] [id]/page.tsx — đổi IS_OPIC dùng examMode, thêm VSTEP tab
7. [Frontend] page.tsx     — sửa label mapping
```

---

## 7. Những gì KHÔNG thay đổi

- Schema DB: không cần migration, cột `ExamMode` đã có
- Enum `QuizType` trong backend: giữ nguyên hoàn toàn
- Logic attempt / play / scoring: không liên quan
- Các page OPIC analytics, OPIC students: không liên quan

---

## 8. Quyết định đã xác nhận

| # | Câu hỏi | Quyết định |
|---|---|---|
| 1 | VSTEP Config tab | **Placeholder "Sắp ra mắt"** — implement sau |
| 2 | Lọc theo Platform | **Có** — thêm filter Standard / OPIC / VSTEP trên trang danh sách |
| 3 | Đổi Platform sau khi tạo | **Không cho phép** — `ExamMode` read-only sau khi save lần đầu |
| 4 | Step tạo quiz | **Thêm Step 0 riêng** — card selector Platform trước khi nhập thông tin |

---

## 9. Yêu cầu bổ sung

### 9.1 — Dropdown cá nhân: thêm link Portal cho Admin/Teacher

**Mô tả:** Trên header, dropdown avatar/tên người dùng chưa có link tắt vào portal.

**Yêu cầu:** Với tài khoản role `Admin` hoặc `Teacher`, thêm mục **"Teacher Portal"** (hoặc **"Admin Portal"** với Admin) trong dropdown, dẫn đến `/teacher` hoặc `/admin`.

**Vị trí cần sửa:**
- Component chứa dropdown avatar trên header (tìm trong `src/components/layout/` hoặc `src/components/Header`)
- Đọc role từ JWT / Redux auth state, render link theo điều kiện role

**Mức độ:** Nhỏ — thêm 1–2 `<Link>` item có điều kiện.

---

### 9.2 — Portal: Danh mục cấu hình (không hard-code)

**Mô tả:** Nhiều field đang hard-code mảng giá trị trực tiếp trong từng component:

| Field | Hard-code tại |
|---|---|
| Loại câu hỏi (`questionType`) | `new/page.tsx`, `[id]/page.tsx`, `questionApi.ts` |
| Kỹ năng (`skillType`) | `new/page.tsx`, `[id]/page.tsx` |
| Độ khó câu hỏi (`difficulty`) | `[id]/page.tsx` |
| Trạng thái quiz (`status`) | `page.tsx` (danh sách) |
| Loại câu hỏi OPIC (`examModeTag`) | `[id]/page.tsx` |

**Yêu cầu:** Tạo menu **"Cấu hình Portal"** trong Teacher/Admin sidebar:

```
/teacher/config
  ├── /teacher/config/question-types   — Loại câu hỏi
  ├── /teacher/config/skill-types      — Kỹ năng
  ├── /teacher/config/difficulties     — Độ khó
  └── /teacher/config/quiz-statuses    — Trạng thái quiz (tên hiển thị, màu badge)
```

**Cách triển khai (2 giai đoạn):**

- **Giai đoạn 1 (sprint này):** Tập trung tất cả constant vào 1 file duy nhất:
  ```ts
  // frontend/src/lib/config/portalConfig.ts  ← tạo mới
  export const QUESTION_TYPES = ["MultipleChoice", "TrueFalse", "FillBlank", "Speaking", ...];
  export const SKILL_TYPES    = ["Đọc", "Nghe", "Nói", "Viết", "Ngữ pháp", "Từ vựng", "Tổng hợp"];
  export const DIFFICULTIES   = ["Dễ", "Trung bình", "Khó"];
  export const QUIZ_STATUSES  = ["Draft", "Published", "Archived"];
  // Tất cả component import từ đây — không còn khai báo rải rác
  ```

- **Giai đoạn 2 (sau):** Backend API trả về danh mục, admin có thể thêm/sửa/xóa, lưu vào bảng `PortalConfigs`.

**Scope sprint này:** Chỉ làm Giai đoạn 1.

---

### 9.3 — Toàn bộ form: tiêu đề field và placeholder bằng tiếng Việt

**Yêu cầu:** Tất cả text hiển thị trong UI (label, placeholder, tooltip, button, thông báo lỗi) phải **bằng tiếng Việt**. Sau khi bổ sung i18n sẽ dùng key dịch, không sửa lại từng chỗ.

**Scope:** Tất cả trang trong `/teacher/**` và `/admin/**`.

**Danh sách cần sửa trong `teacher/quizzes/[id]/page.tsx` (bản hiện tại):**

| Text tiếng Anh hiện tại | Sửa thành tiếng Việt |
|---|---|
| "Back to list" | "← Quay lại danh sách" |
| "Settings" (tab) | "Cài đặt" |
| "Questions (N)" (tab) | "Câu hỏi (N)" |
| "OPIC Config" (tab) | "Cài đặt OPIC" |
| "Publish" / "Archive" | "Xuất bản" / "Lưu trữ" |
| "Analytics" | "Thống kê" |
| "Title" / "Description" | "Tên quiz" / "Mô tả" |
| "Quiz type" / "Skill" | "Mục đích" / "Kỹ năng" |
| "Time limit (min)" | "Thời gian (phút)" |
| "Passing score (%)" | "Điểm đậu (%)" |
| "Shuffle questions" / "Show answers" | "Câu hỏi ngẫu nhiên" / "Hiển thị đáp án" |
| "Save changes" / "Saving..." | "Lưu thay đổi" / "Đang lưu..." |
| "+ Add question" | "+ Thêm câu hỏi" |
| "No questions yet" | "Chưa có câu hỏi nào" |
| "N pts" | "N điểm" |
| "Remove" | "Xóa" |
| "Total questions" / "Has audio" / "Tagged" | "Tổng câu" / "Có audio" / "Đã gắn loại" |
| "Configure by question type" | "Cấu hình theo loại câu hỏi" |
| "Configure" (button) | "Cài đặt" |
| "OPIC Configuration Guide" | "Hướng dẫn cấu hình OPIC" |
| "no audio" | "Chưa có audio" |
| "Add from question bank" | "Thêm từ ngân hàng câu hỏi" |
| "Search..." | "Tìm câu hỏi..." |
| "Already added" / "Add" | "Đã thêm" / "Thêm" |
| "Cancel" / "Save" (OPIC modal) | "Hủy" / "Lưu cài đặt" |
| "OPIC Question Settings" | "Cài đặt OPIC cho câu hỏi" |
| "Loai cau hoi OPIC" | "Loại câu hỏi OPIC" |
| "URL audio (MP3)" | "URL audio câu hỏi (MP3)" |
| "Time limit (sec)" | "Thời gian trả lời (giây)" |
| "Audio play limit" | "Số lần phát audio" |
| "1x" / "2x" / "3x" | "1 lần" / "2 lần" / "3 lần" |
| "Loading..." | "Đang tải..." |
| "Quiz not found" | "Không tìm thấy quiz" |
| "Saved" / "Save failed" | "Đã lưu" / "Lưu thất bại" |
| "Added" / "Failed to add" | "Đã thêm" / "Thêm thất bại" |
| "Removed" / "Failed to remove" | "Đã xóa" / "Xóa thất bại" |
| "OPIC settings saved" / "Update failed" | "Đã cập nhật OPIC" / "Cập nhật thất bại" |
| "Published" / "Publish failed" | "Đã xuất bản" / "Xuất bản thất bại" |
| "Archived" / "Failed" | "Đã lưu trữ" / "Thất bại" |
| "— None —" | "— Không chọn —" |
| "Empty = unlimited" | "Để trống = không giới hạn" |

**Ghi chú:** Các trang `/opic/**` đã dùng tiếng Việt → không cần sửa.

---

## 10. Tổng hợp thứ tự implement (đã cập nhật)

```
── SPRINT 1: Quiz Platform Redesign + Dịch tiếng Việt ───────────────────────
1. [Backend]  Quiz.cs            — thêm ExamMode vào Create()
2. [Backend]  QuizCommands.cs    — thêm ExamMode vào CreateQuizCommand
3. [Backend]  QuizQueries.cs     — thêm examMode vào List/Detail DTO
4. [Frontend] quizApi.ts         — thêm examMode vào types
5. [Frontend] new/page.tsx       — rewrite: Step 0 Platform + đúng QuizType values
6. [Frontend] page.tsx (list)    — filter Standard/OPIC/VSTEP + sửa label mapping
7. [Frontend] [id]/page.tsx      — examMode-based tabs, VSTEP placeholder,
                                   dịch toàn bộ sang tiếng Việt (yêu cầu 9.3)
8. [Frontend] portalConfig.ts    — tạo file config tập trung (yêu cầu 9.2 p1)
                                   update tất cả component dùng file này

── SPRINT 2: Portal UX ──────────────────────────────────────────────────────
9. [Frontend] Header/UserDropdown — link Portal theo role (yêu cầu 9.1)
10.[Frontend] teacher/config/*    — trang cấu hình danh mục UI (yêu cầu 9.2 p1)
```
