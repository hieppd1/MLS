# REVIEW — Phase 3 Quiz Engine + AI Learning Platform
# `phase3_quiz_design.md`

> **Stack:** .NET 10 · MediatR · EF Core · PostgreSQL · Redis · RabbitMQ · Next.js 16 · RTK Query  
> **Reviewer:** Senior Architect Review  
> **Ngày review:** 2026-05-22  
> **Trạng thái dự án:** Sprint 1–2 done ✅ · Sprint 3 partial 🟡 · Sprint 4–10 chưa bắt đầu 🔴

---

## MỤC LỤC

| # | Phần | Mức độ |
|---|------|--------|
| 1 | [Đánh giá tổng thể](#1-đánh-giá-tổng-thể) | — |
| 2 | [Domain Model & Entities](#2-domain-model--entities) | 🔴🟡 |
| 3 | [Database Schema](#3-database-schema) | 🔴🟡 |
| 4 | [API Endpoints](#4-api-endpoints) | 🟡🟢 |
| 5 | [Backend CQRS & Services](#5-backend-cqrs--services) | 🔴🟡 |
| 6 | [Grading Engine](#6-grading-engine) | 🟡 |
| 7 | [Speaking AI Pipeline](#7-speaking-ai-pipeline) | 🔴🟡 |
| 8 | [Writing AI Pipeline](#8-writing-ai-pipeline) | 🟡 |
| 9 | [Adaptive Learning Engine](#9-adaptive-learning-engine) | 🟡 |
| 10 | [Realtime Quiz Engine](#10-realtime-quiz-engine) | 🔴🟡 |
| 11 | [Event-Driven Architecture](#11-event-driven-architecture) | 🟡🟢 |
| 12 | [Security & Anti-Cheat](#12-security--anti-cheat) | 🟡 |
| 13 | [Frontend Pages & Components](#13-frontend-pages--components) | 🟡🟢 |
| 14 | [Luồng nghiệp vụ](#14-luồng-nghiệp-vụ) | 🔴🟡 |
| 15 | [Storage Design](#15-storage-design) | 🟢 |
| 16 | [Roadmap & Task List](#16-roadmap--task-list) | 🟡 |
| 17 | [Tổng hợp Issues theo độ ưu tiên](#17-tổng-hợp-issues-theo-độ-ưu-tiên) | — |

---

## 1. ĐÁNH GIÁ TỔNG THỂ

### Điểm mạnh

Đây là tài liệu thiết kế đạt chất lượng **production-level** — có chiều sâu kỹ thuật thực sự, không phải bản prototype. Cụ thể:

- **Tracking thực tế:** Task list có checkbox cập nhật liên tục theo tiến độ thật — đây là tài liệu sống.
- **Domain model nhất quán:** Enums đầy đủ, FK đúng chỗ, navigation properties hợp lý.
- **Grading logic cụ thể:** MultipleChoice partial score, FillBlank Levenshtein fuzzy — sẵn sàng implement ngay.
- **AI Pipeline chi tiết:** 7 bước speaking, 7 bước writing với tool cụ thể (Whisper, LanguageTool, GPT-4o).
- **Event-Driven với DLQ:** Có Dead Letter Queue, retry 3 lần, alert mechanism — production-ready thinking.
- **Security layer đầy đủ:** Anti-cheat matrix, API ownership rules, rate limiting.

### Điểm yếu tổng thể

- Một số **string field được dùng làm JSONB** mà không có EF config tương ứng → sẽ gây lỗi runtime.
- **Timer enforcement** phía server còn thiếu field `ExpiresAt`.
- **Polling** cho AI grading không phù hợp khi đã có SignalR trong stack.
- Một số **công thức scoring** có thể cho kết quả âm hoặc không fair.
- **Redis EXPIRE wildcard** sai cú pháp.

### Bảng điểm tổng thể

| Hạng mục | Điểm | Ghi chú |
|----------|------|---------|
| Độ hoàn thiện tài liệu | ★★★★★ | Tốt nhất trong class |
| Domain Model | ★★★★☆ | Cần sửa JSONB mapping + ExpiresAt |
| Database Schema | ★★★★☆ | Thiếu một số index quan trọng |
| API Design | ★★★★☆ | Thiếu versioning prefix nhất quán |
| Grading Engine | ★★★★☆ | Thiếu Matching/Ordering logic |
| AI Pipeline | ★★★★☆ | Formula có thể cho giá trị âm |
| Realtime Quiz | ★★★★☆ | Redis EXPIRE sai syntax |
| Security | ★★★★★ | Đầy đủ và thực tế |
| Frontend Design | ★★★★☆ | Thiếu error boundary spec |
| Roadmap | ★★★★☆ | Effort estimate hơi thấp |

---

## 2. DOMAIN MODEL & ENTITIES

### 2.1 ❌ JSONB fields khai báo là `string?` trong C# — EF Core sẽ map sai

**Vấn đề:** EF Core mặc định map `string` → `text` trong PostgreSQL, không phải `jsonb`. Nếu không config thêm, các field JSONB sẽ không có type-safety và không dùng được PostgreSQL JSONB operators.

**Các field bị ảnh hưởng:**

| Entity | Field | Vấn đề |
|--------|-------|--------|
| `Question` | `Tags` | `string?` nhưng SQL là `JSONB` |
| `QuizAttempt` | `AntiCheatLog` | `string?` nhưng SQL là `JSONB` |
| `AttemptAnswer` | `AnswerValue` | `string?` nhưng SQL là `JSONB` |
| `AttemptAnswer` | `AiFeedback` | `string?` nhưng SQL là `JSONB` |
| `PlacementResult` | `SkillBreakdown` | `string?` nhưng SQL là `JSONB` |
| `PlacementResult` | `RecommendedPath` | `string?` nhưng SQL là `JSONB` |
| `SpeakingSubmission` | `PhonemeAnalysis` | `string?` nhưng SQL là `JSONB` |
| `WritingSubmission` | `GrammarErrors` | `string?` nhưng SQL là `JSONB` |
| `WritingSubmission` | `VocabularyAnalysis` | `string?` nhưng SQL là `JSONB` |

**Sửa — cách 1: EF Config (dùng khi cần JSONB operators phía DB):**
```csharp
// ApplicationDbContext — OnModelCreating
modelBuilder.Entity<Question>()
    .Property(e => e.Tags)
    .HasColumnType("jsonb");

modelBuilder.Entity<AttemptAnswer>()
    .Property(e => e.AnswerValue)
    .HasColumnType("jsonb");

modelBuilder.Entity<AttemptAnswer>()
    .Property(e => e.AiFeedback)
    .HasColumnType("jsonb");
// ... tương tự cho tất cả JSONB fields
```

**Sửa — cách 2: Dùng strongly-typed JSON column (EF Core 8+, khuyến nghị):**
```csharp
// Tạo record riêng cho từng JSONB payload
public record AiFeedbackPayload(
    List<GrammarError> GrammarErrors,
    decimal VocabScore,
    decimal CoherenceScore,
    string Summary
);

// Entity
public AiFeedbackPayload? AiFeedback { get; set; }

// EF config
modelBuilder.Entity<AttemptAnswer>()
    .OwnsOne(e => e.AiFeedback, b => b.ToJson());
```

---

### 2.2 ❌ `QuizAttempt` thiếu field `ExpiresAt` — server không enforce được timer

**Vấn đề:** `Quiz.Duration` (int giây) có nhưng `QuizAttempt` không lưu thời điểm hết hạn. Khi student submit, server chỉ có `TimeTaken` do client tự report — dễ bị tamper. Tài liệu có ghi "TimeTaken ≤ Duration + 30s grace" nhưng không có field để tính.

**Sửa — thêm vào entity:**
```csharp
public class QuizAttempt : BaseEntity {
    // ... các field hiện có ...
    public DateTime? ExpiresAt { get; set; }  // = StartedAt + Quiz.Duration (giây)
}
```

**Sửa — thêm vào SQL schema:**
```sql
ALTER TABLE "QuizAttempts" ADD COLUMN "ExpiresAt" TIMESTAMPTZ;
```

**Sửa — trong `StartAttempt` command:**
```csharp
var attempt = new QuizAttempt {
    QuizId    = quizId,
    UserId    = userId,
    StartedAt = DateTime.UtcNow,
    ExpiresAt = quiz.Duration.HasValue
        ? DateTime.UtcNow.AddSeconds(quiz.Duration.Value)
        : null
};
```

**Sửa — trong `SubmitAttempt` command:**
```csharp
if (attempt.ExpiresAt.HasValue && DateTime.UtcNow > attempt.ExpiresAt.Value)
    throw new QuizExpiredException("Session đã hết thời gian");
```

---

### 2.3 🟡 `GradingStatus` trong `SpeakingSubmission` và `WritingSubmission` là `string` — nên là enum

**Vấn đề:** `GradingStatus` có các giá trị cố định (`Pending / Processing / Done / Failed`) nhưng khai báo là `string` → dễ typo, không type-safe.

**Sửa:**
```csharp
public enum GradingStatus { Pending, Processing, Done, Failed }

// Trong SpeakingSubmission và WritingSubmission
public GradingStatus GradingStatus { get; set; } = GradingStatus.Pending;
```

---

### 2.4 🟡 `PlacementResult.RecommendedPath` lưu `[courseId]` — mất dữ liệu khi course bị xoá

**Vấn đề:** Nếu course bị archived/deleted sau khi placement result được lưu → frontend query courseId ra null, recommendation bị lỗi.

**Sửa — lưu snapshot metadata tại thời điểm recommend:**
```csharp
// Không lưu bare UUID list
// Lưu object có đủ thông tin để hiển thị ngay cả khi course bị xoá
public record RecommendedCourse(
    Guid CourseId,
    string Title,
    string ThumbnailUrl,
    int Level,
    string SkillType
);

// PlacementResult
public List<RecommendedCourse>? RecommendedPath { get; set; }
```

---

### 2.5 🟢 `RoomParticipant.Score` là `int` — không nhất quán với hệ thống điểm dùng `decimal`

Toàn hệ thống dùng `decimal` cho điểm (Quiz, Attempt, Answer) nhưng `RoomParticipant.Score` là `int`. Realtime quiz dùng điểm 500–1000 theo formula nên `int` ok trong context này — nhưng nên có comment giải thích để tránh nhầm lẫn.

---

## 3. DATABASE SCHEMA

### 3.1 ❌ Thiếu index cho các query phổ biến

**Vấn đề:** Schema hiện có index cơ bản nhưng thiếu một số composite index quan trọng cho performance.

**Sửa — thêm các index:**
```sql
-- Tìm attempt đang InProgress của user (dùng trong StartAttempt idempotency check)
CREATE INDEX idx_attempts_user_state
    ON "QuizAttempts"("UserId", "State")
    WHERE "State" = 'InProgress';

-- Tìm answer của attempt theo question (dùng trong SaveAnswer upsert)
CREATE INDEX idx_answers_attempt_question
    ON "AttemptAnswers"("AttemptId", "QuestionId");

-- Tìm placement result mới nhất của user
CREATE INDEX idx_placement_user_date
    ON "PlacementResults"("UserId", "TestedAt" DESC);

-- Speaking/Writing submissions theo grading status (worker polling)
CREATE INDEX idx_speaking_status
    ON "SpeakingSubmissions"("GradingStatus")
    WHERE "GradingStatus" IN ('Pending', 'Processing');

CREATE INDEX idx_writing_status
    ON "WritingSubmissions"("GradingStatus")
    WHERE "GradingStatus" IN ('Pending', 'Processing');

-- Question Bank search full-text (cho QuestionBankTable filter)
CREATE INDEX idx_questions_content_fts
    ON "Questions" USING gin(to_tsvector('english', "Content"));

-- Leaderboard query cho analytics
CREATE INDEX idx_room_participants_room_score
    ON "RoomParticipants"("RoomId", "Score" DESC);
```

---

### 3.2 ❌ `QuizAttempts` thiếu `ExpiresAt` column

Đã mô tả ở mục 2.2. Cần migration bổ sung.

---

### 3.3 🟡 `QuizQuestions` thiếu unique constraint cho `DisplayOrder`

**Vấn đề:** Không có constraint ngăn 2 câu hỏi cùng `DisplayOrder` trong 1 quiz → ordering bị ambiguous.

**Sửa:**
```sql
-- Partial unique index: DisplayOrder unique trong cùng 1 quiz
CREATE UNIQUE INDEX idx_quiz_questions_order
    ON "QuizQuestions"("QuizId", "DisplayOrder");
```

Lưu ý: khi Reorder, cần update tất cả orders trong transaction, không thể update từng row riêng lẻ.

---

### 3.4 🟡 Thiếu soft delete — `Questions` bị xoá cứng có thể ảnh hưởng historical data

**Vấn đề:** `DELETE /api/questions/{id}` xoá question khỏi DB. Nhưng `AttemptAnswer.QuestionId` FK vào `Questions` → xoá question sẽ lỗi FK constraint (hoặc cascade xoá attempt answers → mất dữ liệu lịch sử).

Schema có `ON DELETE CASCADE` trên `QuizQuestions` nhưng `AttemptAnswers.QuestionId` không có ON DELETE clause.

**Sửa — thêm soft delete:**
```sql
ALTER TABLE "Questions" ADD COLUMN "DeletedAt" TIMESTAMPTZ;
ALTER TABLE "Questions" ADD COLUMN "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE;

-- Tất cả queries thêm WHERE "IsDeleted" = FALSE
```

Hoặc dùng **EF Core Global Query Filter:**
```csharp
modelBuilder.Entity<Question>()
    .HasQueryFilter(q => !q.IsDeleted);
```

---

### 3.5 🟢 `Quizzes.Level` là `INT` không có CHECK constraint

```sql
-- Nên thêm:
ALTER TABLE "Quizzes" ADD CONSTRAINT chk_quiz_level CHECK ("Level" BETWEEN 1 AND 6);
ALTER TABLE "PlacementResults" ADD CONSTRAINT chk_placement_level CHECK ("AssignedLevel" BETWEEN 1 AND 6);
```

---

## 4. API ENDPOINTS

### 4.1 🟡 Route prefix không nhất quán giữa tài liệu và thực tế

**Vấn đề:** Tài liệu thiết kế dùng `/api/quizzes`, `/api/placement`... nhưng thực tế đang dùng `/api/v1/placement`, `/api/v1/attempts`. Endpoint table ở section 5 không có `/v1` prefix.

**Khuyến nghị:** Thống nhất toàn bộ tài liệu dùng `/api/v1/` prefix và cập nhật bảng endpoint. Đây quan trọng cho Sprint 4 khi làm Teacher API.

---

### 4.2 🟡 `PUT /api/attempts/{id}/answer` — thiếu anti-replay protection

**Vấn đề:** Student có thể submit answer sau khi quiz đã expired (nếu client offline rồi back online). Cần validate state phía server trong handler:

```csharp
// SaveAnswer command handler
var attempt = await _db.QuizAttempts.FindAsync(id);
if (attempt.State != AttemptState.InProgress)
    throw new InvalidOperationException("Attempt không còn InProgress");
if (attempt.ExpiresAt.HasValue && DateTime.UtcNow > attempt.ExpiresAt.Value)
    throw new QuizExpiredException();
```

---

### 4.3 🟡 Thiếu endpoint `PUT /api/attempts/{id}/anticheat`

Tài liệu mô tả flow: `AntiCheatMonitor mount → PUT /api/attempts/{id}/anticheat` (section 8.2) nhưng endpoint này không có trong bảng API endpoints (section 5.3). Cần bổ sung:

```
PUT  /api/v1/attempts/{id}/anticheat    Append anti-cheat event vào log
```

---

### 4.4 🟡 Speaking/Writing API thiếu endpoint link với Attempt

**Vấn đề:** `POST /api/speaking/upload` tạo `SpeakingSubmission` độc lập, nhưng không có cách link submission với `AttemptAnswer`. Cần thêm `attemptAnswerId` vào request body hoặc URL:

```
POST /api/v1/attempts/{attemptId}/answers/{answerId}/speaking/upload
```

Hoặc:
```json
// POST /api/v1/speaking/upload body
{
  "attemptAnswerId": "uuid",
  "questionId": "uuid"
}
```

---

### 4.5 🟢 Thiếu pagination spec cho list endpoints

`GET /api/quizzes`, `GET /api/questions` — không định nghĩa query params pagination. Nên document rõ:

```
GET /api/v1/questions?page=1&pageSize=20&type=SingleChoice&skill=Grammar&difficulty=Medium&tag=IELTS&search=keyword
```

---

## 5. BACKEND CQRS & SERVICES

### 5.1 ❌ `StartAttempt` thiếu idempotency check — Interactive Quiz bị race condition

**Vấn đề:** Video player có thể trigger quiz popup nhiều lần nếu `currentTime` check không chính xác (float comparison). Mỗi lần trigger gọi `POST /api/quizzes/{id}/start` → tạo nhiều `QuizAttempt` song song cho cùng user + quiz.

**Sửa:**
```csharp
public async Task<StartAttemptResult> Handle(StartAttemptCommand request, ...)
{
    // Idempotency: nếu đã có attempt InProgress → return existing
    var existing = await _db.QuizAttempts
        .FirstOrDefaultAsync(a =>
            a.QuizId == request.QuizId &&
            a.UserId == request.UserId &&
            a.State == AttemptState.InProgress);

    if (existing != null)
        return new StartAttemptResult(existing.Id, alreadyStarted: true);

    // Check retry limit
    if (quiz.RetryLimit.HasValue) {
        var count = await _db.QuizAttempts
            .CountAsync(a => a.QuizId == quiz.Id && a.UserId == userId);
        if (count >= quiz.RetryLimit.Value)
            throw new RetryLimitExceededException();
    }

    // Tạo attempt mới
    // ...
}
```

---

### 5.2 ❌ `AutoGraderService` chưa định nghĩa logic cho `Matching` và `Ordering`

**Vấn đề:** Grading Matrix (section 9.1) liệt kê Matching và Ordering nhưng `AutoGraderService` (section 6.2) chỉ có 4 loại: SC/MC/TF/FB. Trong khi Sprint 3 đã ghi `MatchingInput.tsx` là task chưa làm — cần define logic trước khi implement frontend.

**Sửa — Matching grading:**
```csharp
case QuestionType.Matching:
    // AnswerValue format: [{"key":"A","value":"Dog"},{"key":"B","value":"Cat"}]
    var studentPairs = JsonSerializer.Deserialize<List<MatchPair>>(answer.AnswerValue);
    var correctPairs = question.Options
        .ToDictionary(o => o.MatchKey, o => o.MatchValue);

    int correctCount = studentPairs.Count(p =>
        correctPairs.TryGetValue(p.Key, out var v) && v == p.Value);

    answer.Score = (decimal)correctCount / correctPairs.Count * questionScore;
    answer.IsCorrect = correctCount == correctPairs.Count;
    break;
```

**Sửa — Ordering grading (strict mode):**
```csharp
case QuestionType.Ordering:
    // AnswerValue format: ["optId3","optId1","optId2"] — thứ tự student chọn
    var studentOrder = JsonSerializer.Deserialize<List<string>>(answer.AnswerValue);
    var correctOrder = question.Options
        .OrderBy(o => o.DisplayOrder)
        .Select(o => o.Id.ToString())
        .ToList();

    bool perfectOrder = studentOrder.SequenceEqual(correctOrder);
    // Partial: tính số vị trí đúng
    int correctPositions = studentOrder
        .Zip(correctOrder, (s, c) => s == c)
        .Count(x => x);

    answer.Score = (decimal)correctPositions / correctOrder.Count * questionScore;
    answer.IsCorrect = perfectOrder;
    break;
```

---

### 5.3 🟡 `PlacementRuleEngine` — adjustment logic có thể penalize 2 lần

**Vấn đề:** Logic hiện tại:
```
IF Listening < 30 AND level >= 4: level -= 1
IF Grammar   < 30 AND level >= 4: level -= 1
```

Nếu cả Listening < 30 và Grammar < 30 → bị trừ 2 level cùng lúc. Level 4 → 2. Có thể quá harsh.

**Khuyến nghị — thêm cap:**
```csharp
int adjustments = 0;
if (skillScores[SkillType.Listening] < 30 && baseLevel >= 4) adjustments++;
if (skillScores[SkillType.Grammar]   < 30 && baseLevel >= 4) adjustments++;

// Cap: tối đa trừ 1 level dù có bao nhiêu điểm yếu
int finalLevel = Math.Max(1, baseLevel - Math.Min(1, adjustments));
```

---

### 5.4 🟡 `RecommendationService` thiếu deduplication

**Vấn đề:** Nếu student yếu cả Listening và Grammar → query courses cho cả 2 skills → có thể recommend cùng 1 course hai lần (course dạy cả Listening + Grammar).

**Sửa:**
```csharp
var recommended = courses
    .DistinctBy(c => c.Id)  // dedup
    .OrderByDescending(c => c.RatingAverage)
    .ThenByDescending(c => c.TotalStudents)
    .Take(5)
    .ToList();
```

---

### 5.5 🟢 `AdaptiveEngine` nên được inject là service, không phải static logic

Hiện tại adaptive logic viết inline trong command handler. Nên tách ra `AdaptiveEngine.cs` (đã có trong file structure) và inject qua DI để dễ unit test và thay thế algorithm sau này.

---

## 6. GRADING ENGINE

### 6.1 🟡 `FillBlank` — Normalize function chưa định nghĩa rõ

**Vấn đề:** Comment ghi `Normalize: Trim + ToLower + RemoveDiacritics(optional)` nhưng "optional" không rõ khi nào bật/tắt. Bài tiếng Anh vs tiếng Việt cần xử lý khác nhau.

**Sửa — thêm flag vào Question:**
```csharp
// Question entity
public bool NormalizeDiacritics { get; set; } = false;  // true cho câu hỏi tiếng Việt

// AutoGraderService
string Normalize(string input, bool removeDiacritics) {
    var result = input.Trim().ToLowerInvariant();
    if (removeDiacritics)
        result = RemoveDiacriticsImpl(result);
    return result;
}
```

---

### 6.2 🟡 `MultipleChoice` — thiếu định nghĩa "Lenient mode"

**Vấn đề:** Hiện chỉ có "strict mode" (bất kỳ wrong answer nào → 0 điểm). Một số bài IELTS cho partial score ngay cả khi có wrong answer chọn.

**Khuyến nghị — thêm mode vào Quiz settings hoặc Question:**
```csharp
public bool MultiChoiceStrictMode { get; set; } = true;

// Grading
if (strictMode) {
    if (wrongHit > 0) score = 0;
    else score = (correctHit / totalCorrect) * questionScore;
} else {
    // Lenient: score = max(0, (correctHit - wrongHit) / totalCorrect) * questionScore
    score = Math.Max(0, (decimal)(correctHit - wrongHit) / totalCorrect * questionScore);
}
```

---

### 6.3 🟡 `GradingMethod.Resolution` — thiếu case `Matching` và `Ordering` là AI hay Auto?

**Vấn đề:** Logic phân loại hiện chỉ xét `SpeakingTest/WritingTest` và `SpeakingRecording/EssayWriting` → AI async. Matching/Ordering không được đề cập → không rõ sẽ chạy Auto hay chờ AI.

**Sửa — bổ sung vào resolution logic:**
```csharp
bool needsAI = quiz.QuizType is QuizType.SpeakingTest or QuizType.WritingTest
    || answers.Any(a => a.QuestionType is QuestionType.SpeakingRecording or QuestionType.EssayWriting);

// Matching, Ordering: Auto grading — không cần AI
```

---

## 7. SPEAKING AI PIPELINE

### 7.1 ❌ Frontend dùng polling mỗi 3s — không tận dụng SignalR đã có

**Vấn đề:**
```
Frontend: polling GET /api/speaking/{id}/status mỗi 3s
```
Speaking pipeline có thể mất 30–90 giây. Với 100 concurrent users → 100 × 20 req/30s = 2000 request/phút vô ích. Trong khi `QuizHub` SignalR đã có trong stack.

**Sửa — Push qua SignalR khi Worker xong:**

```csharp
// SpeakingGradingWorker — sau khi update Done
await _hubContext
    .Clients
    .User(submission.UserId.ToString())
    .SendAsync("SpeakingGradingCompleted", new {
        submissionId = submission.Id,
        status       = "Done",
        finalScore   = submission.FinalScore
    });
```

```typescript
// Frontend — thay polling bằng SignalR listener
const connection = new HubConnectionBuilder()
    .withUrl('/hubs/quiz')
    .build();

connection.on('SpeakingGradingCompleted', ({ submissionId, status }) => {
    if (submissionId === currentSubmissionId && status === 'Done') {
        router.push(`/quiz/${quizId}/ai-result/${attemptId}`);
    }
});
```

---

### 7.2 ❌ `FluencyScore` formula có thể cho kết quả âm

**Vấn đề:**
```
FluencyScore = 100 - (longPauseCount * 5) - (fillerCount * 2)
```
Student có 25 lần ngập ngừng: `100 - 125 = -25`. Score âm không có nghĩa và sẽ làm `FinalScore` âm.

**Sửa:**
```csharp
decimal fluencyPenalty = (longPauseCount * 5m) + (fillerCount * 2m);
decimal fluencyScore = Math.Max(0, 100 - fluencyPenalty);
```

---

### 7.3 🟡 `GradingStatus` transition không có guard

**Vấn đề:** Worker có thể process cùng một submission 2 lần (nếu RabbitMQ redelivers) → duplicate grading, score bị overwrite.

**Sửa — Optimistic concurrency / status guard:**
```csharp
// Trước khi bắt đầu process
var updated = await _db.SpeakingSubmissions
    .Where(s => s.Id == submissionId && s.GradingStatus == GradingStatus.Pending)
    .ExecuteUpdateAsync(s => s.SetProperty(x => x.GradingStatus, GradingStatus.Processing));

if (updated == 0)
    return; // Đã được process bởi worker khác, skip
```

---

### 7.4 🟡 `AccuracyScore` không được định nghĩa trong pipeline

**Vấn đề:** Formula cuối: `FinalScore = 0.4 * Pronunciation + 0.3 * Fluency + 0.3 * Accuracy`. Nhưng trong 7 bước pipeline không có bước nào tính `AccuracyScore`. Chỉ có Pronunciation (bước 4) và Fluency (bước 5).

**Khuyến nghị — làm rõ Accuracy là gì:**
```
AccuracyScore = độ chính xác từ vựng và ngữ pháp trong lời nói
  = Whisper word confidence average * 100
  Hoặc: (words_in_transcript / expected_words) * 100
```

Cần document và implement rõ ràng trước Sprint 6.

---

### 7.5 🟢 Thiếu xử lý audio quá ngắn (< 3 giây)

Cần validate minimum duration trước khi đưa vào pipeline:
```csharp
if (audioInfo.DurationMs < 3000)
    throw new AudioTooShortException("Recording phải ít nhất 3 giây");
```

---

## 8. WRITING AI PIPELINE

### 8.1 🟡 `GrammarScore` không fair theo độ dài bài

**Vấn đề:**
```
GrammarScore = max(0, 100 - errors.Count * 5)
```
Bài 500 từ có 5 lỗi nhỏ = 75 điểm.  
Bài 50 từ có 5 lỗi = 75 điểm.  
Không công bằng — bài dài tự nhiên có nhiều cơ hội mắc lỗi hơn.

**Sửa — normalize theo mật độ lỗi:**
```csharp
// Errors per 100 words
decimal errorDensity = (decimal)errors.Count / wordCount * 100;
decimal grammarScore = Math.Max(0, 100 - errorDensity * 10);
// 10 lỗi/100 từ = điểm 0; 0 lỗi = điểm 100
```

---

### 8.2 🟡 LLM được gọi 3 lần riêng lẻ trong Writing pipeline — tốn token + latency

**Vấn đề:** Vocabulary Analysis (LLM), Coherence (LLM), Task Achievement (LLM) — 3 lần gọi LLM riêng. Mỗi lần ~1–3s → tổng ~5–10s chỉ cho LLM calls. Tốn gấp 3 lần token.

**Sửa — gộp vào 1 lần call với structured output:**
```csharp
var prompt = $"""
    Analyze this essay:
    ---
    {essayText}
    ---
    Prompt: {questionPrompt}
    Grammar errors already found: {grammarErrorCount}
    
    Return JSON only:
    {{
      "vocabularyScore": 0-100,
      "cefrDistribution": {{"A1":n,"A2":n,"B1":n,"B2":n,"C1":n,"C2":n}},
      "lexicalDiversity": 0.0-1.0,
      "coherenceScore": 0-100,
      "taskAchievementScore": 0-100,
      "feedback": "markdown feedback in Vietnamese",
      "inlineCorrections": [{{"original":"...","suggestion":"..."}}]
    }}
    """;
```

---

### 8.3 🟢 `WritingSubmission.EssayText` lưu trong DB và MinIO — duplicate

Tài liệu lưu `EssayText` vào cả DB column (`TEXT NOT NULL`) và MinIO (`quiz/writing/ai/{submissionId}.json`). Nên chọn một nơi. Cho bài < 50KB, DB là đủ.

---

## 9. ADAPTIVE LEARNING ENGINE

### 9.1 🟡 Fallback khi question pool cạn — chưa định nghĩa cụ thể

**Vấn đề:** Comment ghi `IF pool == null: currentDifficulty = fallback (try other difficulties)` nhưng không định nghĩa fallback order.

**Sửa:**
```csharp
private static readonly Dictionary<DifficultyLevel, DifficultyLevel[]> FallbackOrder = new() {
    [DifficultyLevel.Hard]   = [Hard, Medium, Easy],
    [DifficultyLevel.Medium] = [Medium, Easy, Hard],
    [DifficultyLevel.Easy]   = [Easy, Medium, Hard],
};

Question? FindNextQuestion(DifficultyLevel preferred, HashSet<Guid> answered, SkillType skill)
{
    foreach (var difficulty in FallbackOrder[preferred])
    {
        var q = _pool
            .Where(q => q.Difficulty == difficulty
                     && q.SkillType is var s && (s == skill || s == SkillType.Mixed)
                     && !answered.Contains(q.Id))
            .OrderBy(_ => Guid.NewGuid())
            .FirstOrDefault();

        if (q != null) return q;
    }
    return null; // Pool exhausted → stop adaptive session
}
```

---

### 9.2 🟡 Scoring formula bất đối xứng — Hard correct quá dễ bị outlier

**Vấn đề:**
```
difficutyWeight = { Easy: 1.0, Medium: 1.5, Hard: 2.0 }
maxPossible = maxQuestions * 2.0  // tất cả Hard đúng
```

Nếu student yếu, hầu hết câu là Easy (weight 1.0). `finalScore = rawScore / maxPossible * TotalScore` → score sẽ rất thấp dù student có thể đang ở trình độ phù hợp.

**Khuyến nghị — normalize theo actual questions answered:**
```csharp
decimal maxAchievable = answeredQuestions.Sum(q => difficultyWeight[q.Difficulty]);
decimal finalScore = (rawScore / maxAchievable) * quiz.TotalScore;
```

---

### 9.3 🟢 Adaptive state cần được persist vào Redis nếu session bị drop

Hiện tại không rõ `consecutiveCorrect` và `answeredSet` được lưu ở đâu. Nếu chỉ lưu in-memory, student refresh browser → mất state. Nên cache vào Redis:

```csharp
// Redis key: quiz:adaptive:{attemptId}:state
var state = new AdaptiveState {
    CurrentDifficulty    = DifficultyLevel.Medium,
    ConsecutiveCorrect   = 0,
    AnsweredQuestionIds  = new HashSet<Guid>()
};
await _redis.StringSetAsync($"quiz:adaptive:{attemptId}:state",
    JsonSerializer.Serialize(state),
    TimeSpan.FromHours(2));
```

---

## 10. REALTIME QUIZ ENGINE

### 10.1 ❌ Redis `EXPIRE` với wildcard pattern không hoạt động

**Vấn đề:**
```
EXPIRE quiz:room:{roomId}:* 7200  // ❌ EXPIRE không hỗ trợ wildcard
```
Redis `EXPIRE` command chỉ nhận một key cụ thể, không hỗ trợ pattern.

**Sửa — set TTL ngay khi tạo từng key:**
```csharp
public async Task InitializeRoomKeysAsync(Guid roomId)
{
    var ttl = TimeSpan.FromHours(2);
    var prefix = $"quiz:room:{roomId}";

    await _redis.KeyExpireAsync($"{prefix}:lb",    ttl);
    await _redis.KeyExpireAsync($"{prefix}:state", ttl);
    await _redis.KeyExpireAsync($"{prefix}:currentQ", ttl);
}
```

---

### 10.2 🟡 `RoomParticipant.Rank` lưu trong PostgreSQL nhưng được tính từ Redis — dual source of truth

**Vấn đề:** `Rank` vừa là column trong `RoomParticipants` table, vừa được tính real-time từ Redis ZSET. Nếu persist Rank vào DB, phải sync DB mỗi khi leaderboard update → overhead. Nếu không persist, Rank mất khi room end.

**Khuyến nghị:**
- Runtime: tính Rank từ Redis ZSET (`ZREVRANK`)
- Khi room `Ended`: final persist toàn bộ scores + ranks vào `RoomParticipants` một lần duy nhất

```csharp
// QuizHub — EndQuiz
var finalScores = await _redis.SortedSetRangeByRankWithScoresAsync(
    $"quiz:room:{roomId}:lb", order: Order.Descending);

int rank = 1;
foreach (var entry in finalScores) {
    await _db.RoomParticipants
        .Where(p => p.RoomId == roomId && p.UserId == Guid.Parse(entry.Element))
        .ExecuteUpdateAsync(p => p
            .SetProperty(x => x.Score, (int)entry.Score)
            .SetProperty(x => x.Rank, rank++));
}
```

---

### 10.3 🟡 Không có timeout khi student không trả lời trong 20s

**Vấn đề:** `CountdownOverlay` đếm ngược 20s phía frontend, nhưng nếu student không chọn đáp án → server không biết → question không advance.

**Sửa — server-side timer:**
```csharp
// Sau khi broadcast QuestionStarted
_ = Task.Delay(TimeSpan.FromSeconds(questionTimeLimit + 2))  // +2s buffer
    .ContinueWith(async _ => {
        var room = await _db.RealtimeQuizRooms.FindAsync(roomId);
        if (room.State == RoomState.Active && room.CurrentQuestionIndex == questionIndex)
            await AdvanceToNextQuestion(roomId);
    });
```

---

### 10.4 🟢 `RoomCode` — không có logic retry khi trùng

Tạo RoomCode 6 ký tự random → xác suất collision không đáng kể nhưng nên có retry:
```csharp
string GenerateUniqueRoomCode() {
    string code;
    do {
        code = GenerateRandomCode(6);
    } while (_db.RealtimeQuizRooms.Any(r => r.RoomCode == code && r.State != RoomState.Ended));
    return code;
}
```

---

## 11. EVENT-DRIVEN ARCHITECTURE

### 11.1 🟡 `AnalyticsWorker` không được mention trong event routing nhưng có trong file structure

**Vấn đề:** Section 17.1 routing:
```
attempt.completed → q.analytics.update → AnalyticsWorker
```
Nhưng không có `AnalyticsWorker.cs` logic được mô tả. Sprint 2 đã có `AnalyticsController.cs` → chạy SQL queries on-demand. Cần làm rõ AnalyticsWorker làm gì khác:

**Khuyến nghị:** Document rõ AnalyticsWorker chịu trách nhiệm gì — ví dụ: update materialized views, invalidate Redis cache, aggregate skill scores.

---

### 11.2 🟡 Thiếu event `SpeakingGradingCompleted` và `WritingGradingCompleted` trong schema

Section 17.2 chỉ có 3 event schemas (SpeakingGradingRequested, AttemptCompleted, PlacementCompleted). Cần thêm:

```json
// SpeakingGradingCompleted
{
  "submissionId": "uuid",
  "userId": "uuid",
  "attemptAnswerId": "uuid",
  "finalScore": 85.5,
  "status": "Done",
  "processedAt": "2026-05-22T10:00:00Z"
}

// WritingGradingCompleted
{
  "submissionId": "uuid",
  "userId": "uuid",
  "attemptAnswerId": "uuid",
  "finalScore": 78.0,
  "status": "Done"
}
```

---

### 11.3 🟢 DLQ alert — "email / Slack webhook" chưa config ở đâu

Section 17.3 ghi alert nhưng không nói config ở đâu. Nên thêm vào `appsettings.json` hoặc secrets:
```json
{
  "Alerts": {
    "SlackWebhookUrl": "...",
    "NotificationEmail": "admin@mls.vn"
  }
}
```

---

## 12. SECURITY & ANTI-CHEAT

### 12.1 🟡 `AntiCheatLog` JSONB append — không atomic

**Vấn đề:** Mỗi tab-switch event gọi `PUT /api/attempts/{id}/anticheat` → read JSONB → append → write lại. Nếu 2 events đến cùng lúc → race condition, 1 event bị mất.

**Sửa — dùng PostgreSQL JSONB append operator:**
```sql
UPDATE "QuizAttempts"
SET "AntiCheatLog" = "AntiCheatLog" || $1::jsonb
WHERE "Id" = $2
```

Hoặc trong EF:
```csharp
await _db.Database.ExecuteSqlRawAsync(
    """UPDATE "QuizAttempts" SET "AntiCheatLog" = COALESCE("AntiCheatLog", '[]'::jsonb) || @event::jsonb WHERE "Id" = @id""",
    new NpgsqlParameter("@event", JsonSerializer.Serialize(antiCheatEvent)),
    new NpgsqlParameter("@id", attemptId));
```

---

### 12.2 🟡 Rate limiting chỉ mention, không định nghĩa implementation

Section 18.2 ghi:
```
POST /api/quizzes/{id}/start: max 10 req/min per userId
POST /api/speaking/upload: max 5 req/min per userId
```

Nhưng không nói implement bằng gì. Với .NET, nên dùng `AspNetCoreRateLimit` hoặc Redis-based rate limiting.

**Sửa — thêm vào document:**
```csharp
// Program.cs — sử dụng .NET 8+ built-in rate limiting
builder.Services.AddRateLimiter(options => {
    options.AddPolicy("quiz-start", context =>
        RateLimitPartition.GetSlidingWindowLimiter(
            partitionKey: context.User?.FindFirst("sub")?.Value ?? "anonymous",
            factory: _ => new SlidingWindowRateLimiterOptions {
                Limit = 10, Window = TimeSpan.FromMinutes(1),
                SegmentsPerWindow = 6
            }));
});
```

---

### 12.3 🟢 Copy-paste disable chỉ ở client-side — dễ bypass

```
oncopy/onpaste/oncontextmenu prevent default
```

Đây là UX hint, không phải security. Advanced user có thể bypass qua DevTools. Nên thêm note trong tài liệu rằng đây là best-effort, không phải hard security.

---

## 13. FRONTEND PAGES & COMPONENTS

### 13.1 🟡 Thiếu Error Boundary spec

Tài liệu ghi "Loading skeletons + error boundaries" trong Sprint 5.4 nhưng không định nghĩa:
- Error boundary bao phủ phạm vi nào (per page hay per component)?
- Fallback UI trông như thế nào?
- Có retry mechanism không?

**Khuyến nghị — thêm spec:**
```typescript
// QuizPlayerPage cần error boundary riêng vì:
// - mất kết nối giữa chừng → cần persist state và retry
// - AI grading fail → hiện fallback message

<ErrorBoundary
    fallback={<QuizErrorFallback onRetry={refetch} />}
    onError={(error) => logErrorToSentry(error)}
>
    <QuizPlayerPage />
</ErrorBoundary>
```

---

### 13.2 🟡 `QuizTimer` auto-submit khi hết giờ — race condition với manual submit

**Vấn đề:** Nếu student click Submit đúng lúc timer auto-submit → 2 request `POST /api/attempts/{id}/submit` gần như đồng thời. Server cần handle idempotency:

```csharp
// SubmitAttempt command
if (attempt.State != AttemptState.InProgress)
    return new SubmitResult(alreadySubmitted: true, attemptId: attempt.Id);
// Không throw error — return existing result
```

Frontend cũng nên disable Submit button ngay khi click:
```typescript
const [isSubmitting, setIsSubmitting] = useState(false);
const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    // ...
};
```

---

### 13.3 🟡 `placementApi.ts` gộp vào `quizApi.ts` — nhưng file structure vẫn khai báo `placementApi.ts` riêng

Bảng trạng thái Sprint 3 ghi: "placementApi.ts — gộp vào quizApi.ts (không tách file riêng)". Nhưng section 7.3 vẫn liệt kê `placementApi.ts` trong `src/store/api/`. Cần cập nhật bảng section 7.3 cho nhất quán.

---

### 13.4 🟢 `SpeakingRecorder` — cần spec về WebM vs MP3 trên iOS

iOS Safari không hỗ trợ WebM recording qua MediaRecorder. Cần fallback:
```typescript
const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
    ? 'audio/webm;codecs=opus'
    : 'audio/mp4';  // iOS fallback
```

Nên document constraint này và test trên Safari trước Sprint 6.

---

## 14. LUỒNG NGHIỆP VỤ

### 14.1 ❌ Flow 8.2 — Auto-save mỗi 10 giây có thể gây write amplification

**Vấn đề:**
```
Auto-save mỗi 10 giây: PUT /api/attempts/{id}/answer
```

30 câu hỏi × auto-save mỗi 10s × 45 phút = 30 × 270 = 8100 request/student. Nếu 100 students cùng làm → 810,000 DB writes trong 45 phút.

**Sửa — save vào Redis trước, flush vào DB khi submit:**
```typescript
// Frontend: local state + debounce
const debouncedSave = useMemo(
    () => debounce(saveAnswerToServer, 30_000),  // 30s thay vì 10s
    []
);

// Hoặc: chỉ save khi user chuyển câu, không save periodic
const handleNavigate = async (nextIndex: number) => {
    if (currentAnswer !== savedAnswer) {
        await saveAnswer(currentAnswer);
    }
    setCurrentIndex(nextIndex);
};
```

---

### 14.2 🟡 Flow 8.4 Placement — `AllowRetry = false` nhưng thiếu cooldown period

**Vấn đề:** Tài liệu ghi `AllowRetry: false (hoặc 1 lần / 6 tháng)` nhưng không implement cooldown. Nếu retry được sau 6 tháng, cần field `NextAllowedRetryAt` hoặc logic từ `PlacementResult.TestedAt`.

**Khuyến nghị:**
```csharp
// StartAttempt — Placement Test check
var lastResult = await _db.PlacementResults
    .Where(r => r.UserId == userId)
    .OrderByDescending(r => r.TestedAt)
    .FirstOrDefaultAsync();

if (lastResult != null && lastResult.TestedAt > DateTime.UtcNow.AddMonths(-6))
    throw new PlacementCooldownException(lastResult.TestedAt.AddMonths(6));
```

---

### 14.3 🟡 Interactive Quiz flow — không xử lý khi student skip popup

**Vấn đề:**
```
Popup quiz → Student answer → Continue video
```

Nếu student đóng popup mà không answer → video không resume? Hoặc resume ngay? Flow chưa định nghĩa case này.

**Khuyến nghị — thêm vào flow:**
```
Popup quiz hiện ra:
  Case 1: Student trả lời → submit → show result 2s → dismiss → play()
  Case 2: Student đóng popup (skip) → không submit attempt → play() ngay
  Case 3: Student không tương tác 30s → auto-dismiss → play() ngay
```

---

## 15. STORAGE DESIGN

### 15.1 🟢 TTL policy hợp lý, nhưng thiếu cleanup job

90 ngày TTL cho audio recordings — ai chạy cleanup? MinIO/S3 Lifecycle Policy hay scheduled job? Nên document:

```
MinIO Lifecycle Policy:
  Rule: quiz/speaking/**  → expire after 90 days
  Rule: quiz/proctoring/** → expire after 30 days
```

---

### 15.2 🟢 Thiếu file validation server-side trước khi upload lên storage

Document chỉ ghi validate format/duration/size ở bước [1] nhưng không nói validate phía server hay client:

```csharp
// SpeakingController — trước khi upload MinIO
var allowedMimeTypes = new[] { "audio/webm", "audio/mp4", "audio/wav", "audio/mpeg" };
if (!allowedMimeTypes.Contains(file.ContentType))
    return BadRequest("Format không được hỗ trợ");

if (file.Length > 50 * 1024 * 1024)
    return BadRequest("File vượt quá 50MB");
```

---

## 16. ROADMAP & TASK LIST

### 16.1 🟡 Effort estimate có thể thiếu buffer

| Phase | Estimate hiện tại | Khuyến nghị |
|-------|------------------|-------------|
| 3A MVP | 35–45 ngày công | 45–55 ngày công |
| 3B AI | 20–25 ngày công | 25–35 ngày công |
| 3C Adaptive/Realtime | 20–25 ngày công | 25–30 ngày công |

Lý do: AI integration (Whisper, GPT-4o) thường mất thêm 30–40% thời gian so với estimate do trial/error prompt engineering, API rate limits, và testing edge cases.

---

### 16.2 🟡 Sprint 5 (Integration) chỉ 2–3 ngày — quá ít cho E2E test

E2E test coverage cho toàn Phase 3A (quiz flow + placement + analytics) với Playwright/Cypress thường cần ít nhất 5–7 ngày. Đề xuất tách:

```
Sprint 5A (2 ngày): Integration — gán quiz vào video, quiz section trong course
Sprint 5B (4 ngày): QA & Polish — E2E test, bug fixes, performance check
```

---

### 16.3 🟢 Route thực tế `/placement-test` chưa được update trong các section khác

Bảng trạng thái Sprint 3 ghi chú route thực tế là `/placement-test`, nhưng:
- Section 7.1 (Student Pages) vẫn ghi `/placement`
- Section 8.4 (Placement Test flow) vẫn ghi `/placement:`
- Section 14.2 (Display Locations) ghi `/placement/result`

Cần find & replace toàn tài liệu: `/placement` → `/placement-test`.

---

## 17. TỔNG HỢP ISSUES THEO ĐỘ ƯU TIÊN

### 🔴 PHẢI SỬA TRƯỚC KHI TIẾP TỤC CODE

| # | Issue | File/Section | Hành động |
|---|-------|-------------|-----------|
| R1 | JSONB fields map sai type trong EF Core | Domain Entities, DbContext | Thêm `.HasColumnType("jsonb")` cho tất cả JSONB fields |
| R2 | `QuizAttempt` thiếu `ExpiresAt` — không enforce timer server-side | Entity, SQL, StartAttempt handler | Thêm field + migration + validation trong Submit |
| R3 | `StartAttempt` thiếu idempotency check — Interactive Quiz race condition | AttemptCommands.cs | Thêm check existing InProgress attempt |
| R4 | `AutoGraderService` không có logic Matching và Ordering | AutoGraderService.cs | Implement trước khi làm frontend MatchingInput |
| R5 | Redis `EXPIRE` wildcard không hoạt động | Realtime Quiz, Redis | Set TTL ngay khi tạo từng key |
| R6 | Frontend polling mỗi 3s cho AI status — không scale | Speaking/Writing frontend | Replace bằng SignalR push |

---

### 🟡 NÊN SỬA TRONG SPRINT TIẾP THEO

| # | Issue | File/Section | Hành động |
|---|-------|-------------|-----------|
| Y1 | `FluencyScore` có thể âm | Speaking AI Worker | Thêm `Math.Max(0, ...)` |
| Y2 | `GrammarScore` không fair theo độ dài | Writing AI Worker | Normalize theo error density |
| Y3 | LLM gọi 3 lần riêng trong Writing pipeline | WritingGradingWorker | Gộp 1 lần với structured output |
| Y4 | `GradingStatus` không có guard chống duplicate processing | SpeakingGradingWorker | Thêm optimistic concurrency check |
| Y5 | `AccuracyScore` không được định nghĩa trong pipeline | Speaking AI | Document và implement trước Sprint 6 |
| Y6 | `PlacementRuleEngine` double-penalize 2 weak skills | PlacementRuleEngine.cs | Cap adjustment tối đa 1 level |
| Y7 | `RoomParticipant.Rank` dual source of truth | RealtimeQuizRoom, Redis | Persist chỉ khi room Ended |
| Y8 | Server không có timeout khi student không trả lời | QuizHub.cs | Thêm server-side question timer |
| Y9 | `AntiCheatLog` append không atomic | AttemptsController | Dùng PostgreSQL JSONB append operator |
| Y10 | `RecommendationService` thiếu deduplication | RecommendationService.cs | Thêm `.DistinctBy(c => c.Id)` |
| Y11 | Auto-save mỗi 10s — write amplification | QuizPlayerPage | Tăng lên 30s hoặc save-on-navigate |
| Y12 | Adaptive state không persist | AdaptiveEngine | Cache vào Redis |
| Y13 | Soft delete thiếu cho `Questions` | Question entity, SQL | Thêm `IsDeleted` + global query filter |
| Y14 | Route `/placement` chưa update toàn tài liệu | Toàn bộ document | Find & replace `/placement` → `/placement-test` |
| Y15 | Placement cooldown 6 tháng chưa implement | PlacementCommands | Thêm check `TestedAt + 6 months` |

---

### 🟢 CẢI THIỆN — Làm khi có thời gian

| # | Issue | Hành động |
|---|-------|-----------|
| G1 | Composite indexes còn thiếu | Thêm 7 indexes đề xuất ở mục 3.1 |
| G2 | `QuizQuestions.DisplayOrder` unique index | Thêm partial unique index |
| G3 | `RoomCode` thiếu retry khi trùng | Thêm do-while collision check |
| G4 | `SpeakingRecorder` thiếu iOS Safari fallback | Test và thêm `audio/mp4` fallback |
| G5 | Error Boundary chưa có spec | Define fallback UI và retry logic |
| G6 | QuizTimer auto-submit race condition | Handle idempotent submit phía server |
| G7 | DLQ alert config chưa document | Thêm vào appsettings |
| G8 | `MultiChoiceStrictMode` — thiếu lenient mode | Thêm flag, implement sau 3A |
| G9 | MinIO TTL cleanup job | Thiết lập MinIO Lifecycle Policy |
| G10 | Copy-paste disable là client-only — cần note | Thêm comment vào tài liệu |
| G11 | Writing AI: EssayText lưu 2 nơi (DB + MinIO) | Xóa MinIO duplicate, chỉ giữ DB |

---

## PHỤ LỤC — Checklist trước Sprint 4

Trước khi bắt đầu Sprint 4 (Teacher Frontend), đảm bảo:

- [ ] **R1:** EF Config JSONB cho tất cả fields bị ảnh hưởng
- [ ] **R2:** Migration thêm `ExpiresAt` vào `QuizAttempts`
- [ ] **R3:** Idempotency check trong `StartAttempt` command
- [ ] **R4:** Logic Matching + Ordering trong `AutoGraderService`
- [ ] **Y14:** Update toàn tài liệu `/placement` → `/placement-test`
- [ ] **Y6:** Fix `PlacementRuleEngine` double-penalty cap
- [ ] **G1:** Chạy migrations thêm các composite indexes
- [ ] **G2:** Thêm unique index cho `QuizQuestions.DisplayOrder`

---

*Review hoàn thành — 17 sections · 6 issues 🔴 · 15 issues 🟡 · 11 improvements 🟢*
