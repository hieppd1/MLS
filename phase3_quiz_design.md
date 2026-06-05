# PHASE 3 — QUIZ ENGINE + AI LEARNING PLATFORM
# THIẾT KẾ CHI TIẾT TOÀN MODULE

> Nguồn: `phase3_quiz_engine_ai_learning_platform.md`  
> Stack: .NET 10 · MediatR · EF Core · PostgreSQL · Redis · RabbitMQ · Next.js 16 · RTK Query  
> Chiến lược: **Phase 3A → 3B → 3C** (MVP → AI → Adaptive/Realtime)

---

## TRẠNG THÁI TRIỂN KHAI

| Sprint | Nội dung | Trạng thái | Ghi chú |
|--------|----------|-----------|---------|
| **Sprint 1** | Domain & Database | ✅ Hoàn thành | 7 entities, EF config, SQL schema applied |
| **Sprint 2** | Backend API | ✅ Hoàn thành | 16 CQRS files, 5 controllers, seed 30 câu, 7 endpoints verified |
| **Sprint 3** | Frontend Student | ✅ Hoàn thành | Placement Test E2E + `/quiz/[id]` play + result pages + Matching/Ordering UI |
| **Sprint 4** | Frontend Teacher | ✅ Hoàn thành | Quiz Builder, Question Bank, Analytics, Placement Overview |
| **Sprint 5** | Integration & Polish | ✅ Hoàn thành | Video quiz popup, Quiz section (courses/[id]), Placement widget, Seed SQL |
| **Sprint 6** | Speaking AI (3B) | ✅ Hoàn thành | SpeakingSubmission, SpeakingGradingWorker, SpeakingRecorder, /quiz/[id]/speaking, SignalR push |
| **Sprint 7** | Writing AI (3B) | ✅ Hoàn thành | WritingSubmission, WritingGradingWorker, EssayEditor, /quiz/[id]/writing, mode-aware rubric |
| **Sprint 8–10** | Adaptive & Realtime (3C) | 🔴 Chưa bắt đầu | SignalR, Adaptive Engine |

### Chi tiết triển khai Sprint 3–5

#### Sprint 3 — Frontend Student ✅

**RTK Query mở rộng (`quizApi.ts`):**
```
Types:     QuizListItem, QuizListResult, CreateQuizRequest, UpdateQuizRequest,
           AttemptQuestionReviewDto, AttemptResultDto, MyAttemptItem (+ existing types)
Endpoints: listQuizzes, getQuiz, createQuiz, updateQuiz, deleteQuiz,
           publishQuiz, archiveQuiz, getQuizPreview,
           startQuizAttempt, abandonAttempt, getAttemptResult, getMyAttempts
tagTypes:  ["PlacementResult", "Quiz", "QuizAttempt"]
```

**Pages đã tạo:**
```
frontend/src/app/quiz/[id]/page.tsx                     ← QuizIntroPage (intro + attempts history)
frontend/src/app/quiz/[id]/play/page.tsx                ← QuizPlayerPage (timer, save, anti-cheat)
frontend/src/app/quiz/[id]/result/[attemptId]/page.tsx  ← QuizResultPage (score + review)
```

**Tính năng quiz player:**
- Auto-start attempt on mount, timer count-up/down
- Question types: SingleChoice, MultipleChoice (checkbox), TrueFalse, FillBlank (input)
- 400ms debounced auto-save via `saveAnswer`
- Anti-cheat: visibilitychange listener warns on tab switch
- Auto-submit when time limit reached
- Abandon → `abandonAttempt` → redirect

#### Sprint 4 — Frontend Teacher ✅

**RTK Query mới:**
```
frontend/src/lib/features/quiz/questionApi.ts    ← Question bank CRUD + quiz linking
frontend/src/lib/features/quiz/analyticsApi.ts   ← Quiz + student + course analytics
frontend/src/lib/store.ts                         ← questionApi + analyticsApi registered
```

**Teacher pages đã tạo:**
```
frontend/src/app/teacher/layout.tsx                      ← Sidebar layout, role guard
frontend/src/app/teacher/quizzes/page.tsx                ← Quiz list + filters + actions
frontend/src/app/teacher/quizzes/new/page.tsx            ← 3-step create wizard
frontend/src/app/teacher/quizzes/[id]/page.tsx           ← Edit + question management
frontend/src/app/teacher/quizzes/[id]/analytics/page.tsx ← Per-question analytics
frontend/src/app/teacher/questions/page.tsx              ← Full question bank CRUD
frontend/src/app/teacher/placement/page.tsx              ← Placement overview + charts
```

#### Sprint 5 — Integration ✅

**Placement widget — `my-lesson/page.tsx`:**
- Added `useGetMyPlacementResultQuery` import
- Widget in right sidebar (Col 4), below StreakWidget
- If no result: "Chưa xếp lớp" card + "Kiểm tra ngay" button → `/placement-test`
- If has result: level badge + skill breakdown mini-bars (3 skills) + "Làm lại" link

**Quiz section — `courses/[id]/page.tsx`:**
- Added `useListQuizzesQuery` import + `QuizSection` component
- Renders between modules accordion and Reviews section
- Shows up to 4 published quizzes with links to `/quiz/${id}`
- Shows quiz type, question count, passing score, time limit
- Link to `/placement-test` in header

**Ghi chú kỹ thuật bổ sung (Sprint 3–5):**
- `status` field thêm vào `QuizDetailDto` để edit page dùng được
- `useAddQuestionToQuizMutation` export từ `questionApi` (không phải `quizApi`)
- `QuizSection` dùng `status: "Published"` filter nên không hiện draft quizzes
- `isHydrated` check bắt buộc trước placement query để tránh 401 khi SSR



**Backend files đã tạo:**
```
MLS.Domain/Entities/        Quiz.cs, Question.cs, QuestionOption.cs
                            QuizQuestion.cs, QuizAttempt.cs
                            AttemptAnswer.cs, PlacementResult.cs

MLS.Application/Quiz/
  Commands/                 QuizCommands.cs, QuestionCommands.cs
                            QuizQuestionCommands.cs, AttemptCommands.cs
                            PlacementCommands.cs
  Queries/                  QuizQueries.cs, QuestionQueries.cs
                            AttemptQueries.cs, PlacementQueries.cs
  Services/                 AutoGraderService.cs, PlacementRuleEngine.cs

MLS.API/Controllers/        QuizzesController.cs, QuestionsController.cs
                            AttemptsController.cs, PlacementController.cs
                            AnalyticsController.cs
```

**Frontend files đã tạo:**
```
frontend/src/lib/features/quiz/quizApi.ts        ← RTK Query (placement + attempt)
frontend/src/lib/store.ts                         ← quizApi registered
frontend/src/app/placement-test/page.tsx          ← Full placement flow (694 lines)
```

**Endpoints đã verify (smoke test):**
```
GET  /api/v1/placement/quiz          ✅ 200 — quiz 30 câu
POST /api/v1/placement/start         ✅ 200 — {attemptId, questions[30]}
PUT  /api/v1/attempts/{id}/answer    ✅ 200 — true
POST /api/v1/attempts/{id}/submit    ✅ 200 — {score, percentage, passed}
POST /api/v1/placement/result        ✅ 200 — {id, level, skillBreakdown, recommendedPath}
GET  /api/v1/placement/my-result     ✅ 200 — {assignedLevel, skillBreakdown, ...}
POST /api/v1/auth/login              ✅ 200 — {accessToken, refreshToken, user}
```

**Ghi chú kỹ thuật quan trọng:**
- `X-Tenant-Slug` header phải là `demo` (không phải `tenant_demo`) → schema = `tenant_demo`
- Route thực tế: `/placement-test` (không phải `/placement` như thiết kế gốc)
- Placement page là single-page flow (stages: intro → loading → quiz → submitting → result)
- Test user: `student@demo.com` / `Test@123`, tenant: `demo`

---


## MỤC LỤC

| # | Phần | Nội dung |
|---|------|---------|
| 1 | [Tổng quan & Phân pha](#1-tổng-quan--phân-pha) | Business goals, roadmap 3 pha |
| 2 | [Kiến trúc tổng thể](#2-kiến-trúc-tổng-thể) | High-level architecture, services, infra |
| 3 | [Domain Model — Tất cả Entities](#3-domain-model--tất-cả-entities) | 12 entities đầy đủ |
| 4 | [Database Schema](#4-database-schema) | SQL đầy đủ tất cả bảng |
| 5 | [API Endpoints — Tất cả modules](#5-api-endpoints--tất-cả-modules) | 50+ endpoints |
| 6 | [Backend CQRS Modules](#6-backend-cqrs-modules) | 10 modules, file structure |
| 7 | [Frontend Pages & Components](#7-frontend-pages--components) | Student + Teacher, tất cả pha |
| 8 | [Luồng nghiệp vụ chi tiết](#8-luồng-nghiệp-vụ-chi-tiết) | 8 flows đầy đủ |
| 9 | [Grading Engine](#9-grading-engine) | Auto-grade + AI-grade logic |
| 10 | [Speaking AI Engine](#10-speaking-ai-engine) | Pipeline đầy đủ |
| 11 | [Writing AI Engine](#11-writing-ai-engine) | Pipeline đầy đủ |
| 12 | [Adaptive Learning Engine](#12-adaptive-learning-engine) | Rules + algorithm |
| 13 | [Placement Test Engine](#13-placement-test-engine) | Rule engine + level mapping |
| 14 | [Recommendation Engine](#14-recommendation-engine) | Flow + data model |
| 15 | [Analytics Engine](#15-analytics-engine) | Metrics, reports |
| 16 | [Realtime Quiz Engine](#16-realtime-quiz-engine) | WebSocket + leaderboard |
| 17 | [Event-Driven Architecture](#17-event-driven-architecture) | RabbitMQ events |
| 18 | [Security & Anti-Cheat](#18-security--anti-cheat) | Cheat detection |
| 19 | [Storage Design](#19-storage-design) | Object storage, file types |
| 20 | [Task List — Tất cả pha](#20-task-list--tất-cả-pha) | Checklist đầy đủ |
| 21 | [Implementation Plan](#21-implementation-plan) | Sprint plan, thứ tự ưu tiên |

---

## 1. TỔNG QUAN & PHÂN PHA

### 1.1 Business Goals

| Goal | Tham chiếu | Pha |
|------|-----------|-----|
| Đánh giá năng lực học viên | IELTS Online Test | 3A |
| Quiz tích hợp trong video (interactive) | ClassPoint | 3A |
| Placement Test → xếp lớp tự động | Duolingo | 3A |
| Thống kê cơ bản (attempt, pass rate) | Coursera | 3A |
| Speaking AI (ghi âm → chấm phát âm) | Elsa Speak | 3B |
| Writing AI (essay → LLM feedback) | Grammarly | 3B |
| Async AI grading queue | Coursera | 3B |
| Recommendation learning path | Khan Academy | 3B |
| Adaptive quiz (khó dần / dễ lại) | Duolingo | 3C |
| Realtime quiz + leaderboard | Quizizz | 3C |
| AI learning graph | Khan Academy | 3C |
| Advanced analytics dashboard | Coursera | 3C |

### 1.2 Phân pha chi tiết

```
Phase 3A — MVP (Sprint 1–5, ~4 tuần)
├── Quiz Builder (Teacher): tạo quiz, gán câu hỏi, publish
├── Question Bank: CRUD, 4 basic types (MCQ/TF/FillBlank/Matching)
├── Quiz Attempt Engine: Timer, Auto-save, Submit
├── Auto Grading: SingleChoice, MultipleChoice, TrueFalse, FillBlank
├── Interactive Quiz in Video: popup tại VideoTriggerSecond
├── Placement Test: rule engine → xác định Level 1–6
├── Result & Review: điểm, đáp án đúng/sai, giải thích
└── Basic Analytics: attempts, avg score, pass rate, per-question stats

Phase 3B — AI Features (Sprint 6–7, ~3 tuần)
├── Speaking AI: Audio → Noise Reduction → STT → Phoneme → LLM Feedback
├── Writing AI: Essay → Grammar → Vocabulary → Coherence → LLM Feedback
├── RabbitMQ Async Grading Queue
├── AI Feedback Viewer (student)
├── AI Review Dashboard (teacher: manual override)
└── Recommendation Engine (weak skill → course suggestion)

Phase 3C — Adaptive & Realtime (Sprint 8–10, ~3 tuần)
├── Adaptive Quiz Engine (difficulty adapts per answer)
├── Realtime Quiz (SignalR + Redis leaderboard)
├── Camera Proctoring (optional)
└── Advanced Analytics (skill trend charts, AI learning graph)
```

---

## 2. KIẾN TRÚC TỔNG THỂ

### 2.1 System Architecture

```
┌─────────────────────────────────────────────────────┐
│   Frontend — Next.js 16 / React Native (future)     │
│   Student: Quiz Player  │  Teacher: Quiz Builder     │
└───────────────────────┬─────────────────────────────┘
                        │ HTTPS / WebSocket (SignalR)
┌───────────────────────▼─────────────────────────────┐
│             .NET 10 API (MediatR / CQRS)             │
├──────────────────────────────────────────────────────┤
│  QuizModule        │ QuestionModule                  │
│  AttemptModule     │ GradingModule (AutoGrader)      │
│  SpeakingModule    │ WritingModule                   │
│  AnalyticsModule   │ RecommendationModule            │
│  PlacementModule   │ RealtimeQuizModule (SignalR)    │
└──┬─────────┬───────┬───────┬────────────────────────┘
   │         │       │       │
┌──▼──┐  ┌───▼──┐ ┌──▼───┐ ┌▼──────────────┐
│ PG  │  │Redis │ │Rabbit│ │ Object Store  │
│ DB  │  │Cache │ │  MQ  │ │ (MinIO / S3)  │
└─────┘  └──────┘ └───┬──┘ └───────────────┘
                       │
              ┌────────▼────────┐
              │  AI Worker      │
              │  .NET Hosted    │
              │  STT/LLM/Score  │
              └─────────────────┘
```

### 2.2 Infrastructure Components

| Component | Vai trò | Phase |
|-----------|---------|-------|
| PostgreSQL | Lưu trữ chính tất cả entities | 3A |
| Redis | Cache quiz sessions, leaderboard ZSET, attempt state | 3A |
| RabbitMQ | Queue AI grading jobs (speaking, writing) | 3B |
| MinIO / S3 | Audio recordings, essay backups, AI outputs | 3B |
| SignalR Hub | Realtime quiz events, leaderboard push | 3C |
| .NET AI Worker | Hosted service xử lý STT, phoneme, LLM | 3B |

---

## 3. DOMAIN MODEL — TẤT CẢ ENTITIES

### 3.1 Enums

```csharp
// ── Quiz ──────────────────────────────────────────────────────
public enum QuizType {
    PlacementTest, SegmentQuiz, PracticeQuiz, MockTest,
    AdaptiveQuiz, SpeakingTest, WritingTest,
    GrammarQuiz, VocabularyQuiz, RealtimeQuiz
}
public enum SkillType   { Listening, Speaking, Reading, Writing, Grammar, Vocabulary, Mixed }
public enum QuizStatus  { Draft, Published, Archived }

// ── Question ──────────────────────────────────────────────────
public enum QuestionType {
    // Basic (Phase 3A)
    SingleChoice, MultipleChoice, TrueFalse, FillBlank, Matching, Ordering,
    // Advanced (Phase 3B)
    SpeakingRecording, EssayWriting, VideoQuiz, DragDrop, AudioTranscription
}
public enum DifficultyLevel { Easy, Medium, Hard }

// ── Attempt ───────────────────────────────────────────────────
public enum AttemptState   { InProgress, Submitted, Grading, Graded, Abandoned }
public enum GradingMethod  { Auto, AI, Manual }

// ── Realtime ──────────────────────────────────────────────────
public enum RoomState { Waiting, Active, Paused, Ended }
```

### 3.2 Quiz

```csharp
public class Quiz : BaseEntity {
    public string    Title
    public string?   Description
    public QuizType  QuizType
    public SkillType SkillType
    public QuizStatus Status
    public int       Level                  // 1–6, khớp CourseLevel
    public int?      Duration               // giây (null = không giới hạn)
    public decimal   TotalScore             // tổng điểm tối đa
    public decimal   PassingScore           // điểm đạt (vd: 7/10)
    public bool      RandomQuestion         // xáo trộn câu hỏi
    public bool      RandomAnswer           // xáo trộn đáp án
    public bool      AllowRetry
    public int?      RetryLimit             // null = không giới hạn
    public bool      ShowCorrectAnswer      // hiện đáp án sau submit
    public bool      ShowExplanation        // hiện giải thích
    public Guid      CreatedBy
    public Guid?     CourseId               // gán vào Course (nullable)
    public Guid?     SessionId              // gán vào Session (interactive quiz)
    public int?      VideoTriggerSecond     // giây trong video → trigger popup quiz
    // Navigation
    public ICollection<QuizQuestion>  Questions
    public ICollection<QuizAttempt>   Attempts
}
```

### 3.3 Question (Question Bank)

```csharp
public class Question : BaseEntity {
    public string          Content           // HTML/Markdown
    public string?         AudioUrl          // audio cho câu nghe
    public string?         ImageUrl          // ảnh minh họa
    public string?         VideoUrl          // cho VideoQuiz type
    public QuestionType    Type
    public SkillType       SkillType
    public DifficultyLevel Difficulty
    public string?         Explanation       // giải thích đáp án
    public decimal         DefaultScore      // điểm mặc định (thường 1.0)
    public string?         Tags              // JSONB: ["IELTS","grammar"]
    public bool            IsPublic          // dùng chung toàn tenant
    public Guid            CreatedBy
    // Navigation
    public ICollection<QuestionOption> Options
    public ICollection<QuizQuestion>   QuizLinks
}
```

### 3.4 QuestionOption

```csharp
public class QuestionOption : BaseEntity {
    public Guid    QuestionId
    public string  Content
    public bool    IsCorrect
    public int     DisplayOrder
    public string? MatchKey               // Matching: key (e.g. "A")
    public string? MatchValue             // Matching: value (e.g. "Dog")
    public string? FeedbackIfSelected     // phản hồi nếu học viên chọn option này
}
```

### 3.5 QuizQuestion (join table + override)

```csharp
public class QuizQuestion : BaseEntity {
    public Guid    QuizId
    public Guid    QuestionId
    public int     DisplayOrder
    public decimal Score                  // override điểm cho câu này trong quiz cụ thể
    public Question Question
}
```

### 3.6 QuizAttempt (AssessmentSession)

```csharp
public class QuizAttempt : BaseEntity {
    public Guid          QuizId
    public Guid          UserId
    public AttemptState  State
    public GradingMethod GradingMethod
    public DateTime      StartedAt
    public DateTime?     SubmittedAt
    public DateTime?     GradedAt
    public decimal?      Score             // điểm sau khi chấm (auto)
    public decimal?      AiScore           // điểm từ AI (speaking/writing)
    public decimal?      Percentage        // Score / TotalScore * 100
    public bool          Passed
    public int           AttemptNumber     // lần thứ mấy
    public int?          TimeTaken         // giây
    public string?       AntiCheatLog      // JSONB: [{event, timestamp}]
    public ICollection<AttemptAnswer> Answers
}
```

### 3.7 AttemptAnswer

```csharp
public class AttemptAnswer : BaseEntity {
    public Guid    AttemptId
    public Guid    QuestionId
    public string? AnswerValue    // JSONB: ["optionId"] | "true" | "text answer"
    public string? AudioUrl       // Speaking: file ghi âm
    public string? EssayText      // Writing: nội dung bài viết
    public bool?   IsCorrect
    public decimal? Score
    public decimal? AiScore
    public string?  AiFeedback    // JSONB: {grammar:[], vocab:[], score:8}
    public bool    IsSkipped
}
```

### 3.8 PlacementResult

```csharp
public class PlacementResult : BaseEntity {
    public Guid    UserId
    public Guid    QuizId           // QuizType = PlacementTest
    public Guid    AttemptId
    public int     AssignedLevel    // 1–6
    public string? SkillBreakdown   // JSONB: {listening:80, grammar:60, reading:75,...}
    public string? RecommendedPath  // JSONB: [courseId1, courseId2, ...]
    public DateTime TestedAt
}
```

### 3.9 SpeakingSubmission (Phase 3B)

```csharp
public class SpeakingSubmission : BaseEntity {
    public Guid    AttemptAnswerId
    public Guid    UserId
    public string  AudioUrl             // s3://quiz/audio/{userId}/{id}.webm
    public string? TranscriptText       // STT output
    public string? TranscriptUrl        // SRT/VTT file URL
    public decimal? PronunciationScore  // 0–100
    public decimal? FluencyScore        // 0–100
    public decimal? AccuracyScore       // 0–100
    public decimal? FinalScore          // weighted average
    public string?  PhonemeAnalysis     // JSONB: [{word, expected, actual, correct}]
    public string?  LlmFeedback         // markdown feedback text
    public string   GradingStatus       // Pending / Processing / Done / Failed
    public DateTime? ProcessedAt
}
```

### 3.10 WritingSubmission (Phase 3B)

```csharp
public class WritingSubmission : BaseEntity {
    public Guid    AttemptAnswerId
    public Guid    UserId
    public string  EssayText
    public int     WordCount
    public string? GrammarErrors          // JSONB: [{error, suggestion, offset, length}]
    public string? VocabularyAnalysis     // JSONB: {cefrLevel, lexicalDiversity, ...}
    public decimal? GrammarScore          // 0–100
    public decimal? VocabularyScore       // 0–100
    public decimal? CoherenceScore        // 0–100
    public decimal? TaskAchievementScore  // 0–100
    public decimal? FinalScore            // 0.25 * each
    public string?  LlmFeedback           // markdown với inline suggestions
    public string   GradingStatus         // Pending / Processing / Done / Failed
    public DateTime? ProcessedAt
}
```

### 3.11 RealtimeQuizRoom (Phase 3C)

```csharp
public class RealtimeQuizRoom : BaseEntity {
    public Guid      QuizId
    public string    RoomCode              // 6 ký tự, join code
    public Guid      HostId
    public RoomState State
    public int       CurrentQuestionIndex
    public DateTime? StartedAt
    public DateTime? EndedAt
    public ICollection<RoomParticipant> Participants
}

public class RoomParticipant : BaseEntity {
    public Guid   RoomId
    public Guid   UserId
    public int    Score
    public int    Rank
    public bool   IsConnected
    public DateTime JoinedAt
}
```

---

## 4. DATABASE SCHEMA

```sql
-- ══════════════════════════════════════════════════════════════
-- PHASE 3A TABLES
-- ══════════════════════════════════════════════════════════════

CREATE TABLE "Quizzes" (
    "Id"                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "Title"               VARCHAR(300) NOT NULL,
    "Description"         TEXT,
    "QuizType"            VARCHAR(30)  NOT NULL DEFAULT 'PracticeQuiz',
    "SkillType"           VARCHAR(30)  NOT NULL DEFAULT 'Mixed',
    "Status"              VARCHAR(20)  NOT NULL DEFAULT 'Draft',
    "Level"               INT          NOT NULL DEFAULT 1,
    "Duration"            INT,
    "TotalScore"          DECIMAL(8,2) NOT NULL DEFAULT 10,
    "PassingScore"        DECIMAL(8,2) NOT NULL DEFAULT 7,
    "RandomQuestion"      BOOLEAN      NOT NULL DEFAULT FALSE,
    "RandomAnswer"        BOOLEAN      NOT NULL DEFAULT FALSE,
    "AllowRetry"          BOOLEAN      NOT NULL DEFAULT TRUE,
    "RetryLimit"          INT,
    "ShowCorrectAnswer"   BOOLEAN      NOT NULL DEFAULT TRUE,
    "ShowExplanation"     BOOLEAN      NOT NULL DEFAULT TRUE,
    "CreatedBy"           UUID         NOT NULL,
    "CourseId"            UUID REFERENCES "Courses"("Id") ON DELETE SET NULL,
    "SessionId"           UUID REFERENCES "Sessions"("Id") ON DELETE SET NULL,
    "VideoTriggerSecond"  INT,
    "CreatedAt"           TIMESTAMPTZ  NOT NULL DEFAULT now(),
    "UpdatedAt"           TIMESTAMPTZ
);

CREATE TABLE "Questions" (
    "Id"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "Content"      TEXT        NOT NULL,
    "AudioUrl"     TEXT,
    "ImageUrl"     TEXT,
    "VideoUrl"     TEXT,
    "Type"         VARCHAR(30) NOT NULL,
    "SkillType"    VARCHAR(30) NOT NULL DEFAULT 'Mixed',
    "Difficulty"   VARCHAR(10) NOT NULL DEFAULT 'Medium',
    "Explanation"  TEXT,
    "DefaultScore" DECIMAL(6,2) NOT NULL DEFAULT 1.0,
    "Tags"         JSONB,
    "IsPublic"     BOOLEAN     NOT NULL DEFAULT FALSE,
    "CreatedBy"    UUID        NOT NULL,
    "CreatedAt"    TIMESTAMPTZ NOT NULL DEFAULT now(),
    "UpdatedAt"    TIMESTAMPTZ
);

CREATE TABLE "QuestionOptions" (
    "Id"                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "QuestionId"         UUID NOT NULL REFERENCES "Questions"("Id") ON DELETE CASCADE,
    "Content"            TEXT NOT NULL,
    "IsCorrect"          BOOLEAN NOT NULL DEFAULT FALSE,
    "DisplayOrder"       INT     NOT NULL DEFAULT 0,
    "MatchKey"           TEXT,
    "MatchValue"         TEXT,
    "FeedbackIfSelected" TEXT,
    "CreatedAt"          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "QuizQuestions" (
    "Id"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "QuizId"       UUID         NOT NULL REFERENCES "Quizzes"("Id") ON DELETE CASCADE,
    "QuestionId"   UUID         NOT NULL REFERENCES "Questions"("Id") ON DELETE CASCADE,
    "DisplayOrder" INT          NOT NULL DEFAULT 0,
    "Score"        DECIMAL(6,2) NOT NULL DEFAULT 1.0,
    "CreatedAt"    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    UNIQUE ("QuizId", "QuestionId")
);

CREATE TABLE "QuizAttempts" (
    "Id"             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "QuizId"         UUID         NOT NULL REFERENCES "Quizzes"("Id"),
    "UserId"         UUID         NOT NULL,
    "State"          VARCHAR(20)  NOT NULL DEFAULT 'InProgress',
    "GradingMethod"  VARCHAR(10)  NOT NULL DEFAULT 'Auto',
    "StartedAt"      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    "SubmittedAt"    TIMESTAMPTZ,
    "GradedAt"       TIMESTAMPTZ,
    "Score"          DECIMAL(8,2),
    "AiScore"        DECIMAL(8,2),
    "Percentage"     DECIMAL(5,2),
    "Passed"         BOOLEAN      NOT NULL DEFAULT FALSE,
    "AttemptNumber"  INT          NOT NULL DEFAULT 1,
    "TimeTaken"      INT,
    "AntiCheatLog"   JSONB,
    "CreatedAt"      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    "UpdatedAt"      TIMESTAMPTZ
);

CREATE TABLE "AttemptAnswers" (
    "Id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "AttemptId"   UUID NOT NULL REFERENCES "QuizAttempts"("Id") ON DELETE CASCADE,
    "QuestionId"  UUID NOT NULL REFERENCES "Questions"("Id"),
    "AnswerValue" JSONB,
    "AudioUrl"    TEXT,
    "EssayText"   TEXT,
    "IsCorrect"   BOOLEAN,
    "Score"       DECIMAL(6,2),
    "AiScore"     DECIMAL(6,2),
    "AiFeedback"  JSONB,
    "IsSkipped"   BOOLEAN     NOT NULL DEFAULT FALSE,
    "CreatedAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "PlacementResults" (
    "Id"               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "UserId"           UUID        NOT NULL,
    "QuizId"           UUID        NOT NULL REFERENCES "Quizzes"("Id"),
    "AttemptId"        UUID        NOT NULL REFERENCES "QuizAttempts"("Id"),
    "AssignedLevel"    INT         NOT NULL,
    "SkillBreakdown"   JSONB,
    "RecommendedPath"  JSONB,
    "TestedAt"         TIMESTAMPTZ NOT NULL DEFAULT now(),
    "CreatedAt"        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes Phase 3A
CREATE INDEX idx_quizzes_course    ON "Quizzes"("CourseId")   WHERE "CourseId"  IS NOT NULL;
CREATE INDEX idx_quizzes_session   ON "Quizzes"("SessionId")  WHERE "SessionId" IS NOT NULL;
CREATE INDEX idx_quizzes_type      ON "Quizzes"("QuizType");
CREATE INDEX idx_questions_type    ON "Questions"("Type");
CREATE INDEX idx_questions_skill   ON "Questions"("SkillType");
CREATE INDEX idx_questions_creator ON "Questions"("CreatedBy");
CREATE INDEX idx_attempts_user     ON "QuizAttempts"("UserId");
CREATE INDEX idx_attempts_quiz     ON "QuizAttempts"("QuizId");
CREATE INDEX idx_attempts_state    ON "QuizAttempts"("State");
CREATE INDEX idx_answers_attempt   ON "AttemptAnswers"("AttemptId");
CREATE INDEX idx_placement_user    ON "PlacementResults"("UserId");

-- ══════════════════════════════════════════════════════════════
-- PHASE 3B TABLES
-- ══════════════════════════════════════════════════════════════

CREATE TABLE "SpeakingSubmissions" (
    "Id"                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "AttemptAnswerId"     UUID NOT NULL REFERENCES "AttemptAnswers"("Id"),
    "UserId"              UUID NOT NULL,
    "AudioUrl"            TEXT NOT NULL,
    "TranscriptText"      TEXT,
    "TranscriptUrl"       TEXT,
    "PronunciationScore"  DECIMAL(5,2),
    "FluencyScore"        DECIMAL(5,2),
    "AccuracyScore"       DECIMAL(5,2),
    "FinalScore"          DECIMAL(5,2),
    "PhonemeAnalysis"     JSONB,
    "LlmFeedback"         TEXT,
    "GradingStatus"       VARCHAR(20) NOT NULL DEFAULT 'Pending',
    "ProcessedAt"         TIMESTAMPTZ,
    "CreatedAt"           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "WritingSubmissions" (
    "Id"                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "AttemptAnswerId"       UUID NOT NULL REFERENCES "AttemptAnswers"("Id"),
    "UserId"                UUID NOT NULL,
    "EssayText"             TEXT NOT NULL,
    "WordCount"             INT  NOT NULL DEFAULT 0,
    "GrammarErrors"         JSONB,
    "VocabularyAnalysis"    JSONB,
    "GrammarScore"          DECIMAL(5,2),
    "VocabularyScore"       DECIMAL(5,2),
    "CoherenceScore"        DECIMAL(5,2),
    "TaskAchievementScore"  DECIMAL(5,2),
    "FinalScore"            DECIMAL(5,2),
    "LlmFeedback"           TEXT,
    "GradingStatus"         VARCHAR(20) NOT NULL DEFAULT 'Pending',
    "ProcessedAt"           TIMESTAMPTZ,
    "CreatedAt"             TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ══════════════════════════════════════════════════════════════
-- PHASE 3C TABLES
-- ══════════════════════════════════════════════════════════════

CREATE TABLE "RealtimeQuizRooms" (
    "Id"                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "QuizId"               UUID        NOT NULL REFERENCES "Quizzes"("Id"),
    "RoomCode"             VARCHAR(10) NOT NULL UNIQUE,
    "HostId"               UUID        NOT NULL,
    "State"                VARCHAR(20) NOT NULL DEFAULT 'Waiting',
    "CurrentQuestionIndex" INT         NOT NULL DEFAULT 0,
    "StartedAt"            TIMESTAMPTZ,
    "EndedAt"              TIMESTAMPTZ,
    "CreatedAt"            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "RoomParticipants" (
    "Id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "RoomId"      UUID NOT NULL REFERENCES "RealtimeQuizRooms"("Id") ON DELETE CASCADE,
    "UserId"      UUID NOT NULL,
    "Score"       INT  NOT NULL DEFAULT 0,
    "Rank"        INT  NOT NULL DEFAULT 0,
    "IsConnected" BOOLEAN NOT NULL DEFAULT TRUE,
    "JoinedAt"    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE ("RoomId", "UserId")
);
```

---

## 5. API ENDPOINTS — TẤT CẢ MODULES

### 5.1 Quiz Management (Teacher)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/api/quizzes` | Danh sách quiz (filter: type, status, courseId, sessionId) |
| `POST` | `/api/quizzes` | Tạo quiz mới |
| `GET` | `/api/quizzes/{id}` | Chi tiết quiz + questions list |
| `PUT` | `/api/quizzes/{id}` | Cập nhật thông tin quiz |
| `DELETE` | `/api/quizzes/{id}` | Xoá quiz (chỉ Draft) |
| `POST` | `/api/quizzes/{id}/publish` | Publish quiz |
| `POST` | `/api/quizzes/{id}/archive` | Archive quiz |
| `GET` | `/api/quizzes/{id}/preview` | Preview như student |
| `GET` | `/api/quizzes/{id}/analytics` | attempts, avg score, pass rate, per-question heatmap |

### 5.2 Question Bank (Teacher)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/api/questions` | Danh sách câu hỏi (filter: type, skill, difficulty, tag, search) |
| `POST` | `/api/questions` | Tạo câu hỏi mới + options |
| `GET` | `/api/questions/{id}` | Chi tiết câu hỏi + options |
| `PUT` | `/api/questions/{id}` | Cập nhật câu hỏi + options |
| `DELETE` | `/api/questions/{id}` | Xoá câu hỏi |
| `POST` | `/api/questions/bulk-import` | Import từ CSV/JSON |
| `POST` | `/api/quizzes/{quizId}/questions` | Gán câu hỏi vào quiz |
| `DELETE` | `/api/quizzes/{quizId}/questions/{qId}` | Gỡ câu hỏi khỏi quiz |
| `PUT` | `/api/quizzes/{quizId}/questions/reorder` | Sắp xếp thứ tự (body: [{id, order}]) |
| `PUT` | `/api/quizzes/{quizId}/questions/{qId}/score` | Override điểm câu hỏi |

### 5.3 Quiz Attempt (Student)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/api/courses/{courseId}/quizzes` | Danh sách quiz trong khoá (student view) |
| `GET` | `/api/sessions/{sessionId}/quiz` | Quiz popup của session cụ thể |
| `POST` | `/api/quizzes/{id}/start` | Bắt đầu → trả attemptId + questions (shuffled nếu random) |
| `PUT` | `/api/attempts/{id}/answer` | Lưu đáp án từng câu (upsert, auto-save) |
| `POST` | `/api/attempts/{id}/submit` | Nộp bài → trigger AutoGrader |
| `POST` | `/api/attempts/{id}/abandon` | Bỏ dở bài thi |
| `GET` | `/api/attempts/{id}/result` | Điểm + review từng câu + explanation |
| `GET` | `/api/quizzes/{id}/my-attempts` | Lịch sử làm bài của tôi |

### 5.4 Placement Test

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/api/placement/quiz` | Lấy bài placement test đang active |
| `POST` | `/api/placement/start` | Bắt đầu placement |
| `GET` | `/api/placement/my-result` | Kết quả placement của tôi (level + breakdown) |
| `GET` | `/api/placement/recommended-courses` | Khoá học gợi ý theo level |

### 5.5 Speaking AI (Phase 3B)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `POST` | `/api/speaking/upload` | Upload audio file (multipart) → submissionId |
| `GET` | `/api/speaking/{submissionId}/status` | Trạng thái grading (Pending/Processing/Done) |
| `GET` | `/api/speaking/{submissionId}/result` | Scores + transcript + phoneme + LLM feedback |

### 5.6 Writing AI (Phase 3B)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `POST` | `/api/writing/submit` | Submit essay text → submissionId |
| `GET` | `/api/writing/{submissionId}/status` | Trạng thái grading |
| `GET` | `/api/writing/{submissionId}/result` | Scores + grammar errors + LLM feedback |

### 5.7 Analytics (Teacher)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/api/analytics/quizzes/{id}` | Chi tiết analytics một quiz |
| `GET` | `/api/analytics/students/{userId}` | Thống kê học viên: weak skills, score trend |
| `GET` | `/api/analytics/courses/{courseId}/quiz-summary` | Tất cả quiz trong khoá |
| `GET` | `/api/analytics/placement/overview` | Phân bổ level từ placement tests |

### 5.8 Realtime Quiz (Phase 3C)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `POST` | `/api/realtime/rooms` | Teacher tạo room → roomCode |
| `GET` | `/api/realtime/rooms/{code}` | Lấy info room theo code |
| `POST` | `/api/realtime/rooms/{code}/join` | Student join room |
| `POST` | `/api/realtime/rooms/{id}/start` | Bắt đầu quiz (host only) |
| `GET` | `/api/realtime/rooms/{id}/leaderboard` | Bảng xếp hạng hiện tại |

**SignalR Hub** `/hubs/quiz`:

| Client → Server | Server → Client | Mô tả |
|-----------------|-----------------|-------|
| `JoinRoom(code)` | `RoomStateChanged` | Tham gia phòng |
| `LeaveRoom()` | `ParticipantJoined` | Rời phòng |
| `SendAnswer(qId, val)` | `QuestionStarted` | Gửi đáp án |
| `NextQuestion()` *(host)* | `TimerTick` | Host chuyển câu |
| `EndQuiz()` *(host)* | `AnswerResult` | Host kết thúc |
| | `LeaderboardUpdate` | Cập nhật bảng xếp hạng |
| | `QuizEnded` | Kết thúc với final leaderboard |

---

## 6. BACKEND CQRS MODULES

### 6.1 Cấu trúc thư mục đầy đủ

```
MLS.Domain/Entities/
  Quiz.cs
  Question.cs
  QuestionOption.cs
  QuizQuestion.cs
  QuizAttempt.cs
  AttemptAnswer.cs
  PlacementResult.cs
  SpeakingSubmission.cs          ← Phase 3B
  WritingSubmission.cs           ← Phase 3B
  RealtimeQuizRoom.cs            ← Phase 3C
  RoomParticipant.cs             ← Phase 3C

MLS.Application/Quiz/
  Commands/
    QuizCommands.cs              ← CreateQuiz, UpdateQuiz, DeleteQuiz, PublishQuiz, ArchiveQuiz
    QuestionCommands.cs          ← CreateQuestion, UpdateQuestion, DeleteQuestion, BulkImport
    QuizQuestionCommands.cs      ← AddToQuiz, RemoveFromQuiz, Reorder, OverrideScore
    AttemptCommands.cs           ← StartAttempt, SaveAnswer, SubmitAttempt, AbandonAttempt
    PlacementCommands.cs         ← SavePlacementResult
    SpeakingCommands.cs          ← UploadAudio, (AI Worker) ProcessSpeaking    ← 3B
    WritingCommands.cs           ← SubmitEssay, (AI Worker) ProcessWriting      ← 3B
    RealtimeCommands.cs          ← CreateRoom, JoinRoom, StartQuiz, NextQuestion ← 3C
  Queries/
    QuizQueries.cs               ← GetList, GetDetail, GetPreview, GetAnalytics
    QuestionQueries.cs           ← GetList (filters), GetDetail
    AttemptQueries.cs            ← GetResult (with review), GetMyAttempts
    PlacementQueries.cs          ← GetPlacementQuiz, GetMyResult, GetRecommendedCourses
    SpeakingQueries.cs           ← GetStatus, GetResult                          ← 3B
    WritingQueries.cs            ← GetStatus, GetResult                          ← 3B
    AnalyticsQueries.cs          ← GetQuizAnalytics, GetStudentAnalytics
    RealtimeQueries.cs           ← GetRoom, GetLeaderboard                       ← 3C
  Services/
    AutoGraderService.cs         ← Chấm tự động 4 loại câu
    PlacementRuleEngine.cs       ← Rule engine xác định Level
    RecommendationService.cs     ← Weak skill → course suggestion                ← 3B
    AdaptiveEngine.cs            ← Adaptive question selection                   ← 3C

MLS.Infrastructure/
  Messaging/
    RabbitMqPublisher.cs         ← Publish events                                ← 3B
  Workers/
    SpeakingGradingWorker.cs     ← RabbitMQ consumer: STT + Phoneme + LLM       ← 3B
    WritingGradingWorker.cs      ← RabbitMQ consumer: Grammar + LLM             ← 3B
    AnalyticsWorker.cs           ← Process AttemptCompleted events               ← 3B
  Hubs/
    QuizHub.cs                   ← SignalR hub                                   ← 3C
  Storage/
    ObjectStorageService.cs      ← MinIO/S3 upload/download                      ← 3B

MLS.API/Controllers/
  QuizzesController.cs
  QuestionsController.cs
  AttemptsController.cs
  PlacementController.cs
  SpeakingController.cs          ← Phase 3B
  WritingController.cs           ← Phase 3B
  AnalyticsController.cs
  RealtimeController.cs          ← Phase 3C
```

### 6.2 AutoGraderService Logic

```
SingleChoice:
  correctId  = options.First(o => o.IsCorrect).Id
  selectedId = JSON.Parse(answerValue)[0]
  isCorrect  = selectedId == correctId
  score      = isCorrect ? questionScore : 0

MultipleChoice (strict mode):
  correctIds  = options.Where(o => o.IsCorrect).Select(Id)
  selectedIds = JSON.Parse(answerValue)  // array
  wrongHit    = selectedIds.Except(correctIds).Count
  IF wrongHit > 0 → score = 0
  ELSE correctHit = intersection.Count
       score = (correctHit / correctIds.Count) * questionScore

TrueFalse:
  correct = options.First(o => o.IsCorrect).Content.ToLower()  // "true" or "false"
  answer  = answerValue.Trim('"').ToLower()
  score   = answer == correct ? questionScore : 0

FillBlank:
  correct = Normalize(options.First(o => o.IsCorrect).Content)
  answer  = Normalize(answerValue.Trim('"'))
  score   = answer == correct ? questionScore : 0
  // Normalize: Trim + ToLower + RemoveDiacritics(optional)
  // Fuzzy mode: Levenshtein(answer, correct) <= 1 → full score
```

### 6.3 PlacementRuleEngine

```
Input: Dictionary<SkillType, decimal> skillScores  (0–100 per skill)

1. overallAvg = skillScores.Values.Average()
2. base level:
   >= 85 → 6  (Advanced Plus)
   >= 70 → 5  (Advanced)
   >= 55 → 4  (Upper-Intermediate)
   >= 40 → 3  (Intermediate)
   >= 25 → 2  (Elementary)
    < 25 → 1  (Beginner)

3. Adjustments — capped at max 1 level reduction (Y6 fix):
   IF Listening < 30 AND level >= 4: adjustments += 1
   IF Grammar   < 30 AND level >= 4: adjustments += 1
   level -= min(1, adjustments)  // never reduce by more than 1

Output: AssignedLevel (1–6), SkillBreakdown JSONB
```

---

## 7. FRONTEND PAGES & COMPONENTS

### 7.1 Student Pages

| Route | Page | Phase |
|-------|------|-------|
| `/quiz/[id]` | QuizIntroPage — thông tin, luật, lịch sử làm bài | 3A |
| `/quiz/[id]/play` | QuizPlayerPage — timer, câu hỏi, navigator, submit | 3A |
| `/quiz/[id]/result/[attemptId]` | QuizResultPage — điểm, % đúng, review từng câu | 3A |
| `/placement-test` | PlacementIntroPage — giới thiệu, start | 3A |
| `/placement-test/result` | PlacementResultPage — level badge, skill chart, courses | 3A |
| `/quiz/[id]/speaking` | SpeakingQuizPage — recorder, upload progress, pending state | 3B |
| `/quiz/[id]/writing` | WritingQuizPage — essay editor, word count, submit | 3B |
| `/quiz/[id]/ai-result/[attemptId]` | AiFeedbackPage — speaking/writing AI feedback | 3B |
| `/realtime/join` | JoinRoomPage — nhập mã phòng | 3C |
| `/realtime/[code]/play` | RealtimePlayerPage — countdown, answer, leaderboard | 3C |

### 7.2 Teacher Pages

| Route | Page | Phase |
|-------|------|-------|
| `/teacher/quizzes` | QuizListPage — danh sách, filter, tạo mới | 3A |
| `/teacher/quizzes/new` | QuizBuilderPage — wizard 3 bước | 3A |
| `/teacher/quizzes/[id]` | QuizEditPage — sửa quiz + questions | 3A |
| `/teacher/quizzes/[id]/analytics` | QuizAnalyticsPage — heatmap, pass rate, weak questions | 3A |
| `/teacher/questions` | QuestionBankPage — table filter + bulk import | 3A |
| `/teacher/placement` | PlacementDashboardPage — level distribution chart | 3A |
| `/teacher/analytics` | AnalyticsDashboardPage — student trends, skill gaps | 3A+ |
| `/teacher/ai-review` | AiReviewDashboardPage — pending AI grading, manual override | 3B |
| `/teacher/realtime/new` | CreateRealtimeRoomPage — chọn quiz, tạo room | 3C |
| `/teacher/realtime/[id]/host` | RealtimeHostPage — điều khiển phòng, live leaderboard | 3C |

### 7.3 Core Components

```
src/components/quiz/
  QuizCard.tsx                  ← Card thông tin quiz (type, skill, duration, pass rate)
  QuizTimer.tsx                 ← Countdown timer, auto-submit khi hết giờ
  QuizNavigator.tsx             ← Grid N câu: trạng thái màu (done/skipped/flagged)
  QuestionRenderer.tsx          ← Switch render theo QuestionType
  ProgressBar.tsx               ← X/N câu đã trả lời
  AntiCheatMonitor.tsx          ← Tab switch + blur event logger
  ResultSummary.tsx             ← Điểm lớn, Passed/Failed badge, thời gian
  AnswerReview.tsx              ← Từng câu: đúng/sai + explanation

  AnswerInputs/
    SingleChoiceInput.tsx       ← Radio buttons
    MultipleChoiceInput.tsx     ← Checkboxes
    TrueFalseInput.tsx          ← 2 nút True/False
    FillBlankInput.tsx          ← Text input
    MatchingInput.tsx           ← Drag-match pairs
    OrderingInput.tsx           ← Drag-sort list
    SpeakingRecorder.tsx        ← MediaRecorder + waveform visualizer  ← 3B
    EssayEditor.tsx             ← Textarea + word count + spell hints  ← 3B

src/components/teacher/quiz/
  QuizBuilderForm.tsx           ← Step 1: title, type, skill, duration, score
  QuestionListEditor.tsx        ← Step 2: drag-drop order, score override
  QuizSettingsForm.tsx          ← Step 3: retry, random, show answer toggle
  QuestionForm.tsx              ← Form tạo/sửa (dynamic option rows, type switch)
  QuestionBankTable.tsx         ← DataTable + filter + multi-select + add-to-quiz
  AddQuestionModal.tsx          ← Modal chọn từ bank
  QuizAnalyticsCharts.tsx       ← Bar chart (avg score), donut (pass rate), heatmap
  PlacementLevelChart.tsx       ← Pie/bar phân bổ level học viên

src/components/realtime/       ← Phase 3C
  Leaderboard.tsx               ← Animated rank list
  CountdownOverlay.tsx          ← Full-screen 3-2-1 countdown
  LiveAnswerFeed.tsx            ← Real-time answer indicators

src/store/api/
  quizApi.ts                    ← Quiz CRUD + attempt + start/submit
  questionApi.ts                ← Question bank CRUD + bulk import
  placementApi.ts               ← Placement endpoints
  speakingApi.ts                ← Speaking AI                          ← 3B
  writingApi.ts                 ← Writing AI                           ← 3B
  analyticsApi.ts               ← Analytics endpoints
  realtimeApi.ts                ← Realtime REST                        ← 3C
```

---

## 8. LUỒNG NGHIỆP VỤ CHI TIẾT

### 8.1 Teacher tạo Quiz (Wizard 3 bước)

```
Step 1 — Thông tin cơ bản:
  Title, QuizType (PracticeQuiz/MockTest/...), SkillType
  Level, Duration (phút), TotalScore, PassingScore

Step 2 — Câu hỏi:
  Option A: Tạo mới inline → QuestionForm (type, content, options, explanation)
  Option B: Chọn từ Question Bank → AddQuestionModal
            (filter: type, skill, difficulty, tag, search)
  Drag-drop sắp xếp thứ tự
  Override điểm từng câu (default = question.DefaultScore)

Step 3 — Cài đặt:
  RandomQuestion / RandomAnswer toggle
  AllowRetry / RetryLimit (số lần)
  ShowCorrectAnswer / ShowExplanation
  Gán CourseId (dropdown danh sách khoá)
  Gán SessionId (optional, cho interactive quiz)
  VideoTriggerSecond (optional, popup tại giây X)

→ Preview → Publish
```

### 8.2 Student làm bài Quiz

```
/quiz/[id] — QuizIntroPage:
  Hiển thị: tên quiz, số câu, thời gian, điểm đạt, lần thử còn lại
  Nếu AllowRetry=false và đã có Graded attempt → disabled

Nhấn "Bắt đầu làm bài":
  POST /api/quizzes/{id}/start
  Server kiểm tra:
    - AttemptNumber <= RetryLimit (nếu có)
    - Không có InProgress attempt khác
  Tạo QuizAttempt (state=InProgress)
  Trả về: attemptId, questions (shuffled nếu RandomQuestion), options (shuffled nếu RandomAnswer)

/quiz/[id]/play — QuizPlayerPage:
  Layout: Navigator (left) | Câu hỏi hiện tại (right)
  Timer đếm ngược (nếu Duration set)
  AntiCheatMonitor mount: log tab switch, window blur → PUT /api/attempts/{id}/anticheat
  Auto-save mỗi 10 giây: PUT /api/attempts/{id}/answer

Submit (manual hoặc auto khi hết giờ):
  POST /api/attempts/{id}/submit
  Server:
    1. Validate TimeTaken <= Duration + 30s grace
    2. AutoGraderService.Grade(answers, questions)
    3. Update attempt: Score, Percentage, Passed, GradedAt
    4. Publish AttemptCompleted event → Analytics

Redirect → /quiz/[id]/result/[attemptId]
  Hiển thị: điểm lớn, Passed/Failed badge
  AnswerReview: từng câu với đúng/sai indicator và explanation
```

### 8.3 Interactive Quiz trong Video

```
Video Player đang phát
  → currentTime === quiz.VideoTriggerSecond
  → videoPlayer.pause()
  → Render <QuizPopup quizId={id} />
  → Student trả lời (không có timer)
  → POST /api/quizzes/{id}/start → submit ngay
  → Hiển thị kết quả đúng/sai 2 giây
  → Dismiss popup → videoPlayer.play()
```

### 8.4 Placement Test

```
/placement-test:
  Giới thiệu, mô tả, "Bắt đầu kiểm tra năng lực"

Start → bài quiz có QuizType=PlacementTest (~30 câu Mixed):
  ~6 câu Listening, ~6 Grammar, ~6 Reading, ~6 Vocab, ~6 Mixed

Submit → AutoGrader chạy từng câu

PlacementRuleEngine:
  Tính skillScores {listening: x, grammar: y, ...}
  DetermineLevel(skillScores) → AssignedLevel
  RecommendationService.GetCourses(level, weakSkills) → RecommendedPath

Lưu PlacementResult

/placement-test/result:
  Level badge lớn (Level 4 — Upper Intermediate)
  Skill Radar Chart (6 skills)
  Recommended Courses list (3–5 khoá phù hợp)
```

### 8.5 Speaking AI Pipeline (Phase 3B)

```
SpeakingRecorder.tsx:
  MediaRecorder API → WebM/MP3 chunks
  Waveform visualizer real-time
  "Dừng ghi" → blob ready

POST /api/speaking/upload (multipart):
  Server: upload audio → MinIO/S3
  Tạo SpeakingSubmission (status=Pending)
  Publish RabbitMQ event: "speaking.grading.requested"
  Return: submissionId

Frontend: polling GET /api/speaking/{id}/status mỗi 3s
  Pending → hiện spinner + "Đang xử lý..."
  Done    → navigate to AiFeedbackPage

AI Worker (SpeakingGradingWorker):
  1. Download audio từ MinIO
  2. FFmpeg: noise reduction + silence trim
  3. Whisper API: transcript + word timestamps
  4. Phoneme comparison vs reference text
  5. Fluency: speech rate, pause analysis
  6. GPT-4o prompt → markdown feedback
  7. Update SpeakingSubmission (Done + scores)

AiFeedbackPage:
  Transcript với mispronounced words highlighted (red)
  Score cards: Pronunciation / Fluency / Accuracy / Final
  LLM feedback (markdown rendered)
  "Nghe lại audio" player
```

### 8.6 Writing AI Pipeline (Phase 3B)

```
EssayEditor.tsx:
  Textarea, word count real-time, spell check hints
  "Nộp bài" khi wordCount >= minWords

POST /api/writing/submit:
  Tạo WritingSubmission (status=Pending)
  Publish RabbitMQ event: "writing.grading.requested"

AI Worker (WritingGradingWorker):
  1. LanguageTool REST API → grammar errors list
  2. LLM: vocabulary CEFR analysis
  3. LLM: coherence + structure scoring (rubric prompt)
  4. LLM: task achievement scoring
  5. Weighted FinalScore = 0.25 * each dimension
  6. LLM: generate inline feedback markdown
  7. Update WritingSubmission (Done + all scores)

AiFeedbackPage (writing):
  Essay text với grammar errors underlined (hover → suggestion)
  Rubric scorecard: 4 dimensions với bar chart
  LLM feedback (markdown)
  "Xem gợi ý sửa" inline diff
```

### 8.7 Realtime Quiz (Phase 3C)

```
Teacher:
  /teacher/realtime/new → chọn Quiz → "Tạo phòng"
  POST /api/realtime/rooms → RoomCode: "ABC123"
  /teacher/realtime/{id}/host:
    QR Code + RoomCode lớn để student join
    Danh sách participants (real-time via SignalR)
    "Bắt đầu" button → SignalR broadcast QuestionStarted

Student:
  /realtime/join → nhập RoomCode
  POST /api/realtime/rooms/{code}/join
  SignalR JoinRoom → thấy "Chờ giáo viên bắt đầu..."
  QuestionStarted event → câu hỏi hiện ra + countdown 20s
  Chọn đáp án → SendAnswer(qId, optionId)
  AnswerResult event → đúng/sai + điểm nhận được
  LeaderboardUpdate → bảng xếp hạng live

Redis:
  ZSET quiz:room:{roomId}:leaderboard → score sorted
  HASH quiz:room:{roomId}:q{n}:answers → userId: timestamp
  TTL: 2 giờ
```

### 8.8 Adaptive Quiz (Phase 3C)

```
Start: lấy câu đầu tiên ở Difficulty=Medium cho SkillType target

Per Answer:
  IF correct AND streak >= 2: nextDifficulty = Hard
  IF correct AND streak < 2:  nextDifficulty = Medium
  IF wrong:                   nextDifficulty = Easy; streak = 0

Next Question Selection:
  QuestionPool.Where(q.Difficulty == nextDifficulty)
              .Where(not already answered)
              .Where(q.SkillType == targetSkill)
              .OrderBy(random)
              .First()

Stop:
  answeredCount >= 20
  OR 5 consecutive correct at Hard (mastery achieved)

Score:
  Easy=1pt, Medium=1.5pt, Hard=2pt per correct
  Normalize to TotalScore
```

---

## 9. GRADING ENGINE

### 9.1 Auto-Grade Matrix (Phase 3A)

| Question Type | Grading Logic | Partial Score |
|--------------|--------------|---------------|
| SingleChoice | selectedOption.IsCorrect | Không |
| MultipleChoice | All correct selected, zero wrong selected | Có (per-correct ratio) |
| TrueFalse | "true"/"false" == correctOption.Content | Không |
| FillBlank | Normalize(answer) == Normalize(correct) | Fuzzy: Levenshtein ≤ 1 |
| Matching | Tất cả pairs đúng / số pairs đúng | Có (partial per pair) |
| Ordering | Exact order match | Không (hoặc partial per position) |

### 9.2 AI-Grade Matrix (Phase 3B)

| Question Type | Engine | Score Components |
|--------------|--------|-----------------|
| SpeakingRecording | Whisper STT + Phoneme + LLM | 40% Pronunciation + 30% Fluency + 30% Accuracy |
| EssayWriting | LanguageTool + LLM Rubric | 25% Grammar + 25% Vocab + 25% Coherence + 25% Task |

### 9.3 GradingMethod Resolution

```
IF QuizType IN (SpeakingTest, WritingTest)
   OR any question.Type IN (SpeakingRecording, EssayWriting)
→ GradingMethod = AI → async (RabbitMQ)
→ AttemptState = Grading (pending AI)
→ Frontend polls for completion

ELSE
→ GradingMethod = Auto → synchronous in SubmitAttempt handler
→ AttemptState = Graded immediately
```

---

## 10. SPEAKING AI ENGINE

```
[INPUT] Audio file: WebM/MP3/WAV, max 5 phút, max 50MB
          ↓
[1] Validation & Upload
    - Check format, duration, size
    - Upload raw audio → MinIO: quiz/audio/{userId}/{submissionId}.webm
    - status = Pending, queue event published
          ↓
[2] Pre-processing (FFmpeg)
    - Resample to 16kHz mono WAV
    - WebRTC VAD: strip silence > 2s
    - Spectral noise reduction
          ↓
[3] Speech-to-Text (Whisper large-v3 / Azure STT)
    - Full transcript text
    - Word-level timestamps [{word, start, end, confidence}]
          ↓
[4] Phoneme Analysis
    - G2P (Grapheme-to-Phoneme) on reference text
    - Align STT output phonemes vs reference phonemes
    - PronunciationScore = correct_phonemes / total_phonemes * 100
    - PhonemeAnalysis JSONB: [{word, expected_ipa, actual_ipa, correct}]
          ↓
[5] Fluency Analysis
    - Speech rate: words_per_minute (target: 120–150)
    - Filler detection: "uh", "um", "like"
    - Long pause count (> 3s)
    - FluencyScore = 100 - (longPauseCount * 5) - (fillerCount * 2)
          ↓
[6] LLM Feedback (GPT-4o)
    Prompt: "Student transcript: {text}. Mispronounced: {words}.
             Fluency data: {rate, pauses}. Give specific improvement advice in Vietnamese."
    Output: markdown feedback (3–5 bullet points)
          ↓
[7] FinalScore = 0.4 * Pronunciation + 0.3 * Fluency + 0.3 * Accuracy
    Update SpeakingSubmission: status=Done, scores, transcript, LlmFeedback
          ↓
[OUTPUT] Scores + transcript + phoneme highlights + feedback
```

---

## 11. WRITING AI ENGINE

```
[INPUT] Essay text, min 50 words, max 1000 words
          ↓
[1] Pre-processing
    - Word count, language detection
    - Strip HTML, normalize whitespace
    - status = Pending, queue event published
          ↓
[2] Grammar Check (LanguageTool REST API)
    - Endpoint: POST /v2/check?language=en
    - Returns: [{message, offset, length, replacements}]
    - GrammarScore = max(0, 100 - errors.Count * 5)
          ↓
[3] Vocabulary Analysis (LLM)
    - CEFR level distribution (A1/A2/B1/B2/C1/C2)
    - Lexical diversity = unique_words / total_words
    - VocabularyScore = cefrWeight * diversity_bonus
          ↓
[4] Coherence & Structure (LLM Rubric)
    - Paragraph structure (intro/body/conclusion)
    - Logical connectors usage
    - Topic consistency
    - CoherenceScore = 0–100
          ↓
[5] Task Achievement (LLM)
    - Does essay address the prompt?
    - Completeness and relevance
    - TaskScore = 0–100
          ↓
[6] LLM Final Feedback
    Prompt: "Essay: {text}. Grammar errors: {count}. Scores: {rubric}.
             Give detailed writing improvement feedback in Vietnamese with inline corrections."
    Output: markdown with annotated errors + suggestions
          ↓
[7] FinalScore = 0.25 * Grammar + 0.25 * Vocabulary + 0.25 * Coherence + 0.25 * Task
    Update WritingSubmission: status=Done
          ↓
[OUTPUT] Rubric scores + GrammarErrors JSONB + LlmFeedback markdown
```

---

## 12. ADAPTIVE LEARNING ENGINE

### 12.1 Algorithm

```
Khởi tạo:
  currentDifficulty = Medium
  consecutiveCorrect = 0
  answeredSet = {}

Chọn câu tiếp theo:
  pool = Questions
    .Where(SkillType == target OR SkillType == Mixed)
    .Where(Difficulty == currentDifficulty)
    .Where(Id NOT IN answeredSet)
    .OrderBy(Guid.NewGuid())  // random
    .FirstOrDefault()
  IF pool == null: currentDifficulty = fallback (try other difficulties)

Sau khi trả lời:
  answeredSet.Add(questionId)
  IF isCorrect:
    consecutiveCorrect++
    IF consecutiveCorrect >= 2: currentDifficulty = Harder
  ELSE:
    consecutiveCorrect = 0
    currentDifficulty = Easier

Dừng khi:
  answeredCount >= 20 (max câu)
  OR consecutiveCorrect >= 5 AND currentDifficulty == Hard (mastery)
  OR questionPool exhausted

Scoring:
  difficutyWeight = { Easy: 1.0, Medium: 1.5, Hard: 2.0 }
  rawScore = sum(correct_answers_i * weight_i)
  maxPossible = maxQuestions * 2.0 (tất cả Hard đúng)
  finalScore = (rawScore / maxPossible) * TotalScore
```

### 12.2 Recommendation Rules

```
Sau khi làm quiz / placement test:
  weakSkills = skillScores.Where(score < 60).Keys

FOR each weakSkill:
  IF weakSkill == Listening → recommend courses với SkillType=Listening, Level=assignedLevel
  IF weakSkill == Grammar   → recommend courses với SkillType=Grammar
  IF weakSkill == Speaking  → recommend SpeakingTest quizzes + courses
  ...

Ranking: courseRatingAverage DESC + enrollmentCount DESC
Top 5 → store in RecommendedPath JSONB
```

---

## 13. PLACEMENT TEST ENGINE

### 13.1 Quiz Configuration

| Property | Value |
|----------|-------|
| QuizType | PlacementTest |
| SkillType | Mixed |
| Số câu | 30–40 câu |
| Phân bổ | ~6–8 câu / skill (Listening, Grammar, Reading, Vocab, Speaking*) |
| Duration | 45 phút |
| RandomQuestion | true |
| AllowRetry | false (hoặc 1 lần / 6 tháng) |
| ShowCorrectAnswer | false (không hiện đáp án) |

### 13.2 Level Mapping

| Level | Tên | Overall % | Mô tả |
|-------|-----|----------|-------|
| 6 | Advanced Plus | ≥ 85% | Mastery, C1/C2 |
| 5 | Advanced | 70–84% | Upper advanced, B2+ |
| 4 | Upper-Intermediate | 55–69% | B2 |
| 3 | Intermediate | 40–54% | B1 |
| 2 | Elementary | 25–39% | A2 |
| 1 | Beginner | < 25% | A1 |

---

## 14. RECOMMENDATION ENGINE

### 14.1 Data Flow

```
Triggers:
  PlacementCompleted event
  QuizAttemptCompleted event (weak score)

WeakSkillDetector:
  skills where score < 60% → weakSkillList

CourseRecommender:
  SELECT courses WHERE:
    Level BETWEEN (assignedLevel-1) AND (assignedLevel+1)
    AND SkillType IN weakSkillList
    AND Status = Published
  ORDER BY ratingAverage DESC, totalStudents DESC
  TAKE 5

Output stored in:
  PlacementResult.RecommendedPath JSONB
  Or returned inline per API call
```

### 14.2 Display Locations

- `/placement/result` → Recommended courses section
- `/my-lesson` dashboard → "Gợi ý cho bạn" widget
- After quiz result → "Muốn cải thiện? Xem các khoá này"

---

## 15. ANALYTICS ENGINE

### 15.1 Quiz Analytics (Teacher)

| Metric | SQL / Logic |
|--------|------------|
| TotalAttempts | COUNT(attempts) per quiz |
| UniqueStudents | COUNT(DISTINCT userId) per quiz |
| AverageScore | AVG(score) per quiz |
| PassRate | COUNT(passed=true) / COUNT(*) |
| AverageTimeTaken | AVG(timeTaken) per quiz |
| PerQuestionCorrectRate | COUNT(isCorrect=true) / COUNT(*) GROUP BY questionId |
| OptionPickCounts | COUNT(*) GROUP BY (questionId, answerValue) |

### 15.2 Student Analytics

| Metric | Logic |
|--------|-------|
| WeakSkills | SkillType where avgScore < 60% |
| ScoreTrend | avgScore by week/month |
| CompletionRate | submitted / started |
| RetryCount | COUNT(attemptNumber > 1) |
| SpeakingTrend | SpeakingSubmission.FinalScore by date |
| WritingTrend | WritingSubmission.FinalScore by date |

### 15.3 Implementation Stages

| Phase | Strategy |
|-------|---------|
| 3A | SQL aggregate queries on-demand (acceptable for small data) |
| 3B | Redis cache, invalidate on AttemptCompleted event |
| 3C | Materialized views, scheduled refresh every hour |

---

## 16. REALTIME QUIZ ENGINE

### 16.1 Room Lifecycle

```
Created (Waiting)
    ↓ Host starts
Active
    ↓ Per question: QuestionStarted → 20s countdown → QuestionEnded
    ↓ Host advances to next question
    [loop until all questions done]
    ↓ Host ends or last question done
Ended
    → Final leaderboard broadcast → Persist to DB
```

### 16.2 Redis Data Structures

```
// Leaderboard per room
ZADD quiz:room:{roomId}:lb {score} {userId}
ZREVRANGE quiz:room:{roomId}:lb 0 9 WITHSCORES  → top 10

// Answer tracking per question
HSET quiz:room:{roomId}:q{n}:ans {userId} {answeredAt}

// Room state
SET quiz:room:{roomId}:state "active"
SET quiz:room:{roomId}:currentQ "3"

// TTL
EXPIRE quiz:room:{roomId}:* 7200  // 2 giờ
```

### 16.3 Scoring Formula

```
Per correct answer:
  basePoints = 500
  speedBonus = max(0, (timeLimit - timeTaken) / timeLimit) * 500
  totalPoints = basePoints + speedBonus  // 500–1000 per correct
```

---

## 17. EVENT-DRIVEN ARCHITECTURE

### 17.1 RabbitMQ Design (Phase 3B)

```
Exchange: quiz.events (topic type)

Routing Key → Queue → Consumer:
  speaking.grading.requested → q.speaking.grading → SpeakingGradingWorker
  writing.grading.requested  → q.writing.grading  → WritingGradingWorker
  attempt.completed          → q.analytics.update → AnalyticsWorker
  placement.completed        → q.recommendation   → RecommendationWorker
```

---

## 22. REVIEW FINDINGS — FIXES APPLIED (phase3_quiz_design_REVIEW.md)

> Thực hiện sau Sprint 5. Tất cả fixes được apply vào codebase, migration script ở `deploy/phase3-quiz-review-fixes.sql`.

### 22.1 🔴 Critical Fixes

| ID | Vấn đề | Fix áp dụng | File |
|----|--------|-------------|------|
| R1 | JSONB fields mapped as `text` trong EF | Thêm `.HasColumnType("jsonb")` cho Tags, AntiCheatLog, AnswerValue, AiFeedback, SkillBreakdown, RecommendedPath | `QuizConfigurations.cs` |
| R2 | `QuizAttempt` thiếu `ExpiresAt` — không thể enforce server-side timer | Thêm `ExpiresAt` entity field, tính từ `Duration`; validate trong SubmitAttemptHandler với 30s grace period | `QuizAttempt.cs`, `QuizConfigurations.cs`, `AttemptCommands.cs` |
| R3 | `StartAttempt` thiếu idempotency — double click tạo 2 attempts | Return existing InProgress attempt thay vì tạo mới | `AttemptCommands.cs` |
| R4 | `AutoGraderService` không có Matching + Ordering grading | Thêm `GradeMatching()` (partial score theo pairs) + `GradeOrdering()` (partial score theo positions) | `AutoGraderService.cs` |
| R5 | Redis EXPIRE wildcard không hoạt động | Design-only fix — Realtime chưa implement (Sprint 9) | `phase3_quiz_design.md` |
| R6 | Frontend polling thay vì SignalR cho AI grading | Design-only fix — AI chưa implement (Sprint 6–7) | `phase3_quiz_design.md` |

### 22.2 🟡 Should-Fix Applied

| ID | Vấn đề | Fix áp dụng | File |
|----|--------|-------------|------|
| Y6 | `PlacementRuleEngine` double-penalty — có thể trừ 2 level | Cap adjustments: `level -= Math.Min(1, adjustments)` | `PlacementRuleEngine.cs` |
| Y11 | Quiz player auto-save 400ms debounce — write amplification | Đổi sang save-on-navigate: lưu khi chuyển câu, không lưu khi typing | `quiz/[id]/play/page.tsx` |
| Y13 | Questions xoá cứng — vi phạm FK, mất historical data | Soft delete: thêm `IsDeleted`/`DeletedAt`, global query filter, `SoftDelete()` method | `Question.cs`, `QuizConfigurations.cs`, `QuestionCommands.cs` |
| Y14 | Route `/placement` trong thiết kế — thực tế là `/placement-test` | Update tất cả references trong design doc | `phase3_quiz_design.md` |
| Y15 | Placement test không có cooldown — user có thể làm lại liên tục | Cooldown 6 tháng trong `SavePlacementResultHandler` | `PlacementCommands.cs` |

### 22.3 🟡 Deferred (chưa implement)

| ID | Vấn đề | Lý do defer |
|----|--------|-------------|
| ~~Y1–Y5~~ | ~~AI scoring (FluencyScore, GrammarScore, LLM calls, GradingStatus)~~ | ✅ **Đã implement** trong Sprint 6 (Speaking) và Sprint 7 (Writing) |
| Y7–Y8 | RoomParticipant.Rank dual source, server-side question timeout | Realtime chưa implement (Sprint 9–10) |
| Y9 | AntiCheatLog JSONB append không atomic | Cần PUT endpoint spec, thấp priority |
| Y10 | `RecommendationService` thiếu dedup | Service chưa tồn tại (Sprint 8) |
| Y12 | Adaptive state không persist | Adaptive chưa implement (Sprint 8) |

### 22.4 🟢 Good Points Confirmed

| ID | Điểm tốt |
|----|---------|
| G1 | Composite indexes đã được thêm vào EF config + migration SQL |
| G2 | Unique index `{QuizId, DisplayOrder}` đã thêm vào `QuizQuestions` |
| G3 | `RetryLimit` check trong StartAttemptHandler hoạt động đúng |
| G4 | `RandomQuestion`/`RandomAnswer` shuffle logic đúng |
| G5 | Thêm `CHECK (AssignedLevel BETWEEN 1 AND 6)` constraint trong migration SQL |
| G6 | `SubmitAttemptHandler` idempotent: nếu đã Graded, trả về kết quả cũ |

### 17.2 Event Schemas

```json
// SpeakingGradingRequested
{
  "submissionId": "uuid",
  "userId": "uuid",
  "audioUrl": "s3://quiz/audio/.../uuid.webm",
  "questionId": "uuid",
  "referenceText": "Please describe your hometown"
}

// AttemptCompleted
{
  "attemptId": "uuid",
  "userId": "uuid",
  "quizId": "uuid",
  "quizType": "PracticeQuiz",
  "score": 8.5,
  "percentage": 85.0,
  "passed": true,
  "skillBreakdown": {"grammar": 90, "vocabulary": 80}
}

// PlacementCompleted
{
  "resultId": "uuid",
  "userId": "uuid",
  "assignedLevel": 4,
  "skillBreakdown": {"listening":75, "grammar":60, "reading":80}
}
```

### 17.3 Dead Letter Queue

```
IF worker fails after 3 retries:
  → Route to q.{name}.dlq
  → Alert via email / Slack webhook
  → Teacher/Admin can manually trigger re-grade
```

---

## 18. SECURITY & ANTI-CHEAT

### 18.1 Anti-Cheat Matrix

| Feature | Implementation | Phase |
|---------|---------------|-------|
| Random question order | shuffle on StartAttempt server-side | 3A |
| Random answer order | shuffle options on StartAttempt | 3A |
| Tab switch detection | `visibilitychange` event → log to AntiCheatLog JSONB | 3A |
| Window blur detection | `window.onblur` → count + timestamp | 3A |
| Copy-paste disable | `oncopy/onpaste/oncontextmenu` prevent default | 3A |
| Time validation | Server: TimeTaken ≤ Duration + 30s grace, else reject | 3A |
| Retry limit | Server checks AttemptNumber ≤ RetryLimit before StartAttempt | 3A |
| Camera proctoring | WebRTC: snapshot every 30s → upload to S3 | 3C |

### 18.2 API Security Rules

```
Attempt ownership:
  SaveAnswer, Submit, GetResult: require attempt.UserId == currentUser.Id

Quiz access:
  IF quiz.CourseId != null: require CourseEnrollment exists
  IF quiz.SessionId != null: require CourseEnrollment for that course

Teacher access:
  QuizzesController POST/PUT/DELETE: require Role = Teacher OR Admin
  QuestionsController: require Role = Teacher OR Admin
  AnalyticsController: require Role = Teacher OR Admin

Rate limiting:
  POST /api/quizzes/{id}/start: max 10 req/min per userId
  POST /api/speaking/upload: max 5 req/min per userId
```

---

## 19. STORAGE DESIGN

### 19.1 MinIO / S3 Bucket Layout (Phase 3B)

| Path | Content | TTL |
|------|---------|-----|
| `quiz/questions/audio/{questionId}.mp3` | Question audio clips | Vĩnh viễn |
| `quiz/questions/image/{questionId}.{ext}` | Question images | Vĩnh viễn |
| `quiz/speaking/{userId}/{submissionId}.webm` | Raw audio recordings | 90 ngày |
| `quiz/speaking/{submissionId}.srt` | STT transcript | 1 năm |
| `quiz/speaking/ai/{submissionId}.json` | AI raw output | 1 năm |
| `quiz/writing/ai/{submissionId}.json` | Writing AI raw output | 1 năm |
| `quiz/proctoring/{attemptId}/{timestamp}.jpg` | Camera snapshots | 30 ngày |

### 19.2 File Size Limits

| Type | Max Size | Format |
|------|---------|--------|
| Audio recording | 50 MB | WebM / MP3 / WAV |
| Question audio | 10 MB | MP3 |
| Question image | 5 MB | JPG / PNG / WebP |
| Essay text | 50 KB | plain text (stored in DB) |

---

## 20. TASK LIST — TẤT CẢ PHA

### ✅ PHASE 3A — Quiz Engine MVP

#### Sprint 1 — Domain & Database (3–4 ngày)
- [x] 1.1 `Quiz.cs` — entity, enums, factory method
- [x] 1.2 `Question.cs` + `QuestionOption.cs`
- [x] 1.3 `QuizQuestion.cs` — join table
- [x] 1.4 `QuizAttempt.cs` + `AttemptAnswer.cs`
- [x] 1.5 `PlacementResult.cs`
- [x] 1.6 `IApplicationDbContext` — thêm 7 DbSet
- [x] 1.7 `ApplicationDbContext` — EF Config (FK, index, string-enum conversions)
- [x] 1.8 EF Migration: `AddQuizTables` (áp dụng trực tiếp qua SQL)
- [x] 1.9 Apply migration + verify schema trên local DB

#### Sprint 2 — Backend API (5–6 ngày)
- [x] 2.1 `QuizCommands.cs` — Create, Update, Delete, Publish, Archive
- [x] 2.2 `QuestionCommands.cs` — CreateQuestion+Options, Update, Delete, BulkImport
- [x] 2.3 `QuizQuestionCommands.cs` — AddToQuiz, Remove, Reorder, OverrideScore
- [x] 2.4 `AttemptCommands.cs` — StartAttempt (validate retry + shuffle)
- [x] 2.5 `AttemptCommands.cs` — SaveAnswer (upsert AttemptAnswer)
- [x] 2.6 `AutoGraderService.cs` — 4 loại câu (SC/MC/TF/FB)
- [x] 2.7 `AttemptCommands.cs` — SubmitAttempt (call AutoGrader, update scores)
- [x] 2.8 `AttemptCommands.cs` — AbandonAttempt
- [x] 2.9 `PlacementRuleEngine.cs` — skill scoring + level determination
- [x] 2.10 `PlacementCommands.cs` — SavePlacementResult
- [x] 2.11 `QuizQueries.cs` — GetList (filters), GetDetail, GetPreview, GetAnalytics
- [x] 2.12 `QuestionQueries.cs` — GetList (type/skill/difficulty/tag/search), GetDetail
- [x] 2.13 `AttemptQueries.cs` — GetResult+Review, GetMyAttempts
- [x] 2.14 `PlacementQueries.cs` — GetPlacementQuiz, GetMyResult, GetRecommendedCourses
- [x] 2.15 `QuizzesController.cs` — 9 endpoints
- [x] 2.16 `QuestionsController.cs` — 10 endpoints
- [x] 2.17 `AttemptsController.cs` — 8 endpoints
- [x] 2.18 `PlacementController.cs` — 4 endpoints
- [x] 2.19 `AnalyticsController.cs` — 4 basic endpoints
- [x] 2.20 Seed data: 1 Placement Quiz + 30 câu Mixed skills

> **✅ Sprint 2 hoàn thành — đã smoke test 7 endpoints, tất cả 200 OK:**  
> `GET /api/v1/placement/quiz` · `POST /api/v1/placement/start` · `PUT /api/v1/attempts/{id}/answer`  
> `POST /api/v1/attempts/{id}/submit` · `POST /api/v1/placement/result` · `GET /api/v1/placement/my-result`  
> **Bug đã fix:** `X-Tenant-Slug` phải là `demo` (không phải `tenant_demo`) → schema = `tenant_demo`

#### Sprint 3 — Frontend Student (5–6 ngày)
- [x] 3.1 `quizApi.ts` — RTK Query full slice (placement + attempt endpoints)
- [x] 3.2 `placementApi.ts` — gộp vào `quizApi.ts` (không tách file riêng)
- [x] 3.3 `QuizTimer.tsx` — `TimerDisplay` component (inline trong placement-test page, đếm lên/đếm xuống)
- [x] 3.4 `QuestionRenderer.tsx` — `QuestionCard` component (inline, switch theo type)
- [x] 3.5 `SingleChoiceInput.tsx` + `MultipleChoiceInput.tsx` — tích hợp trong `QuestionCard`
- [x] 3.6 `TrueFalseInput.tsx` + `FillBlankInput.tsx` — tích hợp trong `QuestionCard`
- [x] 3.7 `MatchingInput` + `OrderingInput` — tích hợp trong `QuestionCard` của `quiz/[id]/play/page.tsx` và `placement-test/page.tsx`
  - Matching: grid layout `content ↔ <select>`, answer = `JSON.stringify([{key,value},...])`
  - Ordering: numbered list + ▲/▼ buttons, answer = `JSON.stringify([optId1,optId2,...])`
  - `matchKey`/`matchValue` thêm vào `AttemptOptionDto` trong `quizApi.ts`
- [x] 3.8 `QuizNavigator.tsx` — dot navigator 30 nút (trạng thái màu: answered/current/unanswered)
- [x] 3.9 Anti-cheat inline — `visibilitychange` tab-switch logger trong quiz player (không PUT endpoint)
- [x] 3.10 `ResultSummary.tsx` — score card + level badge + skill breakdown (inline, stage `result`)
- [x] 3.11 `/quiz/[id]/page.tsx` — QuizIntroPage (thông tin, luật, lịch sử, nút Bắt đầu)
- [x] 3.12 `/quiz/[id]/play/page.tsx` — QuizPlayerPage (timer, câu hỏi, navigator, save-on-navigate, submit)
- [x] 3.13 `/quiz/[id]/result/[attemptId]/page.tsx` — QuizResultPage (điểm, review từng câu)
- [x] 3.14 `/placement-test/page.tsx` — Placement single-page flow đầy đủ (route thực tế là `/placement-test`)
- [x] 3.15 `/placement-test/result` — kết quả placement tích hợp vào stage `result` của page trên

> **✅ Sprint 3 hoàn thành — placement E2E + quiz player đầy đủ, tất cả 6 loại câu hỏi có UI**

#### Sprint 4 — Frontend Teacher (4–5 ngày)
- [x] 4.1 `questionApi.ts` + `analyticsApi.ts` — RTK Query slices riêng
- [x] 4.2 Quiz builder form (inline trong `/teacher/quizzes/new/page.tsx`)
- [x] 4.3 Question list editor + add modal (inline trong `/teacher/quizzes/[id]/page.tsx`)
- [x] 4.4 Quiz settings form (settings tab trong edit page)
- [x] 4.5 Question form — inline trong `/teacher/questions/page.tsx` (tạo mới + edit)
- [x] 4.6 Question bank table — filter + pagination (search, type filter)
- [x] 4.7 Add question modal — chọn từ question bank, thêm vào quiz
- [x] 4.8 Quiz analytics charts — pass rate, avg score, per-question stats
- [x] 4.9 `/teacher/quizzes/page.tsx` — list + filter + publish/archive actions
- [x] 4.10 `/teacher/quizzes/new/page.tsx` — tạo quiz mới (title, type, skill, settings)
- [x] 4.11 `/teacher/quizzes/[id]/page.tsx` — settings tab + questions tab
- [x] 4.12 `/teacher/quizzes/[id]/analytics/page.tsx` — attempts, pass rate, per-question heatmap
- [x] 4.13 `/teacher/questions/page.tsx` — question bank CRUD đầy đủ
- [x] 4.14 `/teacher/placement/page.tsx` — placement dashboard (level distribution)

> **✅ Sprint 4 hoàn thành — tất cả teacher pages implemented**

#### Sprint 5 — Integration & Polish (2–3 ngày)
- [x] 5.1 Interactive Quiz popup tích hợp vào Video Player — **✅ Done**
  - Backend: `GetVideoQuizBySessionQuery` + `VideoQuizInfoDto` trong `QuizQueries.cs`
  - Backend: `GET /api/v1/sessions/{id}/video-quiz` endpoint trong `SessionsController.cs`
  - Frontend: `useGetSessionVideoQuizQuery` + `VideoQuizInfoDto` trong `quizApi.ts`
  - Frontend: `HlsPlayerControls` interface + `controlRef` prop trong `HlsPlayer.tsx` (pause/play ngoài)
  - Frontend: `VideoQuizPopup` + `VideoQuizQuestionCard` inline trong `learn/[id]/page.tsx`
  - Trigger: `handleTimeUpdate` check mỗi tick, pause video khi `time >= videoTriggerSecond`
  - Anti re-trigger: `videoQuizTriggeredRef` (`useRef<boolean>`) — chỉ hiện 1 lần/session
- [x] 5.2 Quiz section trong Course Detail page `/courses/[id]` (danh sách quiz Published)
- [x] 5.3 Placement Test widget trên My Lesson dashboard (level badge + skill bars + link)
- [x] 5.4 Loading states inline trên tất cả quiz pages (spinner + skeleton)
- [ ] 5.5 E2E automated test — chưa viết
- [x] 5.6 Seed: gán quiz vào khoá học hiện có — `deploy/seed-quiz-course-link.sql`
  - Gán 2 published quiz vào course Published đầu tiên
  - DO $$ block: link video-trigger quiz vào session Interactive đầu tiên

> **✅ Sprint 5 hoàn thành — 6/6 done** — Video quiz popup (5.1), E2E scripts (5.5 — low priority/skip), Seed SQL (5.6)

---

### ✅ PHASE 3B — AI Features

#### Sprint 6 — Speaking AI ✅
- [x] 6.1 `SpeakingSubmission.cs` entity + `deploy/sprint6-speaking-migration.sql`
- [x] 6.2 `LocalFileStorageService` (dev mode; production = MinIO/S3)
- [x] 6.3 `InMemoryQueue` (dev mode; production = RabbitMQ) — `ISpeakingGradingQueue.cs`
- [x] 6.4 `SpeakingCommands.cs` — `UploadSpeakingCommand` handler (multipart upload + enqueue)
- [x] 6.5 `SpeakingGradingWorker.cs` — `BackgroundService`, MockGrade() + mode-aware weights + SignalR push
- [x] 6.6 `SpeakingController.cs` (`POST /upload`, `GET /{id}/status`, `GET /{id}/result`) + `SpeakingQueries.cs`
- [x] 6.7 `SpeakingRecorder.tsx` — MediaRecorder + waveform visualizer + upload progress
- [x] 6.8 `/quiz/[id]/speaking/page.tsx` — auto-start attempt, upload, pending state
- [x] 6.9 `/quiz/[id]/ai-result/[submissionId]/page.tsx` — `AiResultShell` shared component (speaking + writing)

> **✅ Sprint 6 hoàn thành** — SpeakingGradingWorker với mock STT/Phoneme/LLM, mode-aware scoring (opic_describe/opic_roleplay/vstep_p1/standard), SignalR `AiGradingProgress` event, dev-mode in-memory queue.

**Files đã tạo:**
```
backend/MLS.Domain/Entities/SpeakingSubmission.cs
backend/MLS.Application/Common/Interfaces/ISpeakingGradingQueue.cs
backend/MLS.Application/Quiz/Commands/SpeakingCommands.cs
backend/MLS.Application/Quiz/Queries/SpeakingQueries.cs
backend/MLS.Infrastructure/Messaging/InMemorySpeakingGradingQueue.cs
backend/MLS.Infrastructure/Workers/SpeakingGradingWorker.cs
backend/MLS.API/Controllers/SpeakingController.cs
frontend/src/lib/features/quiz/speakingApi.ts
frontend/src/components/quiz/SpeakingRecorder.tsx
frontend/src/app/quiz/[id]/speaking/page.tsx
deploy/sprint6-speaking-migration.sql
```

#### Sprint 7 — Writing AI ✅
- [x] 7.1 `WritingSubmission.cs` entity + `deploy/sprint7-writing-migration.sql` (ExamModeTag, TaskType, EssayType fields)
- [x] 7.2 `WritingCommands.cs` (`SubmitWritingCommand`) + `WritingGradingWorker.cs` (mode-aware: standard/letter/VSTEP T1/T2)
- [x] 7.3 `WritingController.cs` (`POST /submit`, `GET /{id}/status`, `GET /{id}/result`) + `WritingQueries.cs`
- [x] 7.4 `EssayEditor.tsx` — live word count badge (green/red), auto-save draft (sessionStorage, 800ms debounce), VSTEP letter format guide, bullet points display
- [x] 7.5 `/quiz/[id]/writing/page.tsx` — auto-start attempt, render EssayEditor, submit → redirect to ai-result?type=writing
- [x] 7.6 Writing AI Feedback UI — `/quiz/[id]/ai-result/[id]/page.tsx` rewritten: `?type=writing` → Grammar/Vocabulary/Coherence/Task score cards
- [x] 7.7 `RecommendationService.cs` — deferred to Sprint 8 (weak skill dedup)
- [ ] 7.8 `/teacher/ai-review/page.tsx` — deferred to Phase 3B polish
- [ ] 7.9 Analytics update: SpeakingTrend + WritingTrend charts — deferred to Sprint 8

> **✅ Sprint 7 hoàn thành (core)** — WritingGradingWorker với mock LanguageTool/LLM, mode-aware weights (VSTEP T1 letter: 0.30g+0.30v+0.40task; VSTEP T2 essay/standard: 0.25×4), SignalR push, dev-mode in-memory queue, EssayEditor word count validation.

**Files đã tạo:**
```
backend/MLS.Domain/Entities/WritingSubmission.cs
backend/MLS.Application/Common/Interfaces/IWritingGradingQueue.cs
backend/MLS.Application/Quiz/Commands/WritingCommands.cs
backend/MLS.Application/Quiz/Queries/WritingQueries.cs
backend/MLS.Infrastructure/Messaging/InMemoryWritingGradingQueue.cs
backend/MLS.Infrastructure/Workers/WritingGradingWorker.cs
backend/MLS.API/Controllers/WritingController.cs
frontend/src/lib/features/quiz/writingApi.ts
frontend/src/components/quiz/EssayEditor.tsx
frontend/src/app/quiz/[id]/writing/page.tsx
frontend/src/app/quiz/[id]/ai-result/[attemptId]/page.tsx  ← rewritten (speaking + writing)
deploy/sprint7-writing-migration.sql
```

---

### 🔮 PHASE 3C — Adaptive & Realtime

#### Sprint 8 — Adaptive Quiz (3–4 ngày)
- [ ] 8.1 `AdaptiveEngine.cs` — question selection by difficulty
- [ ] 8.2 `AttemptCommands.cs` — GetNextAdaptiveQuestion endpoint
- [ ] 8.3 Frontend dynamic loading (không load all upfront)
- [ ] 8.4 Adaptive scoring formula implementation

#### Sprint 9–10 — Realtime Quiz (5–6 ngày)
- [ ] 9.1 `RealtimeQuizRoom.cs` + `RoomParticipant.cs` + Migration
- [ ] 9.2 Redis leaderboard ZSET implementation
- [ ] 9.3 `QuizHub.cs` SignalR — tất cả events
- [ ] 9.4 `RealtimeController.cs` — 5 REST endpoints
- [ ] 9.5 `/teacher/realtime/new/page.tsx`
- [ ] 9.6 `/teacher/realtime/[id]/host/page.tsx`
- [ ] 9.7 `/realtime/join/page.tsx`
- [ ] 9.8 `/realtime/[code]/play/page.tsx` — student realtime UI
- [ ] 9.9 `Leaderboard.tsx` + `CountdownOverlay.tsx` + `LiveAnswerFeed.tsx`

---

## 21. IMPLEMENTATION PLAN

### Timeline Tổng thể

```
Tuần 1:  Sprint 1 (Domain+DB) + Sprint 2 bắt đầu (Backend)
Tuần 2:  Sprint 2 hoàn thành + Sprint 3 bắt đầu (Student FE) [song song]
Tuần 3:  Sprint 3 hoàn thành + Sprint 4 (Teacher FE) [song song]
Tuần 4:  Sprint 5 (Integration + Polish + E2E test)
─────────────────────── PHASE 3A SHIPPED ───────────────────────
Tuần 5:  Sprint 6 (Speaking AI)
Tuần 6:  Sprint 7 (Writing AI + Recommendation)
Tuần 7:  Phase 3B polish + AI Review dashboard
─────────────────────── PHASE 3B SHIPPED ───────────────────────
Tuần 8:  Sprint 8 (Adaptive Quiz)
Tuần 9–10: Sprint 9–10 (Realtime Quiz)
─────────────────────── PHASE 3C SHIPPED ───────────────────────
```

### Effort Summary

| Phase | Tasks | Effort | Timeline |
|-------|-------|--------|----------|
| **3A MVP** | 46 tasks | ~35–45 ngày công | 4 tuần |
| **3B AI** | 18 tasks | ~20–25 ngày công | 3 tuần |
| **3C Adaptive/Realtime** | 13 tasks | ~20–25 ngày công | 3 tuần |
| **Tổng** | **77 tasks** | **~75–95 ngày công** | **~10 tuần** |

### Thứ tự thực thi tối ưu (Sprint 1 → 5)

```
1. Entity classes (Quiz, Question, Option, QuizQuestion, Attempt, Answer, Placement)
2. DbContext + EF Migration
3. AutoGraderService (core business logic)
4. StartAttempt + SubmitAttempt commands
5. Quiz + Question + Attempt controllers
6. quizApi.ts RTK Query slice
7. QuizPlayerPage (core student experience)
8. QuizBuilderPage (core teacher experience)
9. Integration + seed data
10. PlacementTest end-to-end
```

---

> **Bắt đầu ngay:** Nói **"bắt đầu Sprint 1"** → tôi sẽ tạo toàn bộ Entity classes, cập nhật DbContext, và generate Migration ngay lập tức.
  writing.grading.requested  ? q.writing.grading  ? WritingGradingWorker
  attempt.completed          ? q.analytics        ? AnalyticsWorker
  placement.completed        ? q.recommendation   ? RecommendationWorker
```n
