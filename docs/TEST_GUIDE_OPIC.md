# Hướng Dẫn Test — Phase 3.2 OPIC Mode

> **Stack:** Backend :5009 · Frontend :3000 · DB: `tenant_demo` · Auth: `student@demo.com / Test@123`

---

## 1. Chuẩn bị

```bash
# 1. Đảm bảo Docker Desktop đang chạy (Redis container: mls_redis)
# 2. Start backend
dotnet run --project "d:\HiepPD\MLS\backend\MLS.API\MLS.API.csproj" --urls "http://localhost:5009" -c Release
# 3. Start frontend
cd d:\HiepPD\MLS\frontend; npm run dev
```

**Header bắt buộc:** `X-Tenant-Slug: demo`

**Lấy token:** Đăng nhập `POST /api/v1/auth/login` với `{"email":"student@demo.com","password":"Test@123"}`

---

## 2. Test Backend — REST API

### 2.1 Topics (không cần auth)

```http
GET http://localhost:5009/api/v1/opic/topics
X-Tenant-Slug: demo
```

**Kết quả mong đợi:**
```json
{
  "surveyTopics": ["music","movies","sports",...],
  "commonTopics": ["bank","restaurant",...]
}
```

---

### 2.2 Lưu Survey

```http
POST http://localhost:5009/api/v1/opic/survey
Authorization: Bearer {token}
X-Tenant-Slug: demo
Content-Type: application/json

{
  "selectedTopics": ["music","travel","cooking","sports","education"],
  "targetLevel": "IM2",
  "chosenDifficulty": 3,
  "language": "vi"
}
```

**Kết quả mong đợi:** `200 OK` với `OPICTopicSurveyDto` (có `id`, `selectedTopics`, `chosenDifficulty`)

---

### 2.3 Lấy Survey của tôi

```http
GET http://localhost:5009/api/v1/opic/survey/my?language=vi
Authorization: Bearer {token}
X-Tenant-Slug: demo
```

**Kết quả mong đợi:** `200 OK` với survey vừa tạo (hoặc `404` nếu chưa tạo)

---

### 2.4 Tạo Session

Dùng `surveyId` từ bước 2.2:

```http
POST http://localhost:5009/api/v1/opic/sessions
Authorization: Bearer {token}
X-Tenant-Slug: demo
Content-Type: application/json

{
  "surveyId": "{surveyId-from-2.2}",
  "chosenDifficulty": 3,
  "language": "vi"
}
```

**Kết quả mong đợi:** `200 OK` với `OPICSessionDto`:
```json
{
  "id": "...",
  "sessionState": "Orientation",
  "chosenDifficulty": 3,
  "isCompleted": false,
  "questionsDone": 0
}
```

---

### 2.5 Lấy Session Detail

```http
GET http://localhost:5009/api/v1/opic/sessions/{sessionId}
Authorization: Bearer {token}
X-Tenant-Slug: demo
```

**Kết quả mong đợi:** `200 OK` với combos `[]` và attemptRefs `[]` (vì chưa làm câu nào)

---

### 2.6 Mid-Adjust (sau câu 7)

```http
POST http://localhost:5009/api/v1/opic/sessions/{sessionId}/mid-adjust
Authorization: Bearer {token}
X-Tenant-Slug: demo
Content-Type: application/json

{ "choice": "same" }
```

**Kết quả mong đợi:** `200 OK`, `sessionState` chuyển thành `"Session2"`, `midAdjustChoice = "same"`

> Thử lại với `"easier"` hoặc `"harder"` → kiểm tra `finalDifficulty` thay đổi đúng

---

### 2.7 Ghi Attempt Ref

```http
POST http://localhost:5009/api/v1/opic/sessions/{sessionId}/attempt-ref
Authorization: Bearer {token}
X-Tenant-Slug: demo
Content-Type: application/json

{
  "attemptId": "00000000-0000-0000-0000-000000000001",
  "questionIndex": 1
}
```

**Kết quả mong đợi:** `204 No Content`

> Gửi lại cùng `questionIndex` → vẫn `204` (idempotent, không tạo duplicate)

---

### 2.8 Lịch sử sessions

```http
GET http://localhost:5009/api/v1/opic/sessions/my-history?page=1&pageSize=10
Authorization: Bearer {token}
X-Tenant-Slug: demo
```

**Kết quả mong đợi:** Danh sách sessions vừa tạo

---

### 2.9 Kết quả mới nhất

```http
GET http://localhost:5009/api/v1/opic/results/my-latest?language=vi
Authorization: Bearer {token}
X-Tenant-Slug: demo
```

**Kết quả mong đợi:** `404` nếu chưa hoàn thành session nào

---

### 2.10 Script Templates (public)

```http
GET http://localhost:5009/api/v1/opic/scripts?language=vi
X-Tenant-Slug: demo
```

**Kết quả mong đợi:** `200 OK` với `[]` (chưa có template nào)

---

## 3. Test Frontend

### 3.1 Survey Page

1. Mở `http://localhost:3000/opic/survey`
2. Đăng nhập nếu được redirect về login
3. Chọn ít nhất 3 chủ đề → nút "Bắt đầu" active
4. Chọn < 3 → nhấn "Bắt đầu" → thông báo lỗi
5. Chọn difficulty + target level (optional) → nhấn "Bắt đầu"
6. Phải redirect đến `/opic/{sessionId}/play`

---

### 3.2 Play Page

1. URL: `/opic/{sessionId}/play`
2. Thanh tiến trình hiển thị "Câu 1 / 15"
3. Nhấn "Bắt đầu ghi âm" → trình duyệt hỏi microphone permission → cấp phép
4. Ghi âm vài giây → nhấn "Dừng" → hiện audio preview + "Ghi lại"
5. Nhấn "Câu tiếp theo" khi chưa ghi → hiện lỗi yêu cầu ghi âm
6. Sau câu 7 → hiện `MidAdjustScreen` với 3 lựa chọn
7. Chọn "Giữ nguyên" → tiếp tục câu 8
8. Sau câu 15 → nút "Nộp bài & Xem kết quả"

---

### 3.3 Result Page

1. URL: `/opic/{sessionId}/result`
2. Nếu chưa finalize → hiển thị thông báo "đang chấm"
3. Sau khi finalize → hiện level badge (NH–AL), overall score, skill bars
4. Skill mạnh nhất → màu xanh lá; yếu nhất → đỏ
5. Lời khuyên cải thiện hiển thị đúng kỹ năng yếu

---

### 3.4 History Page

1. URL: `/opic/history`
2. Danh sách sessions với trạng thái (hoàn thành / đang làm)
3. Session hoàn thành → nút "Xem kết quả"
4. Session chưa xong → nút "Tiếp tục"
5. Nút "+ Thi mới" redirect về `/opic/survey`

---

## 4. Kiểm tra Database

```sql
-- Kết nối: psql -h localhost -U postgres -d mls
SET search_path TO tenant_demo;

-- Kiểm tra các bảng OPIC đã tạo
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'tenant_demo' AND table_name LIKE 'OPIC%';

-- Xem sessions
SELECT id, "UserId", "SessionState", "ChosenDifficulty", "IsCompleted", "StartedAt"
FROM "OPICSessions" ORDER BY "StartedAt" DESC LIMIT 10;

-- Xem surveys
SELECT id, "UserId", "SelectedTopics", "ChosenDifficulty" FROM "OPICTopicSurveys";

-- Kiểm tra AudioPlayLimit column đã thêm
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'tenant_demo' AND table_name = 'Questions'
  AND column_name = 'AudioPlayLimit';

-- Kiểm tra ExamMeta column đã thêm
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'tenant_demo' AND table_name = 'QuizAttempts'
  AND column_name = 'ExamMeta';
```

---

## 7. Teacher Portal (Phase 3.2)

> Đăng nhập: `teacher01@demo.com / Test@123`

### 7.1 Sidebar mở rộng

1. Mở `http://localhost:3000/teacher`
2. Sidebar bên trái hiển thị 3 nhóm nav:
   - **Quiz & Câu hỏi**: Quản lý Quiz, Ngân hàng câu hỏi, Kiểm tra xếp lớp, Realtime Quiz
   - **Khóa học**: Khóa học của tôi
   - **OPIC**: Phân tích, Học viên, Script mẫu
3. Trang hiện tại highlight màu xanh navy

---

### 7.2 Khóa học của tôi (`/teacher/courses`)

1. Mở `http://localhost:3000/teacher/courses`
2. Kết quả mong đợi: Grid các khóa học được tạo bởi teacher01
3. Mỗi card hiển thị: thumbnail, status badge, level badge, số module, số học viên, giá
4. Nút **Chỉnh sửa** → redirect đến `/admin/courses/{id}`
5. Nút **Xem** (nếu có slug) → mở tab mới `/courses/{slug}`
6. Nút **+ Tạo khóa học mới** → `/admin/courses/new`
7. Ô tìm kiếm lọc realtime theo tên

API Backend:
```http
GET http://localhost:5009/api/v1/teacher/portal/courses
Authorization: Bearer {teacher_token}
X-Tenant-Slug: demo
```

---

### 7.3 OPIC Analytics (`/teacher/opic`)

1. Mở `http://localhost:3000/teacher/opic`
2. Stat cards: Tổng phiên thi, Đã hoàn thành, Tỷ lệ %, Điểm TB, Level phổ biến
3. Biểu đồ ngang **Phân bố cấp độ** (NH → AL) với số lượng mỗi cột
4. **Điểm kỹ năng trung bình**: 5 skill bars (Phát âm, Lưu loát, Mạch lạc, Từ vựng, Nhiệm vụ)
5. Nút "Xem học viên →" → `/teacher/opic/students`

API Backend:
```http
GET http://localhost:5009/api/v1/teacher/opic/analytics
Authorization: Bearer {teacher_token}
X-Tenant-Slug: demo
```

---

### 7.4 Kết quả học viên OPIC (`/teacher/opic/students`)

1. Mở `http://localhost:3000/teacher/opic/students`
2. Bảng hiển thị: Học viên, Level badge (màu theo cấp), Tổng điểm, 5 mini skill bars, Ngôn ngữ, Ngày thi
3. Filter theo Level: chọn "IM2" → chỉ hiện học viên level IM2
4. Phân trang ở cuối trang (nếu > 20 kết quả)
5. Hover mini skill bar → tooltip hiện điểm số

API Backend:
```http
GET http://localhost:5009/api/v1/teacher/opic/students?page=1&pageSize=20
Authorization: Bearer {teacher_token}
X-Tenant-Slug: demo
```

---

### 7.5 Script mẫu OPIC (`/teacher/opic/scripts`)

1. Mở `http://localhost:3000/teacher/opic/scripts`
2. Danh sách script cards với: Loại combo, Chủ đề, Target level, Ngôn ngữ, trạng thái Published/Draft
3. Click mũi tên ▼ trên card → mở rộng hiển thị Opening/Body/Closing template
4. Filter theo chủ đề hoặc ngôn ngữ
5. Nút **+ Thêm script** → `/teacher/opic/scripts/new`

API Backend:
```http
GET http://localhost:5009/api/v1/opic/teacher/scripts
Authorization: Bearer {teacher_token}
X-Tenant-Slug: demo
```

---

### 7.6 Tạo script mới (`/teacher/opic/scripts/new`)

1. Mở `http://localhost:3000/teacher/opic/scripts/new`
2. Điền form:
   - Chủ đề: "home"
   - Loại combo: "Miêu tả (Describe)"
   - Cấp độ: "IM2"
   - Ngôn ngữ: Tiếng Việt
   - Mở đầu: "Hôm nay tôi muốn nói về ngôi nhà của mình..."
   - Thân bài: "Ngôi nhà tôi có 3 phòng ngủ..."
   - Kết thúc: "Tóm lại, đây là ngôi nhà tôi yêu thích..."
3. Nhấn **Tạo script** → redirect về `/teacher/opic/scripts`
4. Script vừa tạo xuất hiện trong danh sách
5. Validation: bỏ trống Mở đầu → hiện lỗi "Vui lòng nhập script mở đầu."

API Backend:
```http
POST http://localhost:5009/api/v1/opic/teacher/scripts
Authorization: Bearer {teacher_token}
X-Tenant-Slug: demo
Content-Type: application/json

{
  "topicCategory": "home",
  "comboType": "describe",
  "targetLevel": "IM2",
  "language": "vi",
  "openingTemplate": "Hôm nay tôi muốn nói về ngôi nhà...",
  "bodyTemplate": "Ngôi nhà tôi có 3 phòng ngủ...",
  "closingTemplate": "Tóm lại..."
}
```

---

### 7.7 OPIC tab trong quiz editor (`/teacher/quizzes/{id}`)

1. Mở `/teacher/quizzes` → tìm quiz có loại **OPICMockTest** hoặc **OPICMiniTest**
2. Click **Sửa** → mở `/teacher/quizzes/{id}`
3. Tab **⚙ Cài đặt OPIC** xuất hiện (KHÔNG hiện với quiz Placement/Chapter/...)
4. Stat cards: Tổng câu, Có audio, Đã gắn loại
5. Questions grouped by examModeTag (describe / routine / experience / roleplay / question-asking)
6. Click nút **Cài đặt** bên phải câu → modal OPIC:
   - Chọn loại câu (ExamModeTag)
   - Nhập URL audio MP3
   - Thời gian trả lời (giây)
   - Số lần phát audio
7. Nhấn **Lưu cài đặt** → badge cập nhật ngay trên tab "Câu hỏi"

---

### 7.8 Kiểm tra OPIC fields trong DB

```sql
SET search_path TO tenant_demo;

-- Kiểm tra SpeakingTimeLimitSec và ExamModeTag đã được lưu
SELECT id, "Content", "AudioUrl", "SpeakingTimeLimitSec", "ExamModeTag", "AudioPlayLimit"
FROM "Questions"
WHERE "ExamModeTag" IS NOT NULL
LIMIT 10;
```

---


Các case cần verify:

| Input Scores (Pron/Flu/Coh/Voc/Task) | Difficulty | Expected Level |
|--------------------------------------|------------|----------------|
| 95, 92, 90, 95, 88 | 5 | AL |
| 80, 82, 78, 80, 75 | 5 | IH |
| 65, 70, 68, 62, 60 | 5 | IM3 |
| 50, 55, 52, 48, 45 | 3 | IM2 |
| 85, 88, 90, 85, 80 | 2 | IM2 (capped) |
| 25, 28, 22, 20, 18 | 1 | NH |

**Công thức:** `overall = Pron×0.20 + Flu×0.25 + Coh×0.25 + Voc×0.20 + Task×0.10`

---

## 6. Các lỗi thường gặp & cách fix

| Lỗi | Nguyên nhân | Fix |
|-----|-------------|-----|
| `401 Unauthorized` | Token hết hạn | Đăng nhập lại, lấy token mới |
| `404` khi GET survey | Chưa POST survey lần nào | POST survey trước |
| `500` khi finalize | Chưa có SpeakingSubmission nào "Done" | Dùng test data hoặc skip finalize |
| Microphone error | Chưa cấp quyền browser | Settings → Site permissions → Allow |
| Session không load | sessionId sai trong URL | Kiểm tra UUID từ CreateSession response |
| `MidAdjust` 400 | choice không đúng | Chỉ dùng `"easier"/"same"/"harder"` |

---

## 8. Kịch Bản Giả Lập Hoàn Chỉnh — OPIC Tiếng Việt (Audio)

> **Chủ đề:** Học tiếng Việt  
> **Loại quiz:** `OPICMockTest` (15 câu, 2 phiên, mid-adjust giữa câu 7 và 8)  
> **Định dạng:** Câu hỏi dạng audio — người thi nghe câu hỏi qua loa, sau đó nói câu trả lời  
> **Actors:** `teacher01@demo.com` (thiết lập) · `student@demo.com` (thi thử)

---

### Tổng quan luồng

```
[Teacher] Tạo Quiz → Tạo 15 câu hỏi audio → Gắn câu vào quiz → Tạo Script mẫu
     ↓
[Student] Survey (chọn chủ đề + level) → Tạo Session → Phiên 1 (câu 1–7)
     ↓
[Student] Mid-Adjust (chọn mức độ tiếp tục) → Phiên 2 (câu 8–15) → Nộp bài
     ↓
[System]  Finalize → Tính điểm → Level badge
     ↓
[Teacher] Xem analytics · kết quả học viên
```

---

### Bước 0 — Lấy token

```powershell
# Token teacher
$tBody = '{"email":"teacher01@demo.com","password":"Test@123"}'
$tRes  = Invoke-RestMethod -Method POST `
    -Uri "http://localhost:5009/api/v1/auth/login" `
    -Body $tBody -ContentType "application/json" `
    -Headers @{"X-Tenant-Slug"="demo"}
$T = $tRes.token   # dùng biến $T cho toàn bộ bước Teacher

# Token student
$sBody = '{"email":"student@demo.com","password":"Test@123"}'
$sRes  = Invoke-RestMethod -Method POST `
    -Uri "http://localhost:5009/api/v1/auth/login" `
    -Body $sBody -ContentType "application/json" `
    -Headers @{"X-Tenant-Slug"="demo"}
$S = $sRes.token   # dùng biến $S cho toàn bộ bước Student
```

---

### Bước 1 — Teacher: Tạo quiz OPICMockTest

```http
POST http://localhost:5009/api/v1/teacher/quizzes
Authorization: Bearer {T}
X-Tenant-Slug: demo
Content-Type: application/json

{
  "title": "OPIC Mock Test — Chủ đề Học Tiếng Việt",
  "description": "Bài thi thử OPIC 15 câu, định dạng audio, chủ đề kể về hành trình học tiếng Việt.",
  "quizType": "OPICMockTest",
  "examMode": "OPIC",
  "difficultyLevel": 3,
  "timeLimitMinutes": 40,
  "passingScore": 60,
  "isPublished": false
}
```

```powershell
$quizBody = @{
    title            = "OPIC Mock Test — Chủ đề Học Tiếng Việt"
    description      = "Bài thi thử OPIC 15 câu, định dạng audio, chủ đề học tiếng Việt"
    quizType         = "OPICMockTest"
    examMode         = "OPIC"
    difficultyLevel  = 3
    timeLimitMinutes = 40
    passingScore     = 60
    isPublished      = $false
} | ConvertTo-Json
$quiz = Invoke-RestMethod -Method POST `
    -Uri "http://localhost:5009/api/v1/teacher/quizzes" `
    -Body $quizBody -ContentType "application/json" `
    -Headers @{"Authorization"="Bearer $T"; "X-Tenant-Slug"="demo"}
$QUIZ_ID = $quiz.id
Write-Output "Quiz ID: $QUIZ_ID"
```

**Kết quả mong đợi:** `201 Created` với `id` (UUID) của quiz mới.

---

### Bước 2 — Teacher: Tạo 15 câu hỏi audio

Mỗi câu hỏi có:
- `questionType = "Speaking"` — định dạng nói
- `audioUrl` — file MP3 câu hỏi (người thi nghe)
- `speakingTimeLimitSec` — thời gian tối đa để trả lời (giây)
- `audioPlayLimit` — số lần được nghe lại câu hỏi
- `examModeTag` — phân loại theo loại combo OPIC

#### Bảng 15 câu hỏi — chủ đề Học Tiếng Việt

| # | ExamModeTag | Nội dung câu hỏi (nghe qua audio) | SpeakingTime | AudioPlayLimit |
|---|-------------|-----------------------------------|-------------|----------------|
| 1 | `orientation` | Hãy tự giới thiệu bản thân và cho biết bạn bắt đầu học tiếng Việt từ khi nào? | 60 | 2 |
| 2 | `describe` | Mô tả một buổi học tiếng Việt điển hình của bạn — bạn học ở đâu và học như thế nào? | 90 | 2 |
| 3 | `describe` | Hãy miêu tả người thầy hoặc cô giáo dạy tiếng Việt mà bạn nhớ nhất. | 90 | 2 |
| 4 | `routine` | Mỗi ngày bạn thường dành bao nhiêu thời gian cho việc luyện tiếng Việt? Bạn có thói quen học như thế nào? | 90 | 2 |
| 5 | `routine` | Bạn thường sử dụng tài liệu hoặc ứng dụng nào để học tiếng Việt? Kể chi tiết về thói quen đó. | 90 | 2 |
| 6 | `experience` | Kể về một lần bạn gặp khó khăn khi học tiếng Việt và bạn đã vượt qua như thế nào? | 120 | 2 |
| 7 | `experience` | Hãy kể lại lần đầu tiên bạn nói chuyện với người Việt Nam bằng tiếng Việt. Bạn cảm thấy thế nào? | 120 | 2 |
| *(Mid-Adjust)* | — | Người thi chọn mức độ tiếp tục: dễ hơn / giữ nguyên / khó hơn | — | — |
| 8 | `question-asking` | Bạn muốn hỏi tôi 3 câu hỏi về cách người Việt Nam học ngoại ngữ. Hãy đặt câu hỏi. | 90 | 2 |
| 9 | `question-asking` | Hãy hỏi 3 câu về chương trình học tiếng Việt tại trung tâm ngôn ngữ gần nhà bạn. | 90 | 2 |
| 10 | `roleplay` | Bạn đang gọi điện cho trung tâm tiếng Việt để hỏi thông tin đăng ký học. Bắt đầu cuộc gọi. | 120 | 1 |
| 11 | `roleplay` | Bạn và bạn học đang thảo luận về kế hoạch ôn thi OPIC tiếng Việt. Hãy đề xuất kế hoạch. | 120 | 1 |
| 12 | `describe` | Mô tả một quyển sách hoặc tài liệu tiếng Việt bạn thấy hữu ích nhất. | 90 | 2 |
| 13 | `experience` | Kể về một lần bạn đã dùng tiếng Việt trong tình huống thực tế ngoài lớp học. | 120 | 2 |
| 14 | `experience` | Điều gì khiến bạn quyết định tiếp tục học tiếng Việt đến nay? Kể câu chuyện cụ thể. | 120 | 2 |
| 15 | `routine` | Bạn có kế hoạch gì để nâng cao tiếng Việt trong 6 tháng tới? Trình bày chi tiết. | 90 | 2 |

#### Script PowerShell tạo câu hỏi

```powershell
$audioBase = "https://storage.mls-demo.com/opic/vi/hoc-tieng-viet"

$questions = @(
  @{ idx=1;  tag="orientation";    sec=60;  lim=2; text="Hãy tự giới thiệu bản thân và cho biết bạn bắt đầu học tiếng Việt từ khi nào?" },
  @{ idx=2;  tag="describe";       sec=90;  lim=2; text="Mô tả một buổi học tiếng Việt điển hình của bạn — bạn học ở đâu và học như thế nào?" },
  @{ idx=3;  tag="describe";       sec=90;  lim=2; text="Hãy miêu tả người thầy hoặc cô giáo dạy tiếng Việt mà bạn nhớ nhất." },
  @{ idx=4;  tag="routine";        sec=90;  lim=2; text="Mỗi ngày bạn thường dành bao nhiêu thời gian cho việc luyện tiếng Việt? Bạn có thói quen học như thế nào?" },
  @{ idx=5;  tag="routine";        sec=90;  lim=2; text="Bạn thường sử dụng tài liệu hoặc ứng dụng nào để học tiếng Việt? Kể chi tiết về thói quen đó." },
  @{ idx=6;  tag="experience";     sec=120; lim=2; text="Kể về một lần bạn gặp khó khăn khi học tiếng Việt và bạn đã vượt qua như thế nào?" },
  @{ idx=7;  tag="experience";     sec=120; lim=2; text="Hãy kể lại lần đầu tiên bạn nói chuyện với người Việt Nam bằng tiếng Việt. Bạn cảm thấy thế nào?" },
  @{ idx=8;  tag="question-asking";sec=90;  lim=2; text="Bạn muốn hỏi tôi 3 câu hỏi về cách người Việt Nam học ngoại ngữ. Hãy đặt câu hỏi." },
  @{ idx=9;  tag="question-asking";sec=90;  lim=2; text="Hãy hỏi 3 câu về chương trình học tiếng Việt tại trung tâm ngôn ngữ gần nhà bạn." },
  @{ idx=10; tag="roleplay";       sec=120; lim=1; text="Bạn đang gọi điện cho trung tâm tiếng Việt để hỏi thông tin đăng ký học. Bắt đầu cuộc gọi." },
  @{ idx=11; tag="roleplay";       sec=120; lim=1; text="Bạn và bạn học đang thảo luận về kế hoạch ôn thi OPIC tiếng Việt. Hãy đề xuất kế hoạch." },
  @{ idx=12; tag="describe";       sec=90;  lim=2; text="Mô tả một quyển sách hoặc tài liệu tiếng Việt bạn thấy hữu ích nhất." },
  @{ idx=13; tag="experience";     sec=120; lim=2; text="Kể về một lần bạn đã dùng tiếng Việt trong tình huống thực tế ngoài lớp học." },
  @{ idx=14; tag="experience";     sec=120; lim=2; text="Điều gì khiến bạn quyết định tiếp tục học tiếng Việt đến nay? Kể câu chuyện cụ thể." },
  @{ idx=15; tag="routine";        sec=90;  lim=2; text="Bạn có kế hoạch gì để nâng cao tiếng Việt trong 6 tháng tới? Trình bày chi tiết." }
)

$Q_IDS = @()
foreach ($q in $questions) {
    $body = @{
        content              = $q.text
        questionType         = "Speaking"
        difficultyLevel      = 3
        skill                = "Speaking"
        audioUrl             = "$audioBase/q$($q.idx).mp3"
        speakingTimeLimitSec = $q.sec
        audioPlayLimit       = $q.lim
        examModeTag          = $q.tag
        language             = "vi"
        tags                 = @("OPIC", "tieng-viet", $q.tag)
    } | ConvertTo-Json
    $res = Invoke-RestMethod -Method POST `
        -Uri "http://localhost:5009/api/v1/teacher/questions" `
        -Body $body -ContentType "application/json" `
        -Headers @{"Authorization"="Bearer $T"; "X-Tenant-Slug"="demo"}
    $Q_IDS += $res.id
    Write-Output "Created Q$($q.idx): $($res.id) [$($q.tag)]"
}
Write-Output "`nTổng câu hỏi đã tạo: $($Q_IDS.Count)"
```

**Kết quả mong đợi:** 15 dòng `Created Q1..Q15` với UUID, mỗi câu có `examModeTag`, `audioUrl` và `speakingTimeLimitSec` hợp lệ.

---

### Bước 3 — Teacher: Gắn câu hỏi vào quiz

```powershell
# Gắn tất cả 15 câu hỏi vào quiz (theo thứ tự)
for ($i = 0; $i -lt $Q_IDS.Count; $i++) {
    $body = @{
        questionId = $Q_IDS[$i]
        order      = $i + 1
    } | ConvertTo-Json
    $res = Invoke-RestMethod -Method POST `
        -Uri "http://localhost:5009/api/v1/teacher/quizzes/$QUIZ_ID/questions" `
        -Body $body -ContentType "application/json" `
        -Headers @{"Authorization"="Bearer $T"; "X-Tenant-Slug"="demo"}
    Write-Output "Added Q$($i+1) to quiz — order $($i+1)"
}
```

**Kiểm tra lại quiz:**
```http
GET http://localhost:5009/api/v1/teacher/quizzes/{QUIZ_ID}
Authorization: Bearer {T}
X-Tenant-Slug: demo
```

**Kết quả mong đợi:** `questionCount: 15`, danh sách câu hỏi đầy đủ với `examModeTag` và `audioUrl`.

---

### Bước 4 — Teacher: Tạo Script mẫu OPIC cho chủ đề Học Tiếng Việt

Tạo 3 script cho 3 loại combo phổ biến nhất trong bài thi này:

#### Script 1 — Describe (Mô tả)

```http
POST http://localhost:5009/api/v1/opic/teacher/scripts
Authorization: Bearer {T}
X-Tenant-Slug: demo
Content-Type: application/json

{
  "topicCategory": "education",
  "comboType": "describe",
  "targetLevel": "IM2",
  "language": "vi",
  "openingTemplate": "Tôi muốn kể về [đối tượng mô tả]. Đây là [mô tả tổng quan ngắn].",
  "bodyTemplate": "Về [đặc điểm 1], tôi nhận thấy [chi tiết]. Ngoài ra, [đặc điểm 2] cũng rất [tính từ]. Điều tôi thấy ấn tượng nhất là [chi tiết nổi bật].",
  "closingTemplate": "Tóm lại, [đối tượng] đã [tác động đến bạn như thế nào]. Tôi nghĩ [nhận xét cá nhân].",
  "isPublished": true
}
```

#### Script 2 — Routine (Thói quen)

```http
POST http://localhost:5009/api/v1/opic/teacher/scripts
Authorization: Bearer {T}
X-Tenant-Slug: demo
Content-Type: application/json

{
  "topicCategory": "education",
  "comboType": "routine",
  "targetLevel": "IM2",
  "language": "vi",
  "openingTemplate": "Thông thường, tôi [thói quen chính] vào [thời điểm trong ngày]. Đây là lịch trình của tôi.",
  "bodyTemplate": "Buổi sáng, tôi thường [hoạt động 1] trong khoảng [thời gian]. Sau đó tôi [hoạt động 2]. Cuối ngày, tôi [hoạt động 3] để [mục đích].",
  "closingTemplate": "Thói quen này giúp tôi [lợi ích]. Tôi đã duy trì nó được [khoảng thời gian] và thấy [kết quả].",
  "isPublished": true
}
```

#### Script 3 — Experience (Trải nghiệm)

```http
POST http://localhost:5009/api/v1/opic/teacher/scripts
Authorization: Bearer {T}
X-Tenant-Slug: demo
Content-Type: application/json

{
  "topicCategory": "education",
  "comboType": "experience",
  "targetLevel": "IH",
  "language": "vi",
  "openingTemplate": "Tôi nhớ rõ lần [sự kiện] đó. Đó là vào [thời gian/địa điểm].",
  "bodyTemplate": "Lúc đầu, tôi cảm thấy [cảm xúc ban đầu] vì [lý do]. Nhưng sau đó [diễn biến]. Điều khó khăn nhất là [thử thách]. Tôi đã xử lý bằng cách [hành động].",
  "closingTemplate": "Sau trải nghiệm đó, tôi học được [bài học]. Điều này đã [ảnh hưởng] đến cách tôi [kết quả lâu dài].",
  "isPublished": true
}
```

```powershell
# Script PowerShell tạo cả 3 script
$scripts = @(
  @{
    topicCategory    = "education"; comboType = "describe"; targetLevel = "IM2"; language = "vi"
    openingTemplate  = "Tôi muốn kể về [đối tượng mô tả]. Đây là [mô tả tổng quan ngắn]."
    bodyTemplate     = "Về [đặc điểm 1], tôi nhận thấy [chi tiết]. Ngoài ra, [đặc điểm 2] cũng rất [tính từ]. Điều tôi thấy ấn tượng nhất là [chi tiết nổi bật]."
    closingTemplate  = "Tóm lại, [đối tượng] đã [tác động]. Tôi nghĩ [nhận xét cá nhân]."
    isPublished      = $true
  },
  @{
    topicCategory    = "education"; comboType = "routine"; targetLevel = "IM2"; language = "vi"
    openingTemplate  = "Thông thường, tôi [thói quen chính] vào [thời điểm]. Đây là lịch trình của tôi."
    bodyTemplate     = "Buổi sáng tôi thường [hoạt động 1]. Sau đó tôi [hoạt động 2]. Cuối ngày, tôi [hoạt động 3] để [mục đích]."
    closingTemplate  = "Thói quen này giúp tôi [lợi ích] và tôi đã duy trì được [khoảng thời gian]."
    isPublished      = $true
  },
  @{
    topicCategory    = "education"; comboType = "experience"; targetLevel = "IH"; language = "vi"
    openingTemplate  = "Tôi nhớ rõ lần [sự kiện] đó. Đó là vào [thời gian/địa điểm]."
    bodyTemplate     = "Lúc đầu tôi cảm thấy [cảm xúc] vì [lý do]. Nhưng sau đó [diễn biến]. Điều khó nhất là [thử thách] và tôi xử lý bằng [hành động]."
    closingTemplate  = "Sau đó, tôi học được [bài học] và điều này đã [ảnh hưởng lâu dài]."
    isPublished      = $true
  }
)
foreach ($sc in $scripts) {
    $res = Invoke-RestMethod -Method POST `
        -Uri "http://localhost:5009/api/v1/opic/teacher/scripts" `
        -Body ($sc | ConvertTo-Json) -ContentType "application/json" `
        -Headers @{"Authorization"="Bearer $T"; "X-Tenant-Slug"="demo"}
    Write-Output "Script created: $($sc.comboType) [$($sc.targetLevel)] — ID: $($res.id)"
}
```

---

### Bước 5 — Teacher: Publish quiz

```http
PUT http://localhost:5009/api/v1/teacher/quizzes/{QUIZ_ID}
Authorization: Bearer {T}
X-Tenant-Slug: demo
Content-Type: application/json

{ "isPublished": true }
```

```powershell
Invoke-RestMethod -Method PUT `
    -Uri "http://localhost:5009/api/v1/teacher/quizzes/$QUIZ_ID" `
    -Body '{"isPublished":true}' -ContentType "application/json" `
    -Headers @{"Authorization"="Bearer $T"; "X-Tenant-Slug"="demo"}
```

---

### Bước 6 — Student: Làm Survey

```powershell
$surveyBody = @{
    selectedTopics  = @("education", "daily-life", "hobbies", "travel", "work")
    targetLevel     = "IM2"
    chosenDifficulty = 3
    language        = "vi"
} | ConvertTo-Json

$survey = Invoke-RestMethod -Method POST `
    -Uri "http://localhost:5009/api/v1/opic/survey" `
    -Body $surveyBody -ContentType "application/json" `
    -Headers @{"Authorization"="Bearer $S"; "X-Tenant-Slug"="demo"}
$SURVEY_ID = $survey.id
Write-Output "Survey ID: $SURVEY_ID"
```

**Kết quả mong đợi:**
```json
{
  "id": "...",
  "selectedTopics": ["education","daily-life","hobbies","travel","work"],
  "targetLevel": "IM2",
  "chosenDifficulty": 3
}
```

---

### Bước 7 — Student: Tạo Session OPIC

```powershell
$sessionBody = @{
    surveyId         = $SURVEY_ID
    chosenDifficulty = 3
    language         = "vi"
} | ConvertTo-Json

$session = Invoke-RestMethod -Method POST `
    -Uri "http://localhost:5009/api/v1/opic/sessions" `
    -Body $sessionBody -ContentType "application/json" `
    -Headers @{"Authorization"="Bearer $S"; "X-Tenant-Slug"="demo"}
$SESSION_ID = $session.id
Write-Output "Session ID: $SESSION_ID  State: $($session.sessionState)"
```

**Kết quả mong đợi:**
```json
{
  "id": "...",
  "sessionState": "Orientation",
  "chosenDifficulty": 3,
  "isCompleted": false,
  "questionsDone": 0
}
```

---

### Bước 8 — Student: Phiên 1 (Câu 1–7) — Ghi âm & Ghi attempt

Trong thực tế, mỗi câu hỏi student nghe audio → nói → upload recording. Trong môi trường test, ta giả lập bằng cách POST `attempt-ref` cho từng câu:

```powershell
# Giả lập 7 câu đầu (Phiên 1: Orientation + Session1)
# Trong thực tế, attemptId là UUID trả về sau khi upload recording
$fakeAttemptIds = @(
    [System.Guid]::NewGuid().ToString(),
    [System.Guid]::NewGuid().ToString(),
    [System.Guid]::NewGuid().ToString(),
    [System.Guid]::NewGuid().ToString(),
    [System.Guid]::NewGuid().ToString(),
    [System.Guid]::NewGuid().ToString(),
    [System.Guid]::NewGuid().ToString()
)

for ($i = 0; $i -lt 7; $i++) {
    $body = @{
        attemptId     = $fakeAttemptIds[$i]
        questionIndex = $i + 1
    } | ConvertTo-Json
    Invoke-RestMethod -Method POST `
        -Uri "http://localhost:5009/api/v1/opic/sessions/$SESSION_ID/attempt-ref" `
        -Body $body -ContentType "application/json" `
        -Headers @{"Authorization"="Bearer $S"; "X-Tenant-Slug"="demo"}
    Write-Output "  Ghi attempt Q$($i+1) — AttemptId: $($fakeAttemptIds[$i])"
    Start-Sleep -Milliseconds 200
}
Write-Output "Xong Phiên 1 (7 câu). Sẵn sàng Mid-Adjust."
```

**Xem trạng thái session sau 7 câu:**
```http
GET http://localhost:5009/api/v1/opic/sessions/{SESSION_ID}
Authorization: Bearer {S}
X-Tenant-Slug: demo
```
**Kết quả mong đợi:** `sessionState: "Session1"`, `questionsDone: 7`, `attemptRefs` có 7 phần tử.

---

### Bước 9 — Student: Mid-Adjust (chuyển sang Phiên 2)

```powershell
# Kịch bản A — giữ nguyên độ khó
$midBody = '{"choice":"same"}'
$midRes = Invoke-RestMethod -Method POST `
    -Uri "http://localhost:5009/api/v1/opic/sessions/$SESSION_ID/mid-adjust" `
    -Body $midBody -ContentType "application/json" `
    -Headers @{"Authorization"="Bearer $S"; "X-Tenant-Slug"="demo"}
Write-Output "MidAdjust done. State: $($midRes.sessionState)  FinalDiff: $($midRes.finalDifficulty)"
```

**Ba kịch bản Mid-Adjust:**

| `choice` | Mô tả | `finalDifficulty` mong đợi |
|----------|-------|---------------------------|
| `"easier"` | Giảm độ khó (phiên 2 dễ hơn) | `chosenDifficulty - 1` (min 1) |
| `"same"` | Giữ nguyên (mặc định) | `chosenDifficulty` (= 3) |
| `"harder"` | Tăng độ khó (phiên 2 khó hơn) | `chosenDifficulty + 1` (max 5) |

**Kết quả mong đợi (`"same"`):**
```json
{
  "sessionState": "Session2",
  "midAdjustChoice": "same",
  "finalDifficulty": 3
}
```

---

### Bước 10 — Student: Phiên 2 (Câu 8–15)

```powershell
# Giả lập 8 câu còn lại (Phiên 2: Session2)
$fakeAttemptIds2 = 1..8 | ForEach-Object { [System.Guid]::NewGuid().ToString() }

for ($i = 0; $i -lt 8; $i++) {
    $body = @{
        attemptId     = $fakeAttemptIds2[$i]
        questionIndex = $i + 8   # câu 8..15
    } | ConvertTo-Json
    Invoke-RestMethod -Method POST `
        -Uri "http://localhost:5009/api/v1/opic/sessions/$SESSION_ID/attempt-ref" `
        -Body $body -ContentType "application/json" `
        -Headers @{"Authorization"="Bearer $S"; "X-Tenant-Slug"="demo"}
    Write-Output "  Ghi attempt Q$($i+8) — AttemptId: $($fakeAttemptIds2[$i])"
    Start-Sleep -Milliseconds 200
}
Write-Output "Xong Phiên 2 (8 câu). Sẵn sàng nộp bài."
```

---

### Bước 11 — Student: Nộp bài & Finalize

```http
POST http://localhost:5009/api/v1/opic/sessions/{SESSION_ID}/finalize
Authorization: Bearer {S}
X-Tenant-Slug: demo
Content-Type: application/json

{}
```

```powershell
$finRes = Invoke-RestMethod -Method POST `
    -Uri "http://localhost:5009/api/v1/opic/sessions/$SESSION_ID/finalize" `
    -Body '{}' -ContentType "application/json" `
    -Headers @{"Authorization"="Bearer $S"; "X-Tenant-Slug"="demo"}
Write-Output "Finalized. IsCompleted: $($finRes.isCompleted)"
```

**Kết quả mong đợi:** `200 OK`, `isCompleted: true`, `sessionState: "Completed"`.

---

### Bước 12 — Student: Xem kết quả

```powershell
# Kết quả session vừa thi
$result = Invoke-RestMethod `
    -Uri "http://localhost:5009/api/v1/opic/results/my-latest?language=vi" `
    -Headers @{"Authorization"="Bearer $S"; "X-Tenant-Slug"="demo"}
Write-Output "Level: $($result.oralProficiencyLevel)"
Write-Output "Overall: $($result.overallScore)"
Write-Output "Pron=$($result.pronunciationScore) Flu=$($result.fluencyScore) Coh=$($result.coherenceScore) Voc=$($result.vocabularyScore) Task=$($result.taskScore)"
```

**Kết quả mong đợi (mẫu):**
```json
{
  "oralProficiencyLevel": "IM2",
  "overallScore": 65.5,
  "pronunciationScore": 68,
  "fluencyScore": 64,
  "coherenceScore": 67,
  "vocabularyScore": 65,
  "taskScore": 60,
  "improvementSuggestions": [
    { "skill": "Task", "suggestion": "Luyện tập trả lời đúng trọng tâm câu hỏi roleplay." }
  ]
}
```

> **Lưu ý:** Nếu hệ thống chưa có AI scoring, `overallScore` có thể là `null` → đây là trạng thái bình thường khi chờ chấm.

---

### Bước 13 — Teacher: Kiểm tra kết quả học viên

```powershell
# Analytics tổng
$analytics = Invoke-RestMethod `
    -Uri "http://localhost:5009/api/v1/teacher/opic/analytics" `
    -Headers @{"Authorization"="Bearer $T"; "X-Tenant-Slug"="demo"}
Write-Output "Tổng phiên: $($analytics.totalSessions)  Hoàn thành: $($analytics.completedSessions)"

# Danh sách học viên
$students = Invoke-RestMethod `
    -Uri "http://localhost:5009/api/v1/teacher/opic/students?page=1&pageSize=20" `
    -Headers @{"Authorization"="Bearer $T"; "X-Tenant-Slug"="demo"}
$students.items | ForEach-Object {
    Write-Output "$($_.studentName) — Level: $($_.level)  Score: $($_.overallScore)"
}
```

---

### Bước 14 — Kiểm tra Database

```sql
SET search_path TO tenant_demo;

-- 1. Xem quiz vừa tạo
SELECT id, "Title", "QuizType", "ExamMode", "QuestionCount", "IsPublished"
FROM "Quizzes"
WHERE "Title" LIKE '%Học Tiếng Việt%';

-- 2. Xem 15 câu hỏi audio của quiz
SELECT q.id,
       q."Content",
       q."ExamModeTag",
       q."AudioUrl",
       q."SpeakingTimeLimitSec",
       q."AudioPlayLimit"
FROM "Questions" q
JOIN "QuizQuestions" qq ON qq."QuestionId" = q.id
JOIN "Quizzes"      qz ON qq."QuizId"     = qz.id
WHERE qz."Title" LIKE '%Học Tiếng Việt%'
ORDER BY qq."Order";

-- 3. Xem session của student vừa thi
SELECT s.id,
       s."SessionState",
       s."ChosenDifficulty",
       s."MidAdjustChoice",
       s."FinalDifficulty",
       s."IsCompleted",
       s."StartedAt",
       (SELECT COUNT(*) FROM "OPICAttemptRefs" ar WHERE ar."SessionId" = s.id) AS attempt_count
FROM "OPICSessions" s
ORDER BY s."StartedAt" DESC
LIMIT 5;

-- 4. Kiểm tra attempt refs đủ 15 câu
SELECT "QuestionIndex", "AttemptId", "CreatedAt"
FROM "OPICAttemptRefs"
WHERE "SessionId" = '<SESSION_ID>'
ORDER BY "QuestionIndex";

-- 5. Kiểm tra kết quả (nếu đã finalize)
SELECT "OralProficiencyLevel", "OverallScore",
       "PronunciationScore", "FluencyScore", "CoherenceScore",
       "VocabularyScore", "TaskScore"
FROM "OPICResults"
WHERE "SessionId" = '<SESSION_ID>';

-- 6. Kiểm tra scripts mẫu đã tạo
SELECT id, "TopicCategory", "ComboType", "TargetLevel", "Language", "IsPublished"
FROM "OPICScriptTemplates"
ORDER BY "CreatedAt" DESC
LIMIT 5;
```

---

### Bước 15 — Test Frontend end-to-end

```
1. Mở http://localhost:3000/teacher/quizzes
   → Quiz "OPIC Mock Test — Chủ đề Học Tiếng Việt" xuất hiện với badge "OPICMockTest"
   → Cột "Loại" hiển thị label từ DB (thông qua quizConfigApi)

2. Click "Sửa" → /teacher/quizzes/{QUIZ_ID}
   → Tab "Câu hỏi" hiển thị 15 câu, mỗi câu có icon 🔊 (audio), badge loại combo
   → Tab "⚙ Cài đặt OPIC" hiển thị stat: 15 câu / 15 có audio / phân bố theo tag

3. Mở http://localhost:3000/opic/survey (đăng nhập bằng student@demo.com)
   → Chọn 5 chủ đề bao gồm "Giáo dục"
   → Chọn Target Level "IM2", Độ khó 3
   → Nhấn "Bắt đầu" → redirect /opic/{SESSION_ID}/play

4. Trang Play:
   → Câu 1/15: Nghe câu hỏi audio (nút ▶ Play — giới hạn 2 lần)
   → Nhấn "Bắt đầu ghi âm" → ghi âm → nhấn "Dừng"
   → Preview audio ghi âm → nhấn "Câu tiếp theo"
   → Lặp đến câu 7 → hiện màn hình Mid-Adjust
   → Chọn "Giữ nguyên" → tiếp câu 8..15
   → Câu 15 xong → nút "Nộp bài & Xem kết quả"

5. Trang Result /opic/{SESSION_ID}/result:
   → Level badge màu (IM2 = cam, IH = xanh lam, AL = xanh lá)
   → 5 skill bars với điểm số
   → Phần "Gợi ý cải thiện" cho kỹ năng yếu nhất
   → Nút "Thi lại" → /opic/survey

6. Mở http://localhost:3000/teacher/opic
   → Stat card "Tổng phiên" tăng thêm 1
   → Level phổ biến cập nhật

7. Mở http://localhost:3000/teacher/config
   → Section "Loại Quiz" hiển thị OPICMockTest và OPICMiniTest với label đúng tiếng Việt
   → Có thể Sửa label trực tiếp qua UI → lưu vào DB
```

---

### Checklist kịch bản

| # | Bước | Endpoint | Expected | ✓ |
|---|------|----------|----------|---|
| 1 | Tạo quiz OPICMockTest | `POST /teacher/quizzes` | 201, quiz.id | □ |
| 2 | Tạo 15 câu hỏi audio | `POST /teacher/questions` ×15 | 15 UUID, có audioUrl | □ |
| 3 | Gắn câu vào quiz | `POST /teacher/quizzes/{id}/questions` ×15 | 204/200 ×15 | □ |
| 4 | Tạo 3 script mẫu | `POST /opic/teacher/scripts` ×3 | 3 script.id | □ |
| 5 | Publish quiz | `PUT /teacher/quizzes/{id}` | isPublished=true | □ |
| 6 | Student làm survey | `POST /opic/survey` | survey.id | □ |
| 7 | Tạo session | `POST /opic/sessions` | sessionState=Orientation | □ |
| 8 | Ghi 7 attempt-ref (Phiên 1) | `POST /opic/sessions/{id}/attempt-ref` ×7 | 204 ×7 | □ |
| 9 | Mid-Adjust "same" | `POST /opic/sessions/{id}/mid-adjust` | state=Session2 | □ |
| 10 | Ghi 8 attempt-ref (Phiên 2) | `POST /opic/sessions/{id}/attempt-ref` ×8 | 204 ×8 | □ |
| 11 | Finalize | `POST /opic/sessions/{id}/finalize` | isCompleted=true | □ |
| 12 | Xem kết quả | `GET /opic/results/my-latest` | level, scores | □ |
| 13 | Teacher xem analytics | `GET /teacher/opic/analytics` | totalSessions++ | □ |
| 14 | DB verify 15 câu hỏi | SQL SELECT + JOIN | 15 rows với audioUrl | □ |
| 15 | Frontend play page | Browser `/opic/{id}/play` | Audio player, mic, mid-adjust | □ |
