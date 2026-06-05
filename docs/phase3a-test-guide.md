# Phase 3A — Hướng dẫn Test Tính năng Quiz Engine

> **Môi trường:** Local — `http://localhost:3000` (frontend) · `http://localhost:5009` (API)  
> **Tenant header:** `X-Tenant-Slug: demo`  
> **DB:** PostgreSQL, database `mls`, schema `tenant_demo`  
> **Ngày cập nhật:** 23/05/2026 (Sprint 3.7 + 5.1 + 5.6 hoàn thành)

---

## Tài khoản test

| Role | Email | Password | Ghi chú |
|------|-------|----------|---------|
| Student | `student@demo.com` | `Test@123` | Dùng để làm bài, xem kết quả |
| Teacher | `teacher@demo.com` | `Test@123` | Dùng để tạo quiz, xem analytics |
| Teacher 01 | `teacher01@demo.com` | `Test@123` | Tài khoản giáo viên phụ |

---

## Mục lục

1. [Placement Test (Student)](#1-placement-test-student)
2. [Quiz thông thường — Student làm bài](#2-quiz-thường-student-làm-bài)
3. [Quiz Builder — Teacher tạo quiz](#3-quiz-builder-teacher-tạo-quiz)
4. [Question Bank — Teacher quản lý câu hỏi](#4-question-bank-teacher-quản-lý-câu-hỏi)
5. [Quiz Analytics — Teacher xem thống kê](#5-quiz-analytics-teacher-xem-thống-kê)
6. [Placement Dashboard — Teacher](#6-placement-dashboard-teacher)
7. [Tích hợp Quiz trong Course Detail](#7-tích-hợp-quiz-trong-course-detail)
8. [Placement Widget trên My Lesson](#8-placement-widget-trên-my-lesson)
9. [API Smoke Tests (cURL / Postman)](#9-api-smoke-tests)
10. [Kiểm tra Database](#10-kiểm-tra-database)
11. [Matching & Ordering Questions UI](#11-matching--ordering-questions-ui)
12. [Video Quiz Popup trong Video Player](#12-video-quiz-popup-trong-video-player)
13. [Seed: Gán Quiz vào Khoá Học](#13-seed-gán-quiz-vào-khoá-học)

---

## 1. Placement Test (Student)

**Mục tiêu:** Học viên làm bài xếp lớp, nhận kết quả level 1–6 và skill breakdown.

### 1.1 Truy cập trang Placement Test
1. Mở `http://localhost:3000/placement-test`
2. **Chưa đăng nhập:** trang redirect sang `/login?next=/placement-test`
3. Đăng nhập bằng `student@demo.com`
4. Quay lại `/placement-test`

**Kỳ vọng — Stage Intro:**
- Hiển thị tên bài kiểm tra, số câu hỏi (30), thời gian (nếu có)
- Nếu đã làm trước → hiện badge "Cấp X" + ngày test + nút "Làm lại"
- Nút **"Bắt đầu kiểm tra"** nổi bật màu xanh navy

### 1.2 Làm bài
1. Nhấn "Bắt đầu kiểm tra"
2. API `POST /api/v1/placement/start` được gọi — nhận `attemptId` + `questions`

**Kỳ vọng — Stage Quiz:**
- Hiển thị câu hỏi đầu tiên (content, options)
- Timer đếm lên (hoặc đếm xuống nếu `Duration` được set)
- Navigator 30 chấm ở dưới — chấm hiện tại viền xanh, đã trả lời xanh lá, chưa làm xám
- Chọn đáp án → chấm tương ứng chuyển xanh lá
- Chuyển câu bằng nút **← Trước** / **Tiếp →** hoặc nhấn trực tiếp vào chấm
- **Save-on-navigate:** khi chuyển câu, answer tự động lưu qua `PUT /api/v1/attempts/{id}/answer`

**Test các loại câu hỏi:**
- SingleChoice: chọn 1 radio → chỉ 1 option được chọn
- MultipleChoice: tick nhiều checkbox
- TrueFalse: 2 nút True / False
- FillBlank: input text tự do
- **Matching:** grid mỗi dòng `từ cần nối ↔ <select>`, chọn đáp án tương ứng
- **Ordering:** danh sách đánh số + nút ▲/▼ để sắp xếp

### 1.3 Nộp bài
1. Trả lời xong (hoặc bỏ qua một số câu)
2. Nhấn **"Nộp bài (X/30)"** ở câu cuối cùng
3. API `POST /api/v1/attempts/{id}/submit` → `POST /api/v1/placement/result`

**Kỳ vọng — Stage Result:**
- Level badge lớn: "Cấp 3 — Sơ trung" (màu theo level)
- Điểm số: "7.5 / 10 (75%)"
- Skill breakdown: thanh progress bar cho từng kỹ năng (Listening, Grammar, Reading...)
- Recommended path text
- Nút "Làm lại bài kiểm tra" → cho phép làm lại (cooldown 6 tháng trên backend)

### 1.4 Test Idempotency
1. Đang ở stage quiz, refresh trang (F5)
2. Nhấn "Bắt đầu kiểm tra" lại
3. **Kỳ vọng:** Tiếp tục attempt cũ (cùng `attemptId`), không tạo attempt mới

### 1.5 Test Cooldown
1. Đã có kết quả placement
2. Gọi `POST /api/v1/placement/result` với `attemptId` cũ
3. **Kỳ vọng:** Trả về kết quả cũ (không tạo PlacementResult mới), không lỗi

---

## 2. Quiz Thường — Student Làm Bài

**Mục tiêu:** Student làm quiz gắn với khoá học, có timer, retry limit, và kết quả review.

### 2.1 Tìm quiz để test
1. Vào `http://localhost:3000/courses` → chọn 1 khoá học
2. Trang course detail có phần **"Bài kiểm tra"** — danh sách quiz Published
3. Nhấn vào tên quiz → `/quiz/[id]`

### 2.2 Quiz Intro Page (`/quiz/[id]`)
**Kỳ vọng:**
- Tên quiz, mô tả, số câu, thời gian làm bài
- Điểm đạt (passing score)
- Số lần còn lại (nếu có RetryLimit)
- Lịch sử làm bài (attempt trước nếu có: điểm, ngày)
- Nút **"Bắt đầu làm bài"**

### 2.3 Quiz Player Page (`/quiz/[id]/play`)
1. Nhấn "Bắt đầu làm bài"
2. **Kỳ vọng:**
   - Layout: câu hỏi lớn ở giữa + navigator bên dưới
   - Top bar: tên quiz + timer + nút Thoát
   - Progress bar (số câu đã trả lời / tổng)
   - Câu hỏi render theo type (SingleChoice, MultipleChoice, TrueFalse, FillBlank, **Matching, Ordering**)
   - Navigator dot: chấm màu, click chuyển câu trực tiếp

3. **Test Timer (nếu quiz có Duration):**
   - Timer đếm ngược hiển thị màu đỏ khi còn < 60s
   - Hết giờ: tự động nộp bài

4. **Test Thoát:**
   - Nhấn "Thoát" → confirm dialog → abandon attempt → quay về `/quiz/[id]`

### 2.4 Nộp bài và kết quả
1. Trả lời xong → nút **"Nộp bài (X/N)"** ở câu cuối
2. `POST /api/v1/attempts/{id}/submit` → redirect `/quiz/[id]/result/[attemptId]`

**Kỳ vọng — Result Page:**
- Điểm: "8.5 / 10 (85%)" + badge Passed/Failed
- Thời gian làm bài
- Per-câu review: từng câu hiện đáp án chọn + đáp án đúng + explanation
- Màu xanh = đúng, đỏ = sai

### 2.5 Retry Limit
1. Làm bài khi `RetryLimit = 2`
2. Lần 3 nhấn "Bắt đầu làm bài"
3. **Kỳ vọng:** Nút bị disabled hoặc lỗi "Đã hết lượt làm bài"

---

## 3. Quiz Builder — Teacher Tạo Quiz

**Mục tiêu:** Teacher tạo quiz mới, gán câu hỏi, publish.

### 3.1 Danh sách Quiz (`/teacher/quizzes`)
1. Đăng nhập teacher → `http://localhost:3000/teacher/quizzes`
2. **Kỳ vọng:**
   - Bảng danh sách quiz: tên, type, status, số câu, ngày tạo
   - Filter theo status (Draft / Published / Archived)
   - Nút **"Tạo Quiz Mới"**

### 3.2 Tạo Quiz Mới (`/teacher/quizzes/new`)
1. Nhấn "Tạo Quiz Mới"
2. Điền form:
   - **Title**: "Test Quiz Demo"
   - **Quiz Type**: PracticeQuiz
   - **Skill Type**: Grammar
   - **Level**: 3
   - **Duration**: 600 (10 phút)
   - **Passing Score**: 7
   - **Allow Retry**: bật
3. Nhấn **"Tạo Quiz"**
4. **Kỳ vọng:** Redirect về `/teacher/quizzes/[newId]` với toast success

### 3.3 Chỉnh sửa Quiz (`/teacher/quizzes/[id]`)

**Tab Settings:**
1. Sửa title, description, passing score
2. Nhấn **"Lưu thay đổi"**
3. **Kỳ vọng:** Toast "Đã lưu cài đặt", API `PUT /api/quizzes/{id}` 200

**Tab Questions:**
1. Nhấn **"Thêm câu hỏi"**
2. Modal hiện danh sách câu hỏi từ question bank (search theo keyword)
3. Nhấn **"+"** chọn câu hỏi vào quiz
4. **Kỳ vọng:** Câu hỏi xuất hiện trong list, toast success
5. Nhấn **"X"** bên cạnh câu hỏi → gỡ khỏi quiz
6. **Kỳ vọng:** Câu hỏi biến mất khỏi list

### 3.4 Publish / Archive
1. Nhấn **"Publish"**
2. **Kỳ vọng:** Status → Published, nút đổi thành "Archive"
3. Nhấn **"Archive"**
4. **Kỳ vọng:** Status → Archived, quiz không hiện trong student view

---

## 4. Question Bank — Teacher Quản Lý Câu Hỏi

**Mục tiêu:** Teacher CRUD câu hỏi, xem danh sách, filter.

### 4.1 Trang Question Bank (`/teacher/questions`)
1. Vào `http://localhost:3000/teacher/questions`
2. **Kỳ vọng:**
   - Table: Content (truncated), Type, Skill, Difficulty, Tags, Actions
   - Filter: search text, type dropdown, skill dropdown
   - Nút **"Tạo câu hỏi mới"**

### 4.2 Tạo câu hỏi SingleChoice
1. Nhấn "Tạo câu hỏi mới"
2. Điền:
   - **Content**: "Which word means happy?"
   - **Type**: SingleChoice
   - **Skill**: Vocabulary
   - **Difficulty**: Easy
   - **Options**: "Joyful" (correct) · "Sad" · "Angry" · "Tired"
   - **Explanation**: "Joyful means very happy"
3. Nhấn **"Lưu"**
4. **Kỳ vọng:** Câu hỏi xuất hiện trong list, type "SingleChoice"

### 4.3 Tạo câu hỏi FillBlank
1. Tạo mới với type FillBlank
2. **Content**: "The cat _____ on the mat." (dùng `_____` làm blank)
3. Thêm 1 option với content = "sat" và `isCorrect = true`
4. **Kỳ vọng:** Auto-grade sẽ match "sat" (case-insensitive)

### 4.4 Xoá câu hỏi (Soft Delete)
1. Nhấn icon xoá bên cạnh câu hỏi
2. Confirm dialog
3. **Kỳ vọng:**
   - Câu hỏi biến mất khỏi list (global query filter lọc `IsDeleted = false`)
   - Câu hỏi vẫn còn trong DB với `IsDeleted = true`
   - `AttemptAnswers` của câu hỏi đó **không bị xoá** (FK được giữ nguyên)

### 4.5 Kiểm tra sau xoá
```sql
-- Chạy trong psql để verify soft delete
SELECT "Id", "Content", "IsDeleted", "DeletedAt"
FROM tenant_demo."Questions"
WHERE "IsDeleted" = true;
```

---

## 5. Quiz Analytics — Teacher Xem Thống Kê

**Mục tiêu:** Teacher xem số lượt làm bài, pass rate, per-question performance.

### 5.1 Trang Analytics (`/teacher/quizzes/[id]/analytics`)
1. Chọn 1 quiz đã có học viên làm bài
2. Nhấn "Analytics" / link tới `/teacher/quizzes/[id]/analytics`
3. **Kỳ vọng:**
   - **Summary cards**: Total attempts, Avg score, Pass rate, Avg time
   - **Per-question table**: % trả lời đúng, % bỏ qua cho từng câu
   - Câu nào pass rate thấp < 30% → highlight màu đỏ (câu khó)

### 5.2 Kiểm tra số liệu khớp với DB
```sql
-- Tổng attempts, pass rate
SELECT
    COUNT(*)                                    AS total_attempts,
    AVG("Percentage")                          AS avg_percentage,
    COUNT(*) FILTER (WHERE "Passed" = true) * 100.0 / COUNT(*)  AS pass_rate
FROM tenant_demo."QuizAttempts"
WHERE "QuizId" = '<quiz-id-ở-đây>'
  AND "State" = 'Graded';
```

---

## 6. Placement Dashboard — Teacher

**Mục tiêu:** Teacher xem phân bổ level của học viên sau placement test.

### 6.1 Trang Placement Dashboard (`/teacher/placement`)
1. Vào `http://localhost:3000/teacher/placement`
2. **Kỳ vọng:**
   - Bảng phân bổ level: Level 1 → N người, Level 2 → M người...
   - Hoặc biểu đồ cột/donut
   - Danh sách kết quả gần nhất (user, level, date)

---

## 7. Tích Hợp Quiz Trong Course Detail

**Mục tiêu:** Section "Bài kiểm tra" hiển thị đúng trong trang course.

### 7.1 Kiểm tra Course Detail
1. Vào `http://localhost:3000/courses` → chọn khoá học có quiz gắn vào
2. Scroll xuống — tìm phần **"Bài kiểm tra"**
3. **Kỳ vọng:**
   - Hiển thị tối đa 4 quiz Published gắn với khoá học này (`courseId = <id>`)
   - Mỗi card: tên quiz, type, số câu, thời gian, nút "Làm bài"
   - Nhấn "Làm bài" → `/quiz/[quizId]`
4. Nếu không có quiz nào → section ẩn (không render)

### 7.2 Gán quiz vào khoá học để test
1. Tạo quiz mới, set `CourseId = <courseId>`, Publish
2. **Hoặc** dùng API:
   ```
   PUT /api/quizzes/{quizId}
   Body: { "courseId": "<courseId>" }
   ```
3. Refresh trang course detail → quiz xuất hiện trong section

---

## 8. Placement Widget Trên My Lesson

**Mục tiêu:** Widget hiển thị đúng level và link xếp lớp trên dashboard học viên.

### 8.1 Chưa có kết quả placement
1. Dùng tài khoản mới chưa làm placement
2. Vào `http://localhost:3000/my-lesson`
3. **Kỳ vọng (sidebar phải):** Card "Xếp lớp" → text "Chưa xếp lớp" + nút "Kiểm tra ngay" → `/placement-test`

### 8.2 Đã có kết quả placement
1. Đã làm placement test xong
2. Vào `http://localhost:3000/my-lesson`
3. **Kỳ vọng:**
   - Badge level: "Cấp 3" (màu theo level)
   - 3 skill bars nhỏ (top 3 skills từ breakdown)
   - Link "Làm lại bài kiểm tra →" → `/placement-test`

---

## 9. API Smoke Tests

### Prerequisite — Lấy JWT Token
```bash
curl -X POST http://localhost:5009/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Slug: demo" \
  -d '{"email":"student@demo.com","password":"Test@123"}' \
  | jq '.accessToken'
```

Gán vào biến: `TOKEN=<accessToken>`

---

### TC-API-01: Lấy bài Placement Quiz
```bash
curl -X GET http://localhost:5009/api/v1/placement/quiz \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Slug: demo"
```
**Kỳ vọng:** 200, body chứa `{ id, title, questions: [...] }`, 30 câu

---

### TC-API-02: Bắt đầu Placement Attempt
```bash
curl -X POST http://localhost:5009/api/v1/placement/start \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Slug: demo" \
  -H "Content-Type: application/json" \
  -d '{}'
```
**Kỳ vọng:** 200, `{ attemptId, questions: [30 items, shuffled] }`

---

### TC-API-03: Idempotency — Start lần 2
Gọi lại TC-API-02 ngay sau đó.  
**Kỳ vọng:** 200, **cùng `attemptId`** với lần 1

---

### TC-API-04: Lưu đáp án
```bash
ATTEMPT_ID="<attemptId-từ-TC-API-02>"
QUESTION_ID="<questionId-câu-1>"

curl -X PUT http://localhost:5009/api/v1/attempts/$ATTEMPT_ID/answer \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Slug: demo" \
  -H "Content-Type: application/json" \
  -d "{\"questionId\":\"$QUESTION_ID\",\"answerValue\":\"[\\\"<optionId>\\\"]\"}"
```
**Kỳ vọng:** `true`

---

### TC-API-05: Nộp bài
```bash
curl -X POST http://localhost:5009/api/v1/attempts/$ATTEMPT_ID/submit \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Slug: demo" \
  -H "Content-Type: application/json" \
  -d '{"timeTaken": 300}'
```
**Kỳ vọng:** `{ score, percentage, passed, hasManualGrading: false }`

---

### TC-API-06: Idempotency — Submit lần 2
Gọi lại TC-API-05.  
**Kỳ vọng:** 200, cùng `score`/`percentage` — **không lỗi 400**

---

### TC-API-07: Lưu Placement Result
```bash
curl -X POST http://localhost:5009/api/v1/placement/result \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Slug: demo" \
  -H "Content-Type: application/json" \
  -d "{\"attemptId\":\"$ATTEMPT_ID\"}"
```
**Kỳ vọng:** `{ id, level (1–6), skillBreakdown, recommendedPath }`

---

### TC-API-08: Xem kết quả Placement của tôi
```bash
curl -X GET http://localhost:5009/api/v1/placement/my-result \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Slug: demo"
```
**Kỳ vọng:** 200, `{ assignedLevel, skillBreakdown, testedAt }`

---

### TC-API-09: Danh sách Quiz (Teacher)
```bash
# Đổi sang token teacher
curl -X GET "http://localhost:5009/api/quizzes?status=Published&pageSize=10" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -H "X-Tenant-Slug: demo"
```
**Kỳ vọng:** `{ items: [...], total, page }`

---

### TC-API-10: Analytics một Quiz
```bash
QUIZ_ID="<quiz-id>"
curl -X GET http://localhost:5009/api/analytics/quizzes/$QUIZ_ID \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -H "X-Tenant-Slug: demo"
```
**Kỳ vọng:** `{ totalAttempts, avgScore, passRate, perQuestion: [...] }`

---

### TC-API-11: Xoá câu hỏi (Soft Delete)
```bash
QUESTION_ID="<question-id>"
curl -X DELETE http://localhost:5009/api/questions/$QUESTION_ID \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -H "X-Tenant-Slug: demo"
```
**Kỳ vọng:** `true` — verify DB: `IsDeleted = true`, `AttemptAnswers` không bị xoá

---

## 10. Kiểm Tra Database

> Kết nối: `psql -U postgres -d mls`  
> Sau khi connect: `SET search_path = tenant_demo;`

### Verify schema đã có columns mới (Review Fixes)
```sql
-- ExpiresAt trên QuizAttempts
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'tenant_demo'
  AND table_name = 'QuizAttempts'
  AND column_name = 'ExpiresAt';

-- IsDeleted + DeletedAt trên Questions
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'tenant_demo'
  AND table_name = 'Questions'
  AND column_name IN ('IsDeleted', 'DeletedAt');
```
**Kỳ vọng:** 3 rows, data_type `timestamp with time zone` / `boolean`

---

### Verify indexes tồn tại
```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'tenant_demo'
  AND indexname IN (
    'idx_attempts_user_state',
    'idx_answers_attempt_question',
    'idx_placement_user_date',
    'idx_questions_isdeleted',
    'idx_quiz_questions_order'
  );
```
**Kỳ vọng:** 5 rows (nếu đã chạy `phase3-quiz-review-fixes.sql`)

---

### Verify Placement Result sau test
```sql
SELECT
    pr."Id",
    pr."AssignedLevel",
    pr."TestedAt",
    pr."SkillBreakdown"
FROM "PlacementResults" pr
JOIN "QuizAttempts" qa ON pr."AttemptId" = qa."Id"
ORDER BY pr."TestedAt" DESC
LIMIT 5;
```

---

### Verify AutoGrader chạm điểm đúng
```sql
-- Xem kết quả chấm tự động của 1 attempt
SELECT
    aa."QuestionId",
    aa."AnswerValue",
    aa."IsCorrect",
    aa."Score"
FROM "AttemptAnswers" aa
WHERE aa."AttemptId" = '<attempt-id>'
ORDER BY aa."CreatedAt";
```

---

## Checklist Tổng hợp

| # | Tính năng | Test Case | Pass |
|---|-----------|-----------|------|
| 1 | Placement intro stage | 1.1 | ☐ |
| 2 | Placement làm bài 30 câu | 1.2 | ☐ |
| 3 | Placement result level badge | 1.3 | ☐ |
| 4 | Placement idempotency start | 1.4 | ☐ |
| 5 | Placement cooldown 6 tháng | 1.5 | ☐ |
| 6 | Quiz intro page | 2.2 | ☐ |
| 7 | Quiz player timer | 2.3 | ☐ |
| 8 | Quiz save-on-navigate | 2.3 | ☐ |
| 9 | Quiz result + review | 2.4 | ☐ |
| 10 | Quiz retry limit | 2.5 | ☐ |
| 11 | Teacher tạo quiz | 3.2 | ☐ |
| 12 | Teacher gán câu hỏi vào quiz | 3.3 | ☐ |
| 13 | Teacher publish / archive | 3.4 | ☐ |
| 14 | Question bank CRUD | 4.1–4.3 | ☐ |
| 15 | Soft delete câu hỏi | 4.4 | ☐ |
| 16 | Quiz analytics | 5.1 | ☐ |
| 17 | Placement dashboard | 6.1 | ☐ |
| 18 | Quiz section trên course detail | 7.1 | ☐ |
| 19 | Placement widget my-lesson | 8.1, 8.2 | ☐ |
| 20 | API idempotency submit | TC-API-06 | ☐ |
| 21 | DB review fix columns | 10 | ☐ |
| 22 | **Matching UI** — nối câu bằng select dropdown | 11.1 | ☐ |
| 23 | **Ordering UI** — sắp xếp bằng nút ▲/▼ | 11.2 | ☐ |
| 24 | **Video Quiz popup** — dừng video, hiển quiz, tiếp tục | 12.1 | ☐ |
| 25 | **Seed quiz→course** — chạy SQL, kiểm tra course detail | 13.1 | ☐ |

---

## Các vấn đề đã biết (Known Issues)

| Issue | Mô tả | Workaround |
|-------|-------|------------|
| AntiCheat PUT endpoint | Tab-switch chỉ log ra console, chưa gửi lên server | — |
| Placement cooldown frontend | Frontend chưa hiển thị thông báo “Còn X ngày mới được làm lại” — chỉ trả về kết quả cũ | — |

> **✅ Đã fix:** Matching/Ordering UI (Sprint 3.7), Video quiz popup (Sprint 5.1), Seed quiz→course (Sprint 5.6)
---

## 11. Matching & Ordering Questions UI

**Mục tiêu:** Kiểm tra 2 loại câu hỏi mới được implement (Sprint 3.7) hiển thị đúng trong quiz player và placement test.

### 11.1 Test Matching Question

**Điều kiện:** Cần có câu hỏi type `Matching` được gán vào 1 quiz Published.

1. Vào `/quiz/[id]/play` của quiz có câu hỏi Matching
2. **Kỳ vọng:**
   - Mỗi dòng: `[Từ cần nối] ↔ [Dropdown chọn đáp án]`
   - Dropdown liệt kê tất cả `matchValue` có thể chọn
   - Khi chọn xong → border dòng đó chuyển xanh navy, background `#EFF6FF`
   - Câu hỏi không được chọn → border xám `#E5E7EB`
   - Navigator dot chuyển xanh lá sau khi chọn ít nhất 1 cặp

3. **Test trong Placement Test:**
   - Vào `/placement-test` → làm bài
   - Tìm câu Matching (nếu có trong seed data)
   - Kỳ vọng: giao diện giống quiz player, `onFillBlank` được gọi với JSON string

4. **Verify auto-grade:**
```sql
-- Sau khi nộp bài, kiểm tra đáp án được lưu
SELECT aa."QuestionId", aa."AnswerValue", aa."IsCorrect", aa."Score"
FROM tenant_demo."AttemptAnswers" aa
JOIN tenant_demo."QuizAttempts" qa ON aa."AttemptId" = qa."Id"
ORDER BY qa."CreatedAt" DESC
LIMIT 10;
```
**Kỳ vọng:** `AnswerValue` là JSON `[{"key":"A","value":"Dog"},...]`, `IsCorrect` = `true`/`false`, `Score` có partial credit.

---

### 11.2 Test Ordering Question

1. Vào `/quiz/[id]/play` của quiz có câu hỏi Ordering
2. **Kỳ vọng:**
   - Danh sách các mục được đánh số (1, 2, 3...)
   - Mỗi mục có 2 nút ▲ (lên) / ▼ (xuống) ở phải
   - Nút ▲ của mục đầu tiên bị disable (màu xám)
   - Nút ▼ của mục cuối cùng bị disable (màu xám)
   - Kéo thứ tự: nhấn ▲/▼ để hoán đổi vị trí 2 mục liền kề
   - Số thứ tự cập nhật ngay lập tức

3. **Test save-on-navigate:**
   - Sắp xếp lại thứ tự → chuyển sang câu khác → quay lại
   - **Kỳ vọng:** Thứ tự đã chọn được giữ nguyên (đã lưu qua `PUT /api/v1/attempts/{id}/answer`)

---

## 12. Video Quiz Popup trong Video Player

**Mục tiêu:** Khi video đến giây `VideoTriggerSecond` của quiz, video dừng và popup quiz hiện ra. (Sprint 5.1)

### 12.1 Setup điều kiện test

**Bước 1:** Tạo/tìm 1 quiz có `VideoTriggerSecond` và gán vào 1 session có video.
```sql
-- Kiểm tra quiz có VideoTriggerSecond
SET search_path TO tenant_demo;
SELECT q."Id", q."Title", q."SessionId", q."VideoTriggerSecond", q."Status"
FROM "Quizzes" q
WHERE q."VideoTriggerSecond" IS NOT NULL;
```

**Bước 2:** Nếu chưa có, chạy seed SQL:
```bash
psql -U postgres -d mls -f deploy/seed-quiz-course-link.sql
```

**Bước 3:** Hoặc update thủ công:
```sql
-- Gán VideoTriggerSecond = 10 giây cho 1 quiz test
UPDATE tenant_demo."Quizzes"
SET "VideoTriggerSecond" = 10, "SessionId" = (
    SELECT "Id" FROM tenant_demo."Sessions"
    WHERE "SessionType" = 'Interactive' LIMIT 1
)
WHERE "Title" = '<tên quiz test>'
  AND "Status" = 'Published';
```

### 12.2 Test popup hiển thị

1. Đăng nhập học viên → vào trang học session có video (`/learn/[sessionId]`)
2. **Kỳ vọng ban đầu:** Video phát bình thường
3. Khi video đến giây `VideoTriggerSecond` (ví dụ: giây 10):
   - Video **dừng lại** (pause)
   - Popup xuất hiện với overlay tối (`rgba(0,0,0,0.75)`)
   - Popup hiển thị: badge "Quiz Video" + câu hỏi đầu tiên + navigator dots + nút điều hướng
4. **Kỳ vọng popup:**
   - Nút ✕ ở góc trên phải (đóng popup, tiếp tục video)
   - Câu hỏi render đúng theo type (SingleChoice, MultipleChoice, FillBlank, Matching, Ordering)
   - Navigator dot bên dưới — số câu hỏi
   - Nút **← Trước** / **Tiếp →** hoặc **Nộp bài** (câu cuối)

### 12.3 Test luồng làm bài trong popup

1. Chọn đáp án các câu → nhấn **Tiếp →** qua từng câu
2. Câu cuối: nhấn **Nộp bài**
3. **Kỳ vọng — màn hình kết quả:**
   - Emoji 🎉 (passed) hoặc 📚 (failed)
   - Text: "Xuất sắc!" / "Cần ôn tập thêm"
   - Điểm: "XX%"
   - Nút **"Tiếp tục xem video"** → đóng popup + video **tiếp tục phát**

### 12.4 Test anti re-trigger

1. Xem đến giây trigger → popup hiện → đóng popup → video tiếp tục phát
2. Seek video về trước giây trigger → để video phát qua giây trigger lần 2
3. **Kỳ vọng:** Popup **KHÔNG** hiện lần 2 (`videoQuizTriggeredRef = true` đã khóa)

### 12.5 Test API endpoint mới
```bash
SESSION_ID="<sessionId-có-video-quiz>"
curl -X GET "http://localhost:5009/api/v1/sessions/$SESSION_ID/video-quiz" \
  -H "X-Tenant-Slug: demo"
```
**Kỳ vọng:** `200 { "id": "...", "title": "...", "videoTriggerSecond": 10 }`  
Nếu session không có video quiz → `404`

---

## 13. Seed: Gán Quiz vào Khoá Học

**Mục tiêu:** Chạy seed SQL để gán quiz vào course và verify tích hợp. (Sprint 5.6)

### 13.1 Chạy seed SQL
```bash
psql -U postgres -d mls -f deploy/seed-quiz-course-link.sql
```

**Output mong đợi:**
- Bảng đầu: trạng thái quiz trước update (`CourseId = NULL`)
- `UPDATE X` — số quiz đã được gán vào course
- `NOTICE: Linked quiz X to session Y (video trigger)` (nếu tìm được)
- Bảng cuối: trạng thái quiz sau update (`CourseId` được điền)

### 13.2 Verify trong Course Detail

1. Vào `http://localhost:3000/courses` → chọn course Published đầu tiên
2. Scroll xuống phần **"Bài kiểm tra"**
3. **Kỳ vọng:**
   - Hiển thị tối thiểu 1 quiz (vừa được gán)
   - Card: tên quiz, type badge, số câu, nút "Làm bài"
   - Nhấn "Làm bài" → `/quiz/[quizId]`

### 13.3 Verify bằng SQL
```sql
SET search_path TO tenant_demo;

-- Quiz đã có CourseId
SELECT q."Title", q."Status", q."CourseId", c."Title" AS course_title
FROM "Quizzes" q
LEFT JOIN "Courses" c ON q."CourseId" = c."Id"
WHERE q."CourseId" IS NOT NULL;

-- Quiz đã có SessionId (video trigger)
SELECT q."Title", q."VideoTriggerSecond", q."SessionId", s."Title" AS session_title
FROM "Quizzes" q
LEFT JOIN "Sessions" s ON q."SessionId" = s."Id"
WHERE q."SessionId" IS NOT NULL AND q."VideoTriggerSecond" IS NOT NULL;
```
