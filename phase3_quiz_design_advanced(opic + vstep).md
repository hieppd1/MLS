# PHASE 3 — EXAM MODES DESIGN
# Thiết kế 3 Mode Thi: Thông Thường · OPIC · VSTEP

> **Kế thừa từ:** `phase3_quiz_design.md` (Phase 3A–3C hoàn thành Sprint 1–5)  
> **Stack:** .NET 10 · MediatR · EF Core · PostgreSQL · Redis · RabbitMQ · Next.js 16 · RTK Query  
> **Triển khai:** Phase 3.1 (done) → Phase 3.2 OPIC → Phase 3.3 VSTEP  
> **Nguyên tắc:** Tối đa dùng chung — chỉ mở rộng khi thực sự cần tách biệt

---

## MỤC LỤC

| # | Phần | Nội dung |
|---|------|---------|
| 1 | [Tổng quan phân chia 3 mode](#1-tổng-quan-phân-chia-3-mode) | So sánh, nguyên tắc thiết kế |
| 2 | [Kiến trúc dùng chung (Shared Core)](#2-kiến-trúc-dùng-chung-shared-core) | Những gì 3 mode đều tái sử dụng |
| 3 | [Phase 3.1 — Thông Thường (Standard)](#3-phase-31--thông-thường-standard-mode) | Sprint 1–5 done · Sprint 6–10 full design |
| 3.1 | [Sprint 6 — Speaking AI](#313-sprint-6--speaking-ai-phase-3b) | SpeakingSubmission, Worker pipeline, Recorder UI |
| 3.2 | [Sprint 7 — Writing AI + Recommendation](#314-sprint-7--writing-ai--recommendation-phase-3b) | WritingSubmission, Worker, EssayEditor |
| 3.3 | [Sprint 8 — Adaptive Quiz](#315-sprint-8--adaptive-quiz-phase-3c) | Algorithm, AdaptiveEngine, UI |
| 3.4 | [Sprint 9–10 — Realtime Quiz](#316-sprint-910--realtime-quiz-phase-3c) | SignalR Hub, Redis, Leaderboard |
| 4 | [Phase 3.2 — OPIC Mode](#4-phase-32--opic-mode) | Thiết kế đầy đủ |
| 5 | [Phase 3.3 — VSTEP Mode](#5-phase-33--vstep-mode) | Thiết kế đầy đủ |
| 6 | [Database Schema Mở rộng](#6-database-schema-mở-rộng) | SQL cho 3B (Speaking/Writing) + 3C (Realtime) + 3.2 + 3.3 |
| 7 | [API Endpoints Mở rộng](#7-api-endpoints-mở-rộng) | Endpoints 3B/3C + OPIC + VSTEP |
| 8 | [Backend Modules Mở rộng](#8-backend-modules-mở-rộng) | CQRS, Services, Workers — tất cả mode |
| 9 | [Frontend Pages & Components](#9-frontend-pages--components) | Shared + Mode-specific |
| 10 | [Luồng nghiệp vụ chi tiết](#10-luồng-nghiệp-vụ-chi-tiết) | Flow cho từng mode |
| 11 | [Event-Driven Mở rộng](#11-event-driven-mở-rộng) | RabbitMQ events — 3B/3C/OPIC/VSTEP |
| 12 | [Roadmap & Sprint Plan](#12-roadmap--sprint-plan) | Thứ tự triển khai toàn bộ |
| **14** | **[Teacher Portal & Quiz Config UI — Phương án kiến trúc](#14-teacher-portal--quiz-config-ui--phương-án-kiến-trúc)** | **⭐ Phương án duyệt: Portal tách hay gộp? Quiz config dùng chung vs tách riêng** |

---

## 1. TỔNG QUAN PHÂN CHIA 3 MODE

### 1.1 So sánh 3 Mode

| Tiêu chí | 3.1 Thông Thường | 3.2 OPIC | 3.3 VSTEP |
|----------|----------------|----------|-----------|
| **Mục đích** | Luyện tập, kiểm tra nội bộ | Luyện thi OPIC (Speaking only) | Luyện thi VSTEP 4 kỹ năng |
| **Chuẩn tham chiếu** | Nội bộ (Level 1–6) | OPIc NH/IL/IM/IH/AL | CEFR A2/B1/B2/C1 |
| **Kỹ năng** | Mixed / từng kỹ năng | Speaking only | Listening + Reading + Writing + Speaking |
| **Định dạng câu hỏi** | MCQ, FillBlank, Essay, Speaking, Matching... | Audio question → Speaking response | MCQ audio + MCQ text + Email/Essay + Speaking 3 parts |
| **Cách chấm điểm** | Auto % + AI (Speaking/Writing) | AI → OPIC Level band | AI + Auto → VSTEP Band (B1/B2/C1) |
| **Kết quả** | Điểm % + Passed/Failed | NH / IL / IM1 / IM2 / IM3 / IH / AL | Bậc 2/3/4/5 + điểm từng kỹ năng |
| **Cấu trúc bài thi** | N câu tự do | 15 câu / 5 combos / 2 sessions | 4 phần thi riêng biệt |
| **Đặc thù kỹ thuật** | Standard | Audio Q · Combo group · Level select · Mid-quiz adjust | PassageGroup · 4-part session · Letter writing |
| **Phức tạp kỹ thuật** | ✅ Done | 🟡 Cao | 🔴 Rất cao |

### 1.2 Nguyên tắc thiết kế

```
Tái sử dụng tối đa:
  ✅ Quiz entity (mở rộng với ExamMode field)
  ✅ Question entity (mở rộng với AudioUrl đã có)
  ✅ QuizAttempt entity (mở rộng với ExamMeta JSONB)
  ✅ AttemptAnswer entity (tái dùng nguyên xi)
  ✅ SpeakingSubmission + pipeline (tái dùng cho cả OPIC và VSTEP Speaking)
  ✅ WritingSubmission + pipeline (tái dùng cho VSTEP Writing)
  ✅ AutoGraderService (tái dùng cho MCQ trong OPIC + VSTEP)
  ✅ Timer engine + ExpiresAt
  ✅ Anti-cheat module
  ✅ Analytics engine

Tách riêng:
  ➕ OPICSession entity — wrapper 15 câu / 5 combos / 2 sessions
  ➕ OPICComboGroup entity — nhóm 3 câu cùng chủ đề
  ➕ OPICTopicSurvey entity — Background survey chọn chủ đề
  ➕ OPICLevelResult entity — kết quả level OPIC
  ➕ VSTEPSession entity — wrapper 4 phần thi liên tiếp
  ➕ PassageGroup entity — nhóm câu hỏi theo đoạn văn/audio
  ➕ VSTEPBandResult entity — kết quả theo bậc VSTEP
  ➕ AudioListeningContent — payload cho Listening MCQ
  ➕ SolutionDiscussionContent — payload cho Speaking Part 2
  ➕ TopicDevelopmentContent — payload cho Speaking Part 3
```

### 1.3 Mô hình ExamMode

Thêm field `ExamMode` vào `Quiz` để routing logic và UI biết đang làm việc với mode nào:

```csharp
public enum ExamMode {
    Standard,   // 3.1 — hiện tại
    OPIC,       // 3.2
    VSTEP       // 3.3
}
```

---

## 2. KIẾN TRÚC DÙNG CHUNG (SHARED CORE)

### 2.1 Entities tái sử dụng 100%

| Entity | 3.1 | 3.2 OPIC | 3.3 VSTEP | Ghi chú |
|--------|-----|----------|-----------|---------|
| `Quiz` | ✅ | ✅ (+ ExamMode, Language) | ✅ (+ ExamMode) | Thêm 2 field |
| `Question` | ✅ | ✅ (AudioUrl đã có) | ✅ | Thêm AudioPlayLimit |
| `QuestionOption` | ✅ | ✅ | ✅ | Không đổi |
| `QuizQuestion` | ✅ | ✅ | ✅ | Không đổi |
| `QuizAttempt` | ✅ | ✅ (+ ExamMeta) | ✅ (+ ExamMeta) | Thêm ExamMeta JSONB |
| `AttemptAnswer` | ✅ | ✅ | ✅ | Không đổi |
| `SpeakingSubmission` | 3B | ✅ tái dùng | ✅ tái dùng | Core pipeline giống nhau |
| `WritingSubmission` | 3B | ❌ không dùng | ✅ tái dùng | VSTEP Writing |
| `PlacementResult` | ✅ | ❌ dùng OPICLevelResult | ❌ dùng VSTEPBandResult | Thay thế bởi mode-specific |

### 2.2 Services tái sử dụng

| Service | 3.1 | 3.2 OPIC | 3.3 VSTEP |
|---------|-----|----------|-----------|
| `AutoGraderService` | ✅ MCQ/Fill/Match | ✅ MCQ trong phần survey | ✅ Listening MCQ + Reading MCQ |
| `SpeakingGradingWorker` | 3B | ✅ toàn bộ (thêm OPIC-specific rubric) | ✅ toàn bộ (thêm VSTEP rubric) |
| `WritingGradingWorker` | 3B | ❌ | ✅ (thêm Letter task type) |
| `PlacementRuleEngine` | ✅ | ❌ dùng OPIcLevelEngine | ❌ dùng VSTEPBandEngine |
| `RecommendationService` | 3B | ✅ tái dùng | ✅ tái dùng |
| `AdaptiveEngine` | 3C | ❌ | ❌ |

### 2.3 Mở rộng Quiz entity

```csharp
public class Quiz : BaseEntity {
    // === EXISTING FIELDS (không đổi) ===
    public string    Title
    public string?   Description
    public QuizType  QuizType
    public SkillType SkillType
    public QuizStatus Status
    public int       Level
    public int?      Duration
    public decimal   TotalScore
    public decimal   PassingScore
    public bool      RandomQuestion
    public bool      RandomAnswer
    public bool      AllowRetry
    public int?      RetryLimit
    public bool      ShowCorrectAnswer
    public bool      ShowExplanation
    public Guid      CreatedBy
    public Guid?     CourseId
    public Guid?     SessionId
    public int?      VideoTriggerSecond

    // === NEW FIELDS ===
    public ExamMode  ExamMode    = ExamMode.Standard  // phân biệt mode thi
    public string    Language    = "vi"               // "vi" | "en" | "ko" — cho OPIC/VSTEP
}
```

### 2.4 Mở rộng QuizAttempt entity

```csharp
public class QuizAttempt : BaseEntity {
    // === EXISTING FIELDS (không đổi) ===
    public Guid         QuizId
    public Guid         UserId
    public AttemptState State
    public GradingMethod GradingMethod
    public DateTime     StartedAt
    public DateTime?    ExpiresAt      // R2 fix — đã có
    public DateTime?    SubmittedAt
    public DateTime?    GradedAt
    public decimal?     Score
    public decimal?     AiScore
    public decimal?     Percentage
    public bool         Passed
    public int          AttemptNumber
    public int?         TimeTaken
    public string?      AntiCheatLog   // JSONB

    // === NEW FIELD ===
    public string?      ExamMeta       // JSONB — mode-specific metadata
    // OPIC: {"sessionPhase":1,"selectedLevel":"3-3","midAdjustChoice":"same","surveyTopics":["music","travel"]}
    // VSTEP: {"currentPart":"Reading","partScores":{"listening":7.5,"reading":8.0},"bandResult":"B2"}

    public ICollection<AttemptAnswer> Answers
}
```

### 2.5 Mở rộng Question entity

```csharp
public class Question : BaseEntity {
    // === EXISTING FIELDS (không đổi) ===
    public string          Content
    public string?         AudioUrl
    public string?         ImageUrl
    public string?         VideoUrl
    public QuestionType    Type
    public SkillType       SkillType
    public DifficultyLevel Difficulty
    public string?         Explanation
    public decimal         DefaultScore
    public string?         Tags           // JSONB
    public bool            IsPublic
    public Guid            CreatedBy

    // === NEW FIELDS ===
    public int?    AudioPlayLimit         // số lần nghe tối đa (OPIC: 2, VSTEP Listening: 2, null = không giới hạn)
    public int?    SpeakingTimeLimitSec   // giới hạn thời gian nói (null = không giới hạn)
    public string? ReferenceText          // văn bản tham chiếu cho Speaking scoring (pronunciation check)
    public string? ExamModeTag            // "opic_combo_describe" | "opic_roleplay" | "vstep_listening_p1" ...
}
```

### 2.6 Enum mở rộng

```csharp
// Thêm vào QuizType
public enum QuizType {
    // === EXISTING ===
    PlacementTest, SegmentQuiz, PracticeQuiz, MockTest,
    AdaptiveQuiz, SpeakingTest, WritingTest,
    GrammarQuiz, VocabularyQuiz, RealtimeQuiz,

    // === NEW — OPIC ===
    OPICMockTest,       // bài thi OPIC đầy đủ 15 câu
    OPICMiniTest,       // bài luyện ngắn 3–5 câu theo topic

    // === NEW — VSTEP ===
    VSTEPMockTest,      // bài thi VSTEP đầy đủ 4 phần
    VSTEPListening,     // luyện riêng Listening
    VSTEPReading,       // luyện riêng Reading
    VSTEPWriting,       // luyện riêng Writing
    VSTEPSpeaking       // luyện riêng Speaking
}

// Thêm vào QuestionType
public enum QuestionType {
    // === EXISTING ===
    SingleChoice, MultipleChoice, TrueFalse, FillBlank,
    Matching, Ordering, SpeakingRecording, EssayWriting,
    VideoQuiz, DragDrop, AudioTranscription,

    // === NEW — OPIC ===
    OPICRolePlay,           // nghe tình huống → nói phản hồi theo role
    OPICQuestionAsking,     // student hỏi AI examiner 3–4 câu

    // === NEW — VSTEP ===
    AudioListeningMCQ,      // nghe audio → MCQ (VSTEP Listening)
    SolutionDiscussion,     // đọc scenario + 3 options → chọn 1 + argue (VSTEP Speaking P2)
    TopicDevelopment,       // topic + bullet points → present (VSTEP Speaking P3)
    LetterWriting,          // viết thư/email formal/informal (VSTEP Writing T1)
    EssayWritingVSTEP       // viết luận (VSTEP Writing T2 — tách để có rubric riêng)
}
```

---

## 3. PHASE 3.1 — THÔNG THƯỜNG (STANDARD MODE)

### 3.1.1 Trạng thái hiện tại

Sprint 1–5 đã hoàn thành. Tất cả tính năng core đã live:

| Tính năng | Trạng thái |
|-----------|-----------|
| Quiz CRUD (Teacher) | ✅ Done |
| Question Bank | ✅ Done |
| Quiz Player (Student) | ✅ Done |
| Placement Test | ✅ Done |
| Interactive Quiz (Video trigger) | ✅ Done |
| Analytics cơ bản | ✅ Done |
| Speaking AI | ✅ Hoàn thành (Sprint 6) |
| Writing AI | ✅ Hoàn thành (Sprint 7) |
| Adaptive Quiz | 🔜 Sprint 8 |
| Realtime Quiz | 🔜 Sprint 9–10 |

### 3.1.2 Bổ sung nhỏ cho Phase 3.1 (để tương thích với 3.2 và 3.3)

**Migration bổ sung:**
```sql
-- Thêm ExamMode vào Quizzes
ALTER TABLE "Quizzes" ADD COLUMN "ExamMode" VARCHAR(20) NOT NULL DEFAULT 'Standard';
ALTER TABLE "Quizzes" ADD COLUMN "Language"  VARCHAR(10) NOT NULL DEFAULT 'vi';

-- Thêm fields mới vào Questions
ALTER TABLE "Questions" ADD COLUMN "AudioPlayLimit"      INT;
ALTER TABLE "Questions" ADD COLUMN "SpeakingTimeLimitSec" INT;
ALTER TABLE "Questions" ADD COLUMN "ReferenceText"        TEXT;
ALTER TABLE "Questions" ADD COLUMN "ExamModeTag"          VARCHAR(50);

-- Thêm ExamMeta vào QuizAttempts
ALTER TABLE "QuizAttempts" ADD COLUMN "ExamMeta" JSONB;
```

**Không có breaking change** — tất cả field mới nullable hoặc có default value.

### 3.1.3 Sprint 6 — Speaking AI (Phase 3B)

> **Dùng chung:** Pipeline này là nền tảng cho OPIC (15 câu speaking) và VSTEP Speaking (3 parts).  
> Tất cả entities/services xây ở Sprint 6 được tái dùng ≥70% ở Phase 3.2 và 3.3.

#### Entity: SpeakingSubmission

```csharp
public class SpeakingSubmission : BaseEntity {
    public Guid    AttemptAnswerId
    public Guid    UserId
    public string  AudioUrl                // s3://quiz/speaking/{userId}/{id}.webm
    public string? TranscriptText          // Whisper STT output
    public string? TranscriptUrl           // SRT/VTT URL
    public decimal? PronunciationScore     // 0–100
    public decimal? FluencyScore           // 0–100
    public decimal? AccuracyScore          // 0–100
    // Fields thêm cho OPIC + VSTEP (nullable — chỉ set khi ExamMode != Standard)
    public decimal? CoherenceScore         // 0–100 (OPIC coherence, VSTEP fluency/coherence)
    public decimal? VocabularyScore        // 0–100 (OPIC vocab, VSTEP lexical resource)
    public decimal? TaskAchievementScore   // 0–100 (OPIC task, VSTEP P2/P3 task)
    public decimal? FinalScore             // weighted average (weights per mode/type)
    public string?  PhonemeAnalysis        // JSONB: [{word, expected_ipa, actual_ipa, correct}]
    public string?  LlmFeedback            // markdown feedback
    public string   GradingStatus          // Pending | Processing | Done | Failed
    public string?  ExamModeTag            // null | "opic_describe" | "vstep_p2" — routing rubric
    public DateTime? ProcessedAt
}
```

#### Database (Phase 3B)

```sql
CREATE TABLE "SpeakingSubmissions" (
    "Id"                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "AttemptAnswerId"      UUID NOT NULL REFERENCES "AttemptAnswers"("Id"),
    "UserId"               UUID NOT NULL,
    "AudioUrl"             TEXT NOT NULL,
    "TranscriptText"       TEXT,
    "TranscriptUrl"        TEXT,
    "PronunciationScore"   DECIMAL(5,2),
    "FluencyScore"         DECIMAL(5,2),
    "AccuracyScore"        DECIMAL(5,2),
    "CoherenceScore"       DECIMAL(5,2),
    "VocabularyScore"      DECIMAL(5,2),
    "TaskAchievementScore" DECIMAL(5,2),
    "FinalScore"           DECIMAL(5,2),
    "PhonemeAnalysis"      JSONB,
    "LlmFeedback"          TEXT,
    "GradingStatus"        VARCHAR(20) NOT NULL DEFAULT 'Pending',
    "ExamModeTag"          VARCHAR(50),
    "ProcessedAt"          TIMESTAMPTZ,
    "CreatedAt"            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_speaking_answer  ON "SpeakingSubmissions"("AttemptAnswerId");
CREATE INDEX idx_speaking_user    ON "SpeakingSubmissions"("UserId");
CREATE INDEX idx_speaking_status  ON "SpeakingSubmissions"("GradingStatus")
    WHERE "GradingStatus" IN ('Pending', 'Processing');
```

#### AI Pipeline — Standard Mode

```
[INPUT] Audio WebM/MP3/WAV, max 5 phút, max 50MB
    ↓
[1] Validation & Upload
    Check: format, size, duration
    Upload raw → MinIO: quiz/speaking/{userId}/{submissionId}.webm
    status = Pending → RabbitMQ: speaking.grading.requested
    ↓
[2] FFmpeg Pre-processing
    Resample → 16kHz mono WAV
    WebRTC VAD: strip silence > 2s
    Spectral noise reduction
    ↓
[3] Speech-to-Text (Whisper large-v3 / Azure STT)
    transcript text + word timestamps [{word, start, end, confidence}]
    ↓
[4] Phoneme Analysis
    G2P (Grapheme-to-Phoneme) on referenceText
    Align STT phonemes vs expected
    PronunciationScore = correct_phonemes / total_phonemes * 100
    PhonemeAnalysis JSONB: [{word, expected_ipa, actual_ipa, correct}]
    ↓
[5] Fluency Analysis
    speech_rate = words / duration_sec  (target: 120–150 wpm)
    filler_count: "uh", "um", "like", ...
    long_pause_count: gaps > 3s
    FluencyScore = 100 − (long_pauses × 5) − (fillers × 2)
    ↓
[6] LLM Feedback (GPT-4o)
    Prompt:
      "Transcript: {text}
       Mispronounced words: {words}
       Speech rate: {wpm} wpm, long pauses: {n}
       Give 3–5 specific improvement tips in Vietnamese."
    Output: markdown feedback
    ↓
[7] Score & Persist
    Standard: FinalScore = 0.40*Pronunciation + 0.30*Fluency + 0.30*Accuracy
    Update SpeakingSubmission: status=Done, all scores, transcript, LlmFeedback
    Publish: speaking.grading.done → SignalR push to user
    ↓
[OUTPUT] Scores + transcript + phoneme highlights + feedback markdown
```

#### Mode-Aware Grading Weights

| Mode / Type | Pronunciation | Fluency | Accuracy | Coherence | Vocabulary | Task |
|-------------|:---:|:---:|:---:|:---:|:---:|:---:|
| **Standard** | 40% | 30% | 30% | — | — | — |
| **OPIC — Miêu tả** | 30% | 25% | — | 20% | 15% | 10% |
| **OPIC — Kinh nghiệm** | 25% | 25% | — | 25% | 15% | 10% |
| **OPIC — Role-play** | 20% | 20% | — | 20% | 20% | 20% |
| **VSTEP P1** | 20% | 30% | — | (Fluency) | 25% | 25%\* |
| **VSTEP P2** | 16% | 22% | — | (Fluency) | 19% | 24%+19%\*\* |
| **VSTEP P3** | 14% | 20% | — | (Fluency) | 17% | 24%+8%+17%\*\*\* |

> \* Grammar Range & Accuracy  
> \*\* Task Achievement (chose option + argued) + Grammar  
> \*\*\* Content Development + Follow-up + Grammar

#### SpeakingGradingWorker — Mode Detection

```csharp
public async Task ProcessAsync(SpeakingGradingRequestedEvent evt) {
    var rubric = evt.ExamModeTag switch {
        null or "" => SpeakingRubric.Standard(),
        string t when t.StartsWith("opic_") => SpeakingRubric.ForOPIC(t),
        string t when t.StartsWith("vstep_") => SpeakingRubric.ForVSTEP(t),
        _ => SpeakingRubric.Standard()
    };
    // [Unified pipeline — same steps, different LLM prompt + weight]
    var result = await _pipeline.RunAsync(evt.AudioUrl, rubric, evt.ReferenceText);
    await UpdateSubmissionAsync(evt.SubmissionId, result);
    await _hub.Clients.User(evt.UserId).AiGradingProgress(new {
        submissionId = evt.SubmissionId, status = "Done"
    });
}
```

#### API Endpoints (Sprint 6)

```
POST /api/v1/speaking/upload           Upload audio → { submissionId }
GET  /api/v1/speaking/{id}/status      { status: "Pending"|"Processing"|"Done"|"Failed" }
GET  /api/v1/speaking/{id}/result      Scores + transcript + phoneme + LlmFeedback
```

#### Frontend Components (Sprint 6)

```
SpeakingRecorder.tsx
  Props: { onAudioReady(blob, url), timeLimitSec?, referenceText? }
  States: idle → recording → stopped → uploading → pending → done
  UI:
    idle:      "Nhấn để bắt đầu ghi âm" (mic icon)
    recording: animated waveform (Web Audio API) + countdown timer + "Dừng ghi"
    stopped:   audio preview player + "Nghe lại" + "Nộp bài"
    uploading: progress bar
    pending:   spinner + "Đang phân tích giọng nói..."
    done:      → navigate to AiFeedbackPage

/quiz/[id]/speaking/page.tsx
  - Load câu hỏi SpeakingRecording type
  - Hiển thị referenceText (prompt) + AudioUrl (nếu có câu hỏi audio)
  - SpeakingRecorder → upload → poll (hoặc SignalR)

/quiz/[id]/ai-result/[attemptId]/page.tsx
  Speaking view:
    - Transcript với mispronounced words (red highlight, hover = expected_ipa)
    - Score cards: Pronunciation / Fluency / Accuracy / Final
    - LLM feedback (markdown rendered)
    - "Nghe lại audio" player
  Writing view (Sprint 7):
    - Essay text với grammar errors underlined (hover = suggestion)
    - Rubric scorecard: 4 dimensions, bar chart
    - LLM feedback markdown
```

#### RabbitMQ (Phase 3B baseline — dùng chung cả 3 mode)

```
Exchange: quiz.events (topic type)

speaking.grading.requested → q.speaking.grading → SpeakingGradingWorker
  Payload: {
    submissionId, userId, audioUrl, questionId,
    referenceText?,    // câu gốc để phoneme compare
    examMode,          // Standard | OPIC | VSTEP
    examModeTag?,      // "opic_describe" | "vstep_p2" | ...
    comboType?,        // OPIC: "describe" | "roleplay" | "experience"
    speakingPart?,     // VSTEP: "P1" | "P2" | "P3"
    selectedOption?,   // VSTEP P2: "A"|"B"|"C"
    bulletPoints?,     // VSTEP P3: ["point1","point2"]
    sessionId?         // OPIC/VSTEP: để trigger aggregate sau
  }

speaking.grading.done → (SignalR push to user + update attempt)

attempt.completed → q.analytics.update → AnalyticsWorker
```

---

### 3.1.4 Sprint 7 — Writing AI + Recommendation (Phase 3B)

> **Dùng chung:** WritingSubmission và WritingGradingWorker tái dùng 60% cho VSTEP Writing (Task 1 + Task 2).  
> Chỉ khác: rubric weights và LLM prompt.

#### Entity: WritingSubmission

```csharp
public class WritingSubmission : BaseEntity {
    public Guid    AttemptAnswerId
    public Guid    UserId
    public string  EssayText
    public int     WordCount
    public string? TaskType               // null="standard" | "letter" | "essay_vstep"
    public string? EssayType              // VSTEP T2: "argumentative"|"discussion"|"problem_solution"|"cause_effect"
    public string? GrammarErrors          // JSONB: [{message, offset, length, replacements[]}]
    public string? VocabularyAnalysis     // JSONB: {cefrLevel, lexicalDiversity, ...}
    public decimal? GrammarScore          // 0–100
    public decimal? VocabularyScore       // 0–100
    public decimal? CoherenceScore        // 0–100
    public decimal? TaskAchievementScore  // 0–100
    public decimal? FinalScore            // weighted average (mode-dependent)
    public string?  LlmFeedback           // markdown + inline corrections
    public string   GradingStatus         // Pending | Processing | Done | Failed
    public DateTime? ProcessedAt
}
```

#### Database (Phase 3B)

```sql
CREATE TABLE "WritingSubmissions" (
    "Id"                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "AttemptAnswerId"       UUID NOT NULL REFERENCES "AttemptAnswers"("Id"),
    "UserId"                UUID NOT NULL,
    "EssayText"             TEXT NOT NULL,
    "WordCount"             INT  NOT NULL DEFAULT 0,
    "TaskType"              VARCHAR(20),
    "EssayType"             VARCHAR(30),
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
CREATE INDEX idx_writing_answer ON "WritingSubmissions"("AttemptAnswerId");
CREATE INDEX idx_writing_status ON "WritingSubmissions"("GradingStatus")
    WHERE "GradingStatus" IN ('Pending', 'Processing');
```

#### AI Pipeline — WritingGradingWorker

```
[INPUT] Essay text, min 50 words, max 1000 words (standard) / max 300 words T1, max 500 words T2 (VSTEP)
    ↓
[1] Pre-processing
    word count, language detection, strip HTML/whitespace
    status = Pending → RabbitMQ: writing.grading.requested
    ↓
[2] Grammar Check (LanguageTool REST API)
    POST /v2/check?language=en-US
    GrammarScore = max(0, 100 − errors.Count × 5)
    GrammarErrors JSONB: [{message, offset, length, replacements[]}]
    ↓
[3] Vocabulary Analysis (LLM)
    CEFR level distribution of content words (A1/A2/B1/B2/C1/C2)
    lexicalDiversity = unique_lemmas / total_words
    VocabularyScore = cefrWeightedAvg × 100 × diversityBonus
    ↓
[4] Coherence & Structure (LLM Rubric)
    paragraph count, logical connectors, topic sentence consistency
    CoherenceScore 0–100
    ↓
[5] Task Achievement (LLM)
    Does text address prompt? completeness? relevance?
    TaskScore 0–100
    ↓
[6] LLM Final Feedback
    Mode-specific prompt (Standard / VSTEP Letter / VSTEP Essay)
    Output: markdown + inline corrections + suggestions
    ↓
[7] Score & Persist
    Standard:  FinalScore = 0.25 × (Grammar + Vocab + Coherence + Task)
    Update WritingSubmission: status=Done
    Publish: writing.grading.done → SignalR push
```

#### Mode-Aware Rubric Weights

| Mode / Task | Grammar | Vocabulary | Coherence | Task Achievement |
|-------------|:---:|:---:|:---:|:---:|
| **Standard** | 25% | 25% | 25% | 25% |
| **VSTEP Task 1 — Letter** (min 120w) | Accuracy 30% | Language Range 30% | — | Task Fulfillment 40% |
| **VSTEP Task 2 — Essay** (min 250w) | Gram. Range+Acc. 25% | Lexical Resource 25% | Coherence+Cohesion 25% | Task Achievement 25% |

```
VSTEP Final Writing Score:
  T1_score × (1/3) + T2_score × (2/3)  → 0–10 scale

VSTEP Letter format check (extra validation):
  greeting present? body with bullet coverage? closing + signature?
  → Deduct points if missing format elements

VSTEP Essay type detection:
  LLM detects: Argumentative | Discussion | Problem-Solution | Cause-Effect
  → Selects mode-specific rubric prompt variant
```

#### RecommendationService

```csharp
// Triggers: PlacementCompleted event, QuizAttemptCompleted (score < 60%)
public class RecommendationService {
    public async Task<RecommendedPath> GetRecommendationsAsync(
        Guid userId, int assignedLevel,
        Dictionary<SkillType, decimal> skillScores)
    {
        var weakSkills = skillScores
            .Where(kv => kv.Value < 60)
            .Select(kv => kv.Key)
            .ToList();

        var courses = await _repo.QueryCoursesAsync(c =>
            c.Level >= assignedLevel - 1 &&
            c.Level <= assignedLevel + 1 &&
            weakSkills.Contains(c.SkillType) &&
            c.Status == CourseStatus.Published);

        return new RecommendedPath {
            Courses = courses
                .OrderByDescending(c => c.RatingAverage)
                .ThenByDescending(c => c.TotalStudents)
                .Take(5)
                .Select(c => new CourseSnapshot { Id = c.Id, Title = c.Title, ... })
                .ToList()
        };
    }
}
```

#### API Endpoints (Sprint 7)

```
POST /api/v1/writing/submit           Submit essay → { submissionId }
  Body: { essayText, wordCount, questionId, attemptId,
          taskType?: "letter"|"essay_vstep",
          essayType?: "argumentative"|...,
          bulletPoints?: string[] }
GET  /api/v1/writing/{id}/status      { status, wordCount }
GET  /api/v1/writing/{id}/result      GrammarErrors + VocabAnalysis + Rubric + LlmFeedback
```

#### Frontend Components (Sprint 7)

```
EssayEditor.tsx
  Props: { minWords, maxWords?, taskType?, bulletPoints?, onSubmit }
  UI:
    - Textarea full-width, auto-resize
    - Word count badge (real-time): "127 / min 120 từ" (green ≥ min, red < min)
    - Spell-check hints (optional: wavy red underline)
    - Auto-save draft to sessionStorage (restore on page refresh)
    - "Nộp bài" button disabled until wordCount >= minWords

/quiz/[id]/writing/page.tsx
  - Load EssayWriting / EssayWritingVSTEP question
  - Show prompt text + bullet points
  - EssayEditor → submit → pending state (spinner + SignalR)
  - Redirect to /quiz/[id]/ai-result once Done

WordCountBadge.tsx       ← Real-time indicator (shared cho cả 3 mode)
LetterFormatGuide.tsx    ← VSTEP Task 1: khung format thư (greeting / body / closing)
EssayTypeTag.tsx         ← VSTEP Task 2: badge "Argumentative" | "Discussion" | ...
```

#### RabbitMQ additions (Sprint 7)

```
writing.grading.requested → q.writing.grading → WritingGradingWorker
  Payload: {
    submissionId, userId, essayText, wordCount, questionId,
    taskType?,       // null | "letter" | "essay_vstep"
    essayType?,      // VSTEP T2: "argumentative" | "discussion" | ...
    bulletPoints?,   // VSTEP T1: ["point1","point2","point3"]
    examMode,        // Standard | VSTEP
    sessionId?       // VSTEP: để trigger VSTEPSessionWorker sau khi Done
  }

placement.completed     → q.recommendation → RecommendationWorker
  Payload: { resultId, userId, assignedLevel, skillBreakdown }
```

---

### 3.1.5 Sprint 8 — Adaptive Quiz (Phase 3C)

> **Chỉ dùng trong Standard mode.** OPIC và VSTEP có cấu trúc cố định, không adaptive.

#### Algorithm

```
Khởi tạo:
  currentDifficulty = Medium
  consecutiveCorrect = 0
  answeredSet = {}

Per answer (SaveAnswer handler):
  answeredSet.Add(questionId)
  IF isCorrect:
    consecutiveCorrect++
    IF consecutiveCorrect >= 2 → currentDifficulty = next harder
  ELSE:
    consecutiveCorrect = 0
    currentDifficulty = next easier
  → return { nextQuestionId } in response (server selects)

Next question selection:
  pool = Questions
    .Where(SkillType == targetSkill OR SkillType == Mixed)
    .Where(Difficulty == currentDifficulty)
    .Where(Id NOT IN answeredSet)
    .Where(IsDeleted == false)
    .OrderBy(_ => Guid.NewGuid())  // random
    .FirstOrDefault()
  IF pool == null → fallback to adjacent difficulty (±1)

Stop conditions:
  answeredCount >= 20  (max questions)
  OR consecutiveCorrect >= 5 AND currentDifficulty == Hard  (mastery)
  OR question pool exhausted

Scoring:
  difficultyWeight = { Easy: 1.0, Medium: 1.5, Hard: 2.0 }
  rawScore = Σ(correct_i × weight_i)
  maxPossible = 20 × 2.0  (all Hard correct)
  finalScore = (rawScore / maxPossible) × quiz.TotalScore

State persistence (Y12 fix — persist to avoid losing progress on refresh):
  Store in QuizAttempt.AntiCheatLog JSONB (overload field):
    { adaptiveState: { difficulty: "Medium", streak: 2, answered: 8 } }
  Restore on GetAttemptInProgress query
```

#### Backend

```
AdaptiveEngine.cs (MLS.Application/Quiz/Services/):
  SelectNextQuestion(answeredSet, currentDifficulty, targetSkill, quizId) → QuestionId?
  CalculateNextDifficulty(isCorrect, currentState) → DifficultyLevel
  CalculateAdaptiveScore(answers, difficultyMap, totalScore) → decimal

AttemptCommands.cs — SaveAnswer handler extension:
  IF quiz.QuizType == AdaptiveQuiz:
    nextState = AdaptiveEngine.CalculateNextDifficulty(isCorrect, currentState)
    nextQ = AdaptiveEngine.SelectNextQuestion(...)
    Persist state → QuizAttempt.AntiCheatLog
    Return: { isCorrect, nextQuestionId, currentDifficulty, answeredCount }
```

#### Frontend

```
/quiz/[id]/adaptive/page.tsx
  Khác với play page (không có navigator grid — câu hỏi dynamic):
  - Difficulty indicator: "Độ khó hiện tại: ●●○ Trung bình"
  - Progress: "Câu 12 / tối đa 20"
  - "Mastery achieved! 5 câu khó liên tiếp đúng" banner → auto submit
  - Sau mỗi đáp án: flash correct/incorrect → tự động chuyển câu tiếp (từ server)
  - Không có "Nộp bài" manual button (auto-submit khi dừng)
```

---

### 3.1.6 Sprint 9–10 — Realtime Quiz (Phase 3C)

> **Chỉ dùng trong Standard mode.** SignalR Hub mở rộng thêm events cho OPIC/VSTEP grading push.

#### Entities mới

```csharp
public class RealtimeQuizRoom : BaseEntity {
    public Guid      QuizId
    public string    RoomCode              // 6 ký tự, unique join code
    public Guid      HostId
    public RoomState State                 // Waiting | Active | Paused | Ended
    public int       CurrentQuestionIndex
    public DateTime? StartedAt
    public DateTime? EndedAt
    public ICollection<RoomParticipant> Participants
}

public class RoomParticipant : BaseEntity {
    public Guid   RoomId
    public Guid   UserId
    public int    Score                    // điểm tích lũy
    public int    Rank                     // cập nhật sau mỗi câu
    public bool   IsConnected              // SignalR connection state
    public DateTime JoinedAt
}
```

#### Database (Phase 3C)

```sql
CREATE TABLE "RealtimeQuizRooms" (
    "Id"                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "QuizId"               UUID NOT NULL REFERENCES "Quizzes"("Id"),
    "RoomCode"             VARCHAR(10) NOT NULL UNIQUE,
    "HostId"               UUID NOT NULL,
    "State"                VARCHAR(20) NOT NULL DEFAULT 'Waiting',
    "CurrentQuestionIndex" INT NOT NULL DEFAULT 0,
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
CREATE INDEX idx_rooms_code   ON "RealtimeQuizRooms"("RoomCode");
CREATE INDEX idx_rooms_host   ON "RealtimeQuizRooms"("HostId");
CREATE INDEX idx_room_participants ON "RoomParticipants"("RoomId");
```

#### SignalR Hub (QuizHub.cs) — Dùng chung cả 3 mode

```csharp
// Hub dùng chung: Realtime Quiz events + AI grading push (OPIC/VSTEP/Standard)
public interface IQuizHubClient {
    // ── Realtime Quiz (Sprint 9–10) ─────────────────────────────
    Task RoomStateChanged(RoomStateChangedDto dto);
    Task ParticipantJoined(ParticipantJoinedDto dto);
    Task QuestionStarted(QuestionStartedDto dto);
    Task TimerTick(int secondsRemaining);
    Task AnswerResult(AnswerResultDto dto);
    Task LeaderboardUpdate(LeaderboardDto dto);
    Task QuizEnded(FinalLeaderboardDto dto);

    // ── AI Grading push (Sprint 6–7, dùng chung Standard/OPIC/VSTEP) ──
    Task AiGradingProgress(AiGradingProgressDto dto);
    // { submissionId, userId, status: "Processing"|"Done", partialScore? }

    // ── OPIC-specific (Phase 3.2) ────────────────────────────────
    Task OPICGradingProgress(OPICGradingProgressDto dto);
    // { sessionId, questionIndex: 1–15, status, partialScore? }
    Task OPICResultReady(OPICResultReadyDto dto);
    // { sessionId, assignedLevel, overallScore }

    // ── VSTEP-specific (Phase 3.3) ───────────────────────────────
    Task VSTEPPartGraded(VSTEPPartGradedDto dto);
    // { sessionId, part: "Writing"|"Speaking", score }
    Task VSTEPResultReady(VSTEPResultReadyDto dto);
    // { sessionId, assignedBand, scores: {listening, reading, writing, speaking} }
}
```

#### Redis Data Structures

```
// Leaderboard per room (Realtime)
ZADD  quiz:room:{roomId}:lb {score} {userId}
ZREVRANGE quiz:room:{roomId}:lb 0 9 WITHSCORES  → top 10

// Answer tracking per question
HSET  quiz:room:{roomId}:q{n}:ans {userId} {answeredAtMs}

// Room state
SET   quiz:room:{roomId}:state "active"
SET   quiz:room:{roomId}:currentQ "3"

// TTL
EXPIRE quiz:room:{roomId}:lb 7200     // 2 giờ
EXPIRE quiz:room:{roomId}:state 7200
```

#### Scoring Formula

```
Per correct answer (Realtime):
  basePoints = 500
  speedBonus = max(0, (timeLimit_ms − timeTaken_ms) / timeLimit_ms) × 500
  totalPoints = basePoints + speedBonus   // 500–1000 per correct

Rank update: ZADD quiz:room:{roomId}:lb {newScore} {userId}
  Server → LeaderboardUpdate event → clients
```

#### API Endpoints (Sprint 9–10)

```
POST /api/v1/realtime/rooms               Teacher tạo room → { roomId, roomCode }
  Body: { quizId }
GET  /api/v1/realtime/rooms/{code}        Info room (state, participantCount)
POST /api/v1/realtime/rooms/{code}/join   Student tham gia
POST /api/v1/realtime/rooms/{id}/start    Host bắt đầu (sends QuestionStarted via SignalR)
GET  /api/v1/realtime/rooms/{id}/leaderboard  REST fallback cho leaderboard
```

#### Room Lifecycle

```
Waiting → (host clicks Start) → Active
  Active loop:
    Host: NextQuestion() → SignalR QuestionStarted (questionData + timeLimit)
    Server: 20s countdown → TimerTick(remaining)
    Students: SendAnswer(qId, optionId) → AnswerResult + LeaderboardUpdate
    Host: NextQuestion() → ... (repeat until all questions)
  Host: EndQuiz() → RoomState=Ended → QuizEnded(finalLeaderboard)
    → Persist final scores to RoomParticipants
    → Persist QuizAttempt + AttemptAnswers → AutoGrader
```

#### Frontend (Sprint 9–10)

```
/realtime/join/page.tsx
  - Input: RoomCode (6 chars) → join → "Chờ giáo viên bắt đầu..."
  - ParticipantJoined → animate participants joining

/realtime/[code]/play/page.tsx
  - QuestionStarted → hiện câu hỏi + countdown circle 20s
  - Chọn đáp án → flash correct (green) / incorrect (red)
  - AnswerResult: +điểm animation
  - LeaderboardUpdate: animated rank list (top 10)
  - QuizEnded: podium + confetti + "Kết quả cuối"

/teacher/realtime/new/page.tsx
  - Chọn quiz (filter: Standard, Published) → "Tạo phòng"
  - Hiện: RoomCode lớn + QR Code cho student join

/teacher/realtime/[id]/host/page.tsx
  - Left: Participants list (live, IsConnected indicator)
  - Center: Current question preview + "Câu tiếp theo" / "Kết thúc"
  - Right: Live leaderboard (top 10)

src/components/realtime/
  Leaderboard.tsx        ← Animated rank list, highlight rank change
  CountdownOverlay.tsx   ← Full-screen 3-2-1 countdown before quiz starts
  LiveAnswerFeed.tsx     ← Real-time bar chart: % chọn từng option
  SpeedBonusToast.tsx    ← "+750 điểm" pop animation
```

---

---

## 4. PHASE 3.2 — OPIC MODE

### 4.1 Tổng quan OPIC

```
OPIC = Oral Proficiency Interview by Computer
Đánh giá: Kỹ năng Speaking only
Thời gian: 40 phút (20 phút orientation + 40 phút thi)
Cấu trúc: 15 câu / 5 combos (3 survey topics + 2 chủ đề chung)
Kết quả: NH / IL / IM1 / IM2 / IM3 / IH / AL
Ngôn ngữ: Tiếng Việt / Tiếng Anh / Tiếng Hàn
Đặc thù: Câu hỏi là AUDIO (không có text) từ AI avatar (Mai/Ava/Jiwon)
```

### 4.2 Cấu trúc bài thi OPIC

```
Orientation (không tính điểm):
  1. Background Survey   → student chọn ≥12 chủ đề sở thích
  2. Self Assessment     → chọn level mục tiêu (1–6)
  3. Pre-test Setup      → test micro + chọn level lần cuối
  4. Sample Question     → câu hỏi thử

Session 1 (câu 1–7):
  Câu 1: Giới thiệu bản thân
  Combo 1 (câu 2,3,4): Survey topic 1 — Miêu tả / Thường làm gì / Kinh nghiệm
  Combo 2 (câu 5,6,7): Survey topic 2 — Miêu tả / Thường làm gì / Kinh nghiệm

  → Điều chỉnh độ khó (student chọn Dễ hơn / Tương tự / Khó hơn)

Session 2 (câu 8–15):
  Combo 3 (câu 8,9,10):  Chủ đề chung 1 — Miêu tả / So sánh / Kinh nghiệm
  Combo 4 (câu 11,12,13): Role-play (hỏi thông tin / giải quyết vấn đề / kể kinh nghiệm)
  Combo 5 (câu 14,15):   Survey topic 3 — Miêu tả / Hỏi AI examiner
```

### 4.3 OPIC Question Types

#### 4.3.1 Câu hỏi thông thường (câu 1–13)

```
Payload format trong Question.Content (JSONB string):
{
  "audioUrl": "s3://opic/questions/{id}.mp3",  // audio từ avatar
  "questionText": "...",                        // text hiển thị song song (optional)
  "comboType": "describe | routine | experience | compare | prepare | issue",
  "topicCategory": "music | travel | restaurant | bank | ...",
  "speakingPrompt": "Hãy mô tả một bãi biển bạn yêu thích...",
  "targetLevel": "IM1",
  "suggestedDuration": 120  // giây (2 phút mục tiêu)
}
```

#### 4.3.2 Role-play questions (câu 11–13)

```
QuestionType = OPICRolePlay
Payload:
{
  "situationAudioUrl": "s3://opic/roleplay/{id}.mp3",
  "situationText": "Bạn muốn mở tài khoản ngân hàng...",
  "roleType": "ask_info | explain_problem | share_experience",
  "role": "customer",        // student đóng vai gì
  "counterpartRole": "bank_staff"
}
```

#### 4.3.3 Câu hỏi hỏi AI Examiner (câu 15 — level 3–4)

```
QuestionType = OPICQuestionAsking
Payload:
{
  "contextAudioUrl": "s3://opic/q15/{id}.mp3",
  "contextText": "Hãy hỏi tôi 3–4 câu về bãi biển tôi thường đến...",
  "examinerPersona": "Mai",  // "Mai" | "Ava" | "Jiwon"
  "examinerContext": "Tôi sống gần biển Đà Nẵng...",
  "minQuestions": 3,
  "maxQuestions": 4
}
```

### 4.4 New Entities cho OPIC

#### 4.4.1 OPICTopicSurvey

```csharp
// Background survey — student chọn chủ đề trước khi thi
public class OPICTopicSurvey : BaseEntity {
    public Guid    UserId
    public string  Language            // "vi" | "en" | "ko"
    public string  SelectedTopics      // JSONB: ["music","travel","sport",...] (≥12 topics)
    public string  TargetLevel         // "IL" | "IM" | "IH" | "AL"
    public int     ChosenDifficulty    // 1–6 (chọn trong Self Assessment)
    public DateTime CreatedAt
    public DateTime? UpdatedAt
}
```

#### 4.4.2 OPICSession (wrapper bài thi 15 câu)

```csharp
public class OPICSession : BaseEntity {
    public Guid    UserId
    public Guid    SurveyId             // FK → OPICTopicSurvey
    public string  Language             // "vi" | "en" | "ko"
    public string  SessionState         // Orientation | Session1 | MidAdjust | Session2 | Completed
    public int     ChosenDifficulty     // độ khó ban đầu (1–6)
    public string? MidAdjustChoice      // "easier" | "same" | "harder"
    public int?    FinalDifficulty      // sau mid-adjust
    public string  OPICLevelResult      // "IM1" | "IM2" | "IH" | ...
    public decimal? OverallScore        // 0–100 tổng hợp từ AI
    public bool    IsCompleted
    public DateTime StartedAt
    public DateTime? CompletedAt

    // Navigation
    public ICollection<OPICAttemptRef> AttemptRefs  // 15 QuizAttempt IDs theo thứ tự
    public ICollection<OPICComboGroup> Combos
}
```

#### 4.4.3 OPICComboGroup

```csharp
// 5 combo, mỗi combo 2–4 câu cùng chủ đề
public class OPICComboGroup : BaseEntity {
    public Guid    SessionId
    public int     ComboIndex           // 1–5
    public string  TopicCategory        // "music" | "travel" | "bank" | ...
    public string  TopicType            // "survey_topic" | "common_topic" | "roleplay" | "self_intro"
    public string  ComboQuestions       // JSONB: [questionId1, questionId2, questionId3]
    public int[]   ComboTypes           // [1=Miêu tả, 2=Thường làm, 3=Kinh nghiệm]
}
```

#### 4.4.4 OPICLevelResult

```csharp
// Kết quả OPIC level sau khi AI chấm
public class OPICLevelResult : BaseEntity {
    public Guid    UserId
    public Guid    SessionId
    public string  Language
    public string  AssignedLevel        // "NH" | "IL" | "IM1" | "IM2" | "IM3" | "IH" | "AL"
    public decimal OverallScore         // 0–100
    public decimal PronunciationScore   // từ SpeakingSubmission aggregated
    public decimal FluencyScore
    public decimal CoherenceScore       // LLM rubric
    public decimal VocabularyScore
    public decimal TaskAchievementScore
    public string? LlmLevelJustification // JSONB: LLM giải thích tại sao là IM2 chứ không phải IM3
    public string? StrongestSkill        // "fluency" | "vocabulary" | ...
    public string? WeakestSkill
    public string? ImprovementAdvice    // markdown
    public DateTime TestedAt
}
```

### 4.5 OPIC Level Mapping Engine

```
OPICLevelEngine:
Input: aggregated scores từ 14 SpeakingSubmissions (câu 1–14, bỏ câu 15)
       {pronunciation: 0–100, fluency: 0–100, coherence: 0–100, vocab: 0–100, task: 0–100}

Tính overallScore:
  weightedScore = 0.20*pronunciation + 0.25*fluency + 0.25*coherence + 0.20*vocab + 0.10*task

Level mapping:
  >= 90 → AL   (Advanced Low)
  >= 78 → IH   (Intermediate High)
  >= 66 → IM3  (Intermediate Mid 3)
  >= 54 → IM2  (Intermediate Mid 2)
  >= 42 → IM1  (Intermediate Mid 1)
  >= 30 → IL   (Intermediate Low)
   < 30 → NH   (Novice High)

Điều chỉnh theo selectedLevel:
  Nếu student chọn level 2–2 (mục tiêu IL):
    Capped tối đa IM2 (câu hỏi không đủ khó để đánh giá cao hơn)
  Nếu student chọn level 5–5 hoặc 6–6:
    Mở full range IH/AL
```

### 4.6 Audio Player Component cho OPIC

```typescript
// Component dùng chung cho cả OPIC và VSTEP Listening
interface AudioPlayerProps {
    audioUrl: string
    playLimit?: number        // OPIC: 2, VSTEP: 2, null = không giới hạn
    preListenSeconds?: number // thời gian đọc câu hỏi trước khi audio chạy (VSTEP: 20s)
    autoPlay?: boolean
    onEnded?: () => void
    onLimitReached?: () => void
}
```

```
AudioQuestionPlayer states:
  idle      → nút Play (lần 1 / lần 2)
  playing   → waveform animated + progress bar + "Đang phát (lần X/2)"
  finished  → "Đã nghe lần 1" → nút "Nghe lại" (nếu còn lần)
  exhausted → "Đã hết lượt nghe" (disable nút)
```

### 4.7 Mid-Quiz Level Adjustment

```typescript
// Sau câu 7, hiện UI chọn độ khó
interface MidAdjustmentScreenProps {
    currentDifficulty: number   // 1–6 (đã chọn ban đầu)
    onSelect: (choice: 'easier' | 'same' | 'harder') => void
}

// Mapping:
//   'easier': targetDifficulty = max(1, current - 1)
//   'same'  : targetDifficulty = current
//   'harder': targetDifficulty = min(6, current + 1)
// → Lưu vào OPICSession.FinalDifficulty + ExamMeta.midAdjustChoice
// → Backend chọn question pool phù hợp cho câu 8–15
```

### 4.8 AI Examiner (câu 15)

```typescript
// Student hỏi AI examiner, AI trả lời real-time
interface AIExaminerProps {
    persona: "Mai" | "Ava" | "Jiwon"
    context: string                   // context của examiner
    minQuestions: number              // 3
    maxQuestions: number              // 4
    onComplete: (transcript: string) => void
}
```

```
Flow:
1. Student ghi âm câu hỏi (SpeakingRecorder)
2. Upload → Whisper STT → nhận transcript câu hỏi
3. POST /api/opic/examiner/respond
   Body: { question: transcript, persona, context, sessionId }
4. LLM đóng vai examiner → trả lời văn bản
5. TTS (Text-to-Speech) → audio response
6. Frontend: phát audio AI trả lời
7. Student ghi âm câu tiếp (lặp lại, tối đa maxQuestions lần)
8. Sau khi hỏi đủ minQuestions → "Hoàn thành" button
9. Grading: LLM đánh giá chất lượng câu hỏi student đặt ra
   (relevance, grammar, completeness)
```

### 4.9 OPIC Speaking Grading — Rubric mở rộng

Tái dùng `SpeakingGradingWorker` nhưng thêm OPIC-specific scoring:

```
SpeakingGradingWorker — OPIC mode additions:
  [Standard pipeline] Whisper + Phoneme + Fluency + LLM

  [OPIC additions]
  - Coherence score: LLM đánh giá mạch lạc câu trả lời theo combo context
  - Task achievement: Có trả lời đúng loại câu hỏi không?
    (Miêu tả → có dùng adj? Kinh nghiệm → có thì quá khứ? Role-play → có đúng vai không?)
  - Vocabulary score: CEFR level của từ vựng dùng trong câu trả lời nói
  - Content score: Có đề cập đủ 2–3 ý chính không?

OPIC Rubric weights per question type:
  Miêu tả:   Pronunciation 30% + Fluency 25% + Coherence 20% + Vocab 15% + Task 10%
  Kinh nghiệm: Pronunciation 25% + Fluency 25% + Coherence 25% + Vocab 15% + Task 10%
  Role-play:  Pronunciation 20% + Fluency 20% + Coherence 20% + Vocab 20% + Task 20%
```

### 4.10 OPIC Teacher Tools

```
Teacher có thể:
  ✅ Tạo OPIC Question Bank (upload audio, gắn topic, level)
  ✅ Tạo OPICMockTest quiz (wizard riêng cho OPIC)
  ✅ Xem kết quả học viên theo OPIC level
  ✅ Xem analytics: % đạt IL / IM / IH, skill breakdown
  ✅ Review AI feedback từng câu (có thể override level)
  ✅ Upload script mẫu (ScriptTemplate) cho từng chủ đề
```

### 4.11 Script Template Builder (Teacher)

```csharp
public class OPICScriptTemplate : BaseEntity {
    public Guid    CreatedBy
    public string  Language          // "vi" | "en" | "ko"
    public string  TopicCategory     // "music" | "travel" | ...
    public string  ComboType         // "describe" | "routine" | "experience"
    public string  TargetLevel       // "IM1" | "IM2" | "IH"
    public string  OpeningTemplate   // mở bài mẫu
    public string  BodyTemplate      // thân bài mẫu (2–3 ý)
    public string  ClosingTemplate   // kết bài mẫu
    public string? VocabList         // JSONB: [từ hay dùng cho topic này]
    public string? UsefulPhrases     // JSONB: ["thường làm gì":"I usually...", ...]
    public bool    IsPublished
}
```

---

## 5. PHASE 3.3 — VSTEP MODE

### 5.1 Tổng quan VSTEP

```
VSTEP = Vietnamese Standardized Test of English Proficiency
Đánh giá: 4 kỹ năng — Listening + Reading + Writing + Speaking
Thời gian: ~3.5 giờ (4 phần riêng biệt)
Chuẩn: CEFR A2/B1/B2/C1 (bậc 2–5)
Kết quả: Điểm 0–10 từng kỹ năng → xác định Bậc
```

### 5.2 Cấu trúc 4 phần thi

| Phần | Thời gian | Format | Số câu/task |
|------|-----------|--------|-------------|
| Listening | 40 phút | 3 parts MCQ (audio) | 35 câu |
| Reading | 60 phút | 4 passages MCQ | 40 câu |
| Writing | 60 phút | Task 1 + Task 2 | 2 bài viết |
| Speaking | 12 phút | 3 parts speaking | 3 phần |

### 5.3 Cấu trúc từng phần

#### 5.3.1 Listening (35 câu MCQ)

```
Part 1: Nghe thông báo/hướng dẫn ngắn → MCQ chi tiết
  - 8 đoạn ngắn × 1 câu/đoạn = 8 câu
  - Audio: monologue ngắn (announcement, instruction)
  - 20 giây đọc câu hỏi trước; nghe 2 lần

Part 2: Nghe hội thoại dài → MCQ
  - 3 đoạn hội thoại × ~4 câu/đoạn = 12 câu
  - Audio: extended dialogue (2 người)
  - 20 giây đọc câu hỏi trước; nghe 2 lần

Part 3: Nghe bài nói/bài giảng → MCQ suy luận
  - 3 đoạn × 5 câu/đoạn = 15 câu
  - Audio: lecture, talk (1 người)
  - Yêu cầu suy luận + thái độ người nói
```

#### 5.3.2 Reading (40 câu MCQ)

```
4 passages × 10 câu MCQ / passage
Tổng từ: 1,900–2,500 từ
Câu hỏi types: chi tiết, ý chính, thái độ tác giả, suy luận, nghĩa từ

Layout: Split view — passage trái (scrollable), câu hỏi phải
```

#### 5.3.3 Writing (2 tasks)

```
Task 1 (20 phút — 1/3 điểm):
  - Viết thư/email ≥120 từ
  - Formal (khiếu nại, yêu cầu, tra cứu) hoặc Informal (thư bạn)
  - Đề cho tình huống + 2–3 bullet points cần đề cập
  - QuestionType = LetterWriting

Task 2 (40 phút — 2/3 điểm):
  - Viết bài luận ≥250 từ về chủ đề xã hội
  - 4 dạng: Argumentative / Discussion / Problem-Solution / Cause-Effect
  - QuestionType = EssayWritingVSTEP
```

#### 5.3.4 Speaking (3 parts, ~12 phút)

```
Part 1 — Social Interaction (2 phút, không prep time):
  - Chọn 1 trong 2 nhóm câu hỏi (3 câu về hobbies HOẶC 3 câu về family/friends)
  - Trả lời tự nhiên, không có thời gian chuẩn bị
  - QuestionType = SpeakingRecording (tái dùng)

Part 2 — Solution Discussion (5 phút, 1 phút prep):
  - Đọc tình huống + 3 lựa chọn giải pháp
  - Chọn 1 option + nói tại sao (+ explain tại sao không chọn 2 cái kia)
  - QuestionType = SolutionDiscussion

Part 3 — Topic Development (5 phút, 1 phút prep):
  - Topic statement + 2–3 gợi ý luận điểm
  - Trình bày bài nói có bố cục + trả lời 1–3 follow-up questions
  - QuestionType = TopicDevelopment
```

### 5.4 New Entities cho VSTEP

#### 5.4.1 VSTEPSession (wrapper 4 phần thi)

```csharp
public class VSTEPSession : BaseEntity {
    public Guid    UserId
    public string  TargetBand          // "B1" | "B2" | "C1" — mục tiêu học viên
    public string  CurrentPart         // "Listening" | "Reading" | "Writing" | "Speaking" | "Completed"
    public string  PartState           // JSONB: {listening:"Graded", reading:"InProgress", ...}

    // Scores per part (0–10)
    public decimal? ListeningScore
    public decimal? ReadingScore
    public decimal? WritingScore
    public decimal? SpeakingScore
    public decimal? OverallScore       // average of 4

    // Band result
    public string? AssignedBand        // "A2" | "B1" | "B2" | "C1"
    public int?    AssignedLevel       // 2 | 3 | 4 | 5 (tương đương Khung 6 bậc VN)

    public DateTime StartedAt
    public DateTime? CompletedAt
    public bool    IsCompleted

    // FK to 4 attempts
    public Guid?   ListeningAttemptId  // FK → QuizAttempts
    public Guid?   ReadingAttemptId
    public Guid?   WritingAttemptId
    public Guid?   SpeakingAttemptId
}
```

#### 5.4.2 PassageGroup (link đoạn văn/audio với câu hỏi)

```csharp
// Dùng chung cho cả Listening và Reading
public class PassageGroup : BaseEntity {
    public Guid    QuizId
    public int     GroupIndex          // 1–4 (Reading), 1–3 (Listening P2/P3)
    public string  PassageType         // "reading" | "listening_short" | "listening_dialogue" | "listening_lecture"
    public string? PassageText         // nội dung đoạn văn (Reading)
    public string? AudioUrl            // audio URL (Listening)
    public int?    AudioPlayLimit      // 2 (cố định cho VSTEP)
    public int?    PreListenSeconds    // 20 (thời gian đọc câu hỏi trước)
    public string  QuestionIds         // JSONB: [questionId1, ..., questionId10]
    public int     DisplayOrder
}
```

#### 5.4.3 VSTEPBandResult

```csharp
public class VSTEPBandResult : BaseEntity {
    public Guid    UserId
    public Guid    SessionId
    public string  AssignedBand        // "A2" | "B1" | "B2" | "C1"
    public int     AssignedLevel       // 2–5 (Khung 6 bậc)
    public decimal ListeningScore      // 0–10
    public decimal ReadingScore
    public decimal WritingScore
    public decimal SpeakingScore
    public decimal OverallScore        // average
    public string? SkillBreakdown      // JSONB: chi tiết breakdown từng skill
    public string? RecommendedCourses  // JSONB: [courseId + snapshot metadata]
    public DateTime TestedAt
}
```

### 5.5 VSTEP Band Mapping Engine

```
VSTEPBandEngine:
Input: 4 skill scores (0–10 each)

overallScore = (listening + reading + writing + speaking) / 4

Band mapping:
  >= 8.0  → C1 (Bậc 5) — nếu không có skill nào < 6.0
  >= 6.0  → B2 (Bậc 4) — standard (mỗi skill >= 4.0)
  >= 4.0  → B1 (Bậc 3)
  >= 2.5  → A2 (Bậc 2)
   < 2.5  → Dưới A2

Điều kiện riêng (VSTEP B2 chuẩn):
  Để được công nhận B2: overall >= 6.0 VÀ mỗi skill >= 4.0
  Nếu 1 skill < 4.0 → chỉ được công nhận B1 dù overall >= 6.0

Score → 0–10 scale:
  Listening: correctAnswers / 35 * 10 (làm tròn 0.5)
  Reading:   correctAnswers / 40 * 10
  Writing:   AI rubric → 0–10 (T1 weight 1/3, T2 weight 2/3)
  Speaking:  AI rubric → 0–10 (P1 weight 20%, P2 40%, P3 40%)
```

### 5.6 VSTEP Writing Grading — Rubric mở rộng

Tái dùng `WritingGradingWorker` với addition cho VSTEP:

```
Task 1 — Letter/Email (LetterWriting):
  Rubric (mỗi tiêu chí 0–10):
    - Task Fulfillment: Có đề cập đủ bullet points không? (40%)
    - Language Range: Từ vựng và ngữ pháp đa dạng (30%)
    - Accuracy: Ít lỗi chính tả, ngữ pháp (30%)
  Word count check: min 120 từ (warning < 120)
  Letter format check: greeting / body / closing / signature

Task 2 — Essay (EssayWritingVSTEP):
  Rubric (0–10):
    - Task Achievement: Có trả lời đúng yêu cầu đề không? (25%)
    - Coherence & Cohesion: Mạch lạc, liên kết (25%)
    - Lexical Resource: Từ vựng phong phú (25%)
    - Grammatical Range & Accuracy: Đa dạng cấu trúc, ít lỗi (25%)
  Word count check: min 250 từ
  Essay type detection: Argumentative / Discussion / Problem-Solution / Cause-Effect
    → LLM dùng rubric phù hợp với từng dạng

VSTEP Writing FinalScore = T1_score/10 * (1/3) + T2_score/10 * (2/3)  (0–10 scale)
```

### 5.7 VSTEP Speaking Grading — Rubric mở rộng

```
Part 1 — Social Interaction (trọng số 20%):
  Rubric (0–10):
    - Fluency & Coherence: Trôi chảy, mạch lạc (30%)
    - Lexical Resource: Từ vựng phù hợp (25%)
    - Grammar Range & Accuracy (25%)
    - Pronunciation (20%)

Part 2 — Solution Discussion (trọng số 40%):
  [Standard rubric như P1]
  + Task Achievement: Có chọn 1 option + argue tốt không? (20% extra weight)
  LLM nhận biết option nào được chọn từ transcript → đánh giá lập luận

Part 3 — Topic Development (trọng số 40%):
  [Standard rubric như P1]
  + Content Development: Có phát triển đủ ý dựa trên bullet points không? (20% extra)
  + Follow-up Response: Trả lời follow-up có liên quan không?

VSTEP Speaking FinalScore = P1*0.2 + P2*0.4 + P3*0.4  (0–10 scale)
```

### 5.8 VSTEP Session Flow

```
VSTEPSession State Machine:

Init → SelectPart(Listening) → [Listening attempt InProgress]
  ↓ Submit Listening → AutoGrade → ListeningScore saved
SelectPart(Reading) → [Reading attempt InProgress]
  ↓ Submit Reading → AutoGrade → ReadingScore saved
SelectPart(Writing) → [Writing attempt InProgress]
  ↓ Submit Writing → Queue AI grading → WritingScore pending
SelectPart(Speaking) → [Speaking attempt InProgress]
  ↓ Submit Speaking → Queue AI grading → SpeakingScore pending
  ↓ All 4 parts submitted → VSTEPSession.IsCompleted = true
  ↓ Wait for AI grading done (Writing + Speaking)
  ↓ VSTEPBandEngine.Calculate(4 scores) → AssignedBand
  ↓ Save VSTEPBandResult → notify student
Completed
```

---

## 6. DATABASE SCHEMA MỞ RỘNG

### 6.0 Phase 3B — Speaking AI + Writing AI (Sprint 6–7)

> Xem SQL đầy đủ tại Section 3.1.3 và 3.1.4.  
> Tóm tắt các bảng mới:

```sql
-- Sprint 6: SpeakingSubmissions (có thêm CoherenceScore, VocabularyScore, TaskAchievementScore, ExamModeTag)
-- Sprint 7: WritingSubmissions (có thêm TaskType, EssayType)
-- Sprint 9–10: RealtimeQuizRooms, RoomParticipants
```

### 6.1 Alterations (Migration bổ sung cho 3.1 — tương thích 3.2 + 3.3)

```sql
-- Bổ sung vào Quizzes
ALTER TABLE "Quizzes"
    ADD COLUMN "ExamMode" VARCHAR(20) NOT NULL DEFAULT 'Standard',
    ADD COLUMN "Language"  VARCHAR(10) NOT NULL DEFAULT 'vi';

-- Bổ sung vào Questions
ALTER TABLE "Questions"
    ADD COLUMN "AudioPlayLimit"       INT,
    ADD COLUMN "SpeakingTimeLimitSec" INT,
    ADD COLUMN "ReferenceText"        TEXT,
    ADD COLUMN "ExamModeTag"          VARCHAR(50);

-- Bổ sung vào QuizAttempts
ALTER TABLE "QuizAttempts"
    ADD COLUMN "ExamMeta" JSONB;

-- Index mới
CREATE INDEX idx_quizzes_exam_mode ON "Quizzes"("ExamMode");
CREATE INDEX idx_questions_exam_tag ON "Questions"("ExamModeTag") WHERE "ExamModeTag" IS NOT NULL;
```

### 6.2 New Tables — OPIC (Phase 3.2)

```sql
-- ══════════════════════════════════════════════════════
-- PHASE 3.2 — OPIC TABLES
-- ══════════════════════════════════════════════════════

CREATE TABLE "OPICTopicSurveys" (
    "Id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "UserId"          UUID NOT NULL,
    "Language"        VARCHAR(10) NOT NULL DEFAULT 'vi',
    "SelectedTopics"  JSONB NOT NULL,         -- ["music","travel",...]
    "TargetLevel"     VARCHAR(10),             -- "IL" | "IM" | "IH"
    "ChosenDifficulty" INT NOT NULL DEFAULT 3, -- 1–6
    "CreatedAt"       TIMESTAMPTZ NOT NULL DEFAULT now(),
    "UpdatedAt"       TIMESTAMPTZ
);

CREATE TABLE "OPICSessions" (
    "Id"                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "UserId"            UUID NOT NULL,
    "SurveyId"          UUID REFERENCES "OPICTopicSurveys"("Id"),
    "Language"          VARCHAR(10) NOT NULL DEFAULT 'vi',
    "SessionState"      VARCHAR(30) NOT NULL DEFAULT 'Orientation',
    "ChosenDifficulty"  INT NOT NULL DEFAULT 3,
    "MidAdjustChoice"   VARCHAR(10),           -- "easier" | "same" | "harder"
    "FinalDifficulty"   INT,
    "OPICLevelResult"   VARCHAR(10),           -- "IM2" | "IH" | ...
    "OverallScore"      DECIMAL(5,2),
    "IsCompleted"       BOOLEAN NOT NULL DEFAULT FALSE,
    "StartedAt"         TIMESTAMPTZ NOT NULL DEFAULT now(),
    "CompletedAt"       TIMESTAMPTZ,
    "CreatedAt"         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "OPICComboGroups" (
    "Id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "SessionId"     UUID NOT NULL REFERENCES "OPICSessions"("Id") ON DELETE CASCADE,
    "ComboIndex"    INT NOT NULL,              -- 1–5
    "TopicCategory" VARCHAR(50) NOT NULL,      -- "music" | "bank" | ...
    "TopicType"     VARCHAR(30) NOT NULL,      -- "survey_topic" | "common_topic" | ...
    "ComboQuestions" JSONB NOT NULL,           -- [questionId1, questionId2, ...]
    "CreatedAt"     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "OPICAttemptRefs" (
    "Id"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "SessionId"    UUID NOT NULL REFERENCES "OPICSessions"("Id") ON DELETE CASCADE,
    "AttemptId"    UUID NOT NULL REFERENCES "QuizAttempts"("Id"),
    "QuestionIndex" INT NOT NULL,             -- 1–15
    "CreatedAt"    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "OPICLevelResults" (
    "Id"                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "UserId"               UUID NOT NULL,
    "SessionId"            UUID NOT NULL REFERENCES "OPICSessions"("Id"),
    "Language"             VARCHAR(10) NOT NULL DEFAULT 'vi',
    "AssignedLevel"        VARCHAR(10) NOT NULL,
    "OverallScore"         DECIMAL(5,2),
    "PronunciationScore"   DECIMAL(5,2),
    "FluencyScore"         DECIMAL(5,2),
    "CoherenceScore"       DECIMAL(5,2),
    "VocabularyScore"      DECIMAL(5,2),
    "TaskAchievementScore" DECIMAL(5,2),
    "LlmLevelJustification" JSONB,
    "StrongestSkill"       VARCHAR(30),
    "WeakestSkill"         VARCHAR(30),
    "ImprovementAdvice"    TEXT,
    "TestedAt"             TIMESTAMPTZ NOT NULL DEFAULT now(),
    "CreatedAt"            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "OPICScriptTemplates" (
    "Id"             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "CreatedBy"      UUID NOT NULL,
    "Language"       VARCHAR(10) NOT NULL DEFAULT 'vi',
    "TopicCategory"  VARCHAR(50) NOT NULL,
    "ComboType"      VARCHAR(30) NOT NULL,    -- "describe" | "routine" | "experience" | ...
    "TargetLevel"    VARCHAR(10),
    "OpeningTemplate" TEXT NOT NULL,
    "BodyTemplate"   TEXT NOT NULL,
    "ClosingTemplate" TEXT NOT NULL,
    "VocabList"      JSONB,
    "UsefulPhrases"  JSONB,
    "IsPublished"    BOOLEAN NOT NULL DEFAULT FALSE,
    "CreatedAt"      TIMESTAMPTZ NOT NULL DEFAULT now(),
    "UpdatedAt"      TIMESTAMPTZ
);

-- OPIC Indexes
CREATE INDEX idx_opic_sessions_user    ON "OPICSessions"("UserId");
CREATE INDEX idx_opic_level_user       ON "OPICLevelResults"("UserId");
CREATE INDEX idx_opic_scripts_topic    ON "OPICScriptTemplates"("TopicCategory", "Language");
```

### 6.3 New Tables — VSTEP (Phase 3.3)

```sql
-- ══════════════════════════════════════════════════════
-- PHASE 3.3 — VSTEP TABLES
-- ══════════════════════════════════════════════════════

CREATE TABLE "PassageGroups" (
    "Id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "QuizId"          UUID NOT NULL REFERENCES "Quizzes"("Id") ON DELETE CASCADE,
    "GroupIndex"      INT NOT NULL,
    "PassageType"     VARCHAR(30) NOT NULL,   -- "reading" | "listening_short" | ...
    "PassageText"     TEXT,                   -- Reading text
    "AudioUrl"        TEXT,                   -- Listening audio
    "AudioPlayLimit"  INT DEFAULT 2,
    "PreListenSeconds" INT DEFAULT 20,
    "QuestionIds"     JSONB NOT NULL,          -- [questionId1, ...]
    "DisplayOrder"    INT NOT NULL DEFAULT 0,
    "CreatedAt"       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "VSTEPSessions" (
    "Id"                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "UserId"             UUID NOT NULL,
    "TargetBand"         VARCHAR(10),          -- "B1" | "B2" | "C1"
    "CurrentPart"        VARCHAR(20) NOT NULL DEFAULT 'Listening',
    "PartState"          JSONB,                -- {listening:"Graded", reading:"InProgress"}
    "ListeningScore"     DECIMAL(4,2),
    "ReadingScore"       DECIMAL(4,2),
    "WritingScore"       DECIMAL(4,2),
    "SpeakingScore"      DECIMAL(4,2),
    "OverallScore"       DECIMAL(4,2),
    "AssignedBand"       VARCHAR(10),          -- "B2" | "C1"
    "AssignedLevel"      INT,                  -- 2–5
    "ListeningAttemptId" UUID REFERENCES "QuizAttempts"("Id"),
    "ReadingAttemptId"   UUID REFERENCES "QuizAttempts"("Id"),
    "WritingAttemptId"   UUID REFERENCES "QuizAttempts"("Id"),
    "SpeakingAttemptId"  UUID REFERENCES "QuizAttempts"("Id"),
    "IsCompleted"        BOOLEAN NOT NULL DEFAULT FALSE,
    "StartedAt"          TIMESTAMPTZ NOT NULL DEFAULT now(),
    "CompletedAt"        TIMESTAMPTZ,
    "CreatedAt"          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "VSTEPBandResults" (
    "Id"               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "UserId"           UUID NOT NULL,
    "SessionId"        UUID NOT NULL REFERENCES "VSTEPSessions"("Id"),
    "AssignedBand"     VARCHAR(10) NOT NULL,
    "AssignedLevel"    INT NOT NULL,
    "ListeningScore"   DECIMAL(4,2) NOT NULL,
    "ReadingScore"     DECIMAL(4,2) NOT NULL,
    "WritingScore"     DECIMAL(4,2) NOT NULL,
    "SpeakingScore"    DECIMAL(4,2) NOT NULL,
    "OverallScore"     DECIMAL(4,2) NOT NULL,
    "SkillBreakdown"   JSONB,
    "RecommendedCourses" JSONB,
    "TestedAt"         TIMESTAMPTZ NOT NULL DEFAULT now(),
    "CreatedAt"        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- VSTEP Indexes
CREATE INDEX idx_vstep_sessions_user    ON "VSTEPSessions"("UserId");
CREATE INDEX idx_vstep_band_user        ON "VSTEPBandResults"("UserId");
CREATE INDEX idx_passage_groups_quiz    ON "PassageGroups"("QuizId");
```

---

## 7. API ENDPOINTS MỞ RỘNG

### 7.1 OPIC Endpoints (Phase 3.2)

```
── OPIC Survey & Setup ──────────────────────────────────────────
POST  /api/v1/opic/survey                  Lưu background survey (topics + target level)
GET   /api/v1/opic/survey/my               Lấy survey hiện tại của tôi
GET   /api/v1/opic/topics                  Danh sách 12 survey topics + 20 common topics

── OPIC Session ─────────────────────────────────────────────────
POST  /api/v1/opic/sessions                Tạo OPICSession mới (sau khi hoàn thành survey)
GET   /api/v1/opic/sessions/{id}           Chi tiết session (state, progress)
POST  /api/v1/opic/sessions/{id}/mid-adjust  Student chọn easier/same/harder sau câu 7
GET   /api/v1/opic/sessions/{id}/next-question  Lấy câu tiếp theo (server chọn theo combo + level)
GET   /api/v1/opic/sessions/my-history     Lịch sử các session đã làm

── OPIC Question Answer (tái dùng AttemptAnswer) ────────────────
POST  /api/v1/attempts/{id}/start          (tái dùng — cho từng câu OPIC)
PUT   /api/v1/attempts/{id}/answer         (tái dùng — save audio URL)
POST  /api/v1/attempts/{id}/submit         (tái dùng — trigger speaking grading)

── OPIC Speaking (tái dùng Speaking API) ────────────────────────
POST  /api/v1/speaking/upload              (tái dùng nguyên xi)
GET   /api/v1/speaking/{id}/status         (tái dùng — SignalR push thay polling)
GET   /api/v1/speaking/{id}/result         (tái dùng)

── OPIC AI Examiner (câu 15) ────────────────────────────────────
POST  /api/v1/opic/examiner/respond        Student hỏi → LLM trả lời text → TTS audio
  Body: { question: string, sessionId: uuid, questionIndex: 15 }
  Response: { answerText: string, audioUrl: string }

── OPIC Results ─────────────────────────────────────────────────
GET   /api/v1/opic/results/my-latest       Kết quả OPIC mới nhất
GET   /api/v1/opic/results/{sessionId}     Chi tiết kết quả theo session
GET   /api/v1/opic/results/history         Lịch sử kết quả (level progression)

── OPIC Teacher ─────────────────────────────────────────────────
GET   /api/v1/teacher/opic/analytics       Phân bổ level, avg score, skill breakdown
GET   /api/v1/teacher/opic/scripts         Danh sách script templates
POST  /api/v1/teacher/opic/scripts         Tạo script template mới
PUT   /api/v1/teacher/opic/scripts/{id}    Cập nhật script template
GET   /api/v1/teacher/opic/students        Kết quả OPIC của từng học viên
POST  /api/v1/teacher/opic/override/{sessionId}  Override OPIC level (manual review)
```

### 7.2 VSTEP Endpoints (Phase 3.3)

```
── VSTEP Session ────────────────────────────────────────────────
POST  /api/v1/vstep/sessions               Tạo VSTEPSession mới
GET   /api/v1/vstep/sessions/{id}          Chi tiết session + scores từng phần
POST  /api/v1/vstep/sessions/{id}/start-part  Bắt đầu 1 trong 4 phần
  Body: { part: "Listening" | "Reading" | "Writing" | "Speaking" }
  Response: { attemptId, questions / passages / tasks }
POST  /api/v1/vstep/sessions/{id}/submit-part  Nộp phần thi
GET   /api/v1/vstep/sessions/my-history    Lịch sử VSTEP sessions

── VSTEP Listening (tái dùng Attempt API + mới cho PassageGroup) ─
GET   /api/v1/vstep/quizzes/{quizId}/passages  Lấy passage groups + câu hỏi của Listening quiz
  Response: [{ passageGroup, audioUrl, playLimit, questions[] }]

── VSTEP Reading (tái dùng Attempt API) ─────────────────────────
GET   /api/v1/vstep/quizzes/{quizId}/passages  (cùng endpoint, passageType = "reading")
  Response: [{ passageGroup, passageText, questions[] }]

── VSTEP Writing (tái dùng Writing AI API) ──────────────────────
POST  /api/v1/writing/submit               (tái dùng — thêm taskType field)
  Body: { essayText, wordCount, taskType: "letter" | "essay", questionId, attemptId }
GET   /api/v1/writing/{id}/status          (tái dùng)
GET   /api/v1/writing/{id}/result          (tái dùng — thêm VSTEP rubric fields)

── VSTEP Speaking (tái dùng Speaking API + mới cho P2/P3) ───────
POST  /api/v1/speaking/upload              (tái dùng)
POST  /api/v1/vstep/speaking/solution-select  Lưu lựa chọn option Part 2
  Body: { attemptAnswerId, selectedOption: "A" | "B" | "C" }

── VSTEP Results ────────────────────────────────────────────────
GET   /api/v1/vstep/results/my-latest      Kết quả VSTEP mới nhất
GET   /api/v1/vstep/results/{sessionId}    Chi tiết kết quả (4 scores + band)
GET   /api/v1/vstep/results/history        Lịch sử kết quả + band progression

── VSTEP Teacher ─────────────────────────────────────────────────
GET   /api/v1/teacher/vstep/analytics      Phân bổ bậc, avg per skill
GET   /api/v1/teacher/vstep/students       Kết quả VSTEP từng học viên
POST  /api/v1/teacher/vstep/override/{sessionId}  Override band/scores
GET   /api/v1/teacher/vstep/passage-groups  Quản lý passage groups
POST  /api/v1/teacher/vstep/passage-groups  Tạo passage group mới
```

---

## 8. BACKEND MODULES MỞ RỘNG

### 8.1 Cấu trúc thư mục đầy đủ

```
MLS.Domain/Entities/
  ── Phase 3A (EXISTING — không đổi) ──────────────────────────────
  Quiz.cs, Question.cs, QuestionOption.cs
  QuizQuestion.cs, QuizAttempt.cs, AttemptAnswer.cs
  PlacementResult.cs

  ── Phase 3B (Sprint 6–7) ─────────────────────────────────────────
  SpeakingSubmission.cs   ← mở rộng thêm CoherenceScore, VocabularyScore, TaskAchievementScore, ExamModeTag
  WritingSubmission.cs    ← mở rộng thêm TaskType, EssayType

  ── Phase 3C (Sprint 9–10) ────────────────────────────────────────
  RealtimeQuizRoom.cs
  RoomParticipant.cs

  ── Phase 3.2 OPIC ────────────────────────────────────────────────
  OPICTopicSurvey.cs
  OPICSession.cs
  OPICComboGroup.cs
  OPICAttemptRef.cs
  OPICLevelResult.cs
  OPICScriptTemplate.cs

  ── Phase 3.3 VSTEP ───────────────────────────────────────────────
  PassageGroup.cs
  VSTEPSession.cs
  VSTEPBandResult.cs

MLS.Application/Quiz/
  Commands/
    ── EXISTING ──────────────────────────────────────────────────
    QuizCommands.cs, QuestionCommands.cs, QuizQuestionCommands.cs
    AttemptCommands.cs, PlacementCommands.cs
    ── Sprint 6 ──────────────────────────────────────────────────
    SpeakingCommands.cs      ← UploadAudio, (Worker) ProcessSpeaking
    ── Sprint 7 ──────────────────────────────────────────────────
    WritingCommands.cs       ← SubmitEssay, (Worker) ProcessWriting
    ── Sprint 9–10 ───────────────────────────────────────────────
    RealtimeCommands.cs      ← CreateRoom, JoinRoom, StartQuiz, NextQuestion
    ── OPIC (Phase 3.2) ──────────────────────────────────────────
    OPICCommands.cs          ← CreateSurvey, CreateSession, MidAdjust, GetNextQuestion, SaveOPICResult
    ── VSTEP (Phase 3.3) ─────────────────────────────────────────
    VSTEPCommands.cs         ← CreateVSTEPSession, StartPart, SubmitPart, SaveVSTEPBandResult

  Queries/
    ── EXISTING ──────────────────────────────────────────────────
    QuizQueries.cs, QuestionQueries.cs, AttemptQueries.cs
    PlacementQueries.cs, AnalyticsQueries.cs
    ── Sprint 6 ──────────────────────────────────────────────────
    SpeakingQueries.cs       ← GetStatus, GetResult
    ── Sprint 7 ──────────────────────────────────────────────────
    WritingQueries.cs        ← GetStatus, GetResult
    ── Sprint 9–10 ───────────────────────────────────────────────
    RealtimeQueries.cs       ← GetRoom, GetLeaderboard
    ── OPIC (Phase 3.2) ──────────────────────────────────────────
    OPICQueries.cs           ← GetSurvey, GetSession, GetNextQuestion, GetLevelResult, GetHistory
    ── VSTEP (Phase 3.3) ─────────────────────────────────────────
    VSTEPQueries.cs          ← GetSession, GetPassages, GetBandResult, GetHistory
    PassageGroupQueries.cs   ← GetPassageGroups, GetPassageDetail

  Services/
    ── EXISTING ──────────────────────────────────────────────────
    AutoGraderService.cs     ← MCQ/Fill/Match + VSTEP Listening/Reading scoring
    PlacementRuleEngine.cs
    ── Sprint 7 ──────────────────────────────────────────────────
    RecommendationService.cs
    ── Sprint 8 ──────────────────────────────────────────────────
    AdaptiveEngine.cs
    ── OPIC (Phase 3.2) ──────────────────────────────────────────
    OPICLevelEngine.cs       ← Aggregate 14 speaking scores → OPIC level band
    OPICComboSelector.cs     ← Chọn questions phù hợp theo survey topics + level
    AIExaminerService.cs     ← LLM + TTS cho OPIC câu 15
    ── VSTEP (Phase 3.3) ─────────────────────────────────────────
    VSTEPBandEngine.cs       ← 4 scores → VSTEP band + level

MLS.Infrastructure/
  Messaging/
    RabbitMqPublisher.cs     ← Sprint 6: baseline
  Workers/
    ── Sprint 6 ──────────────────────────────────────────────────
    SpeakingGradingWorker.cs        ← Mode-aware: Standard/OPIC/VSTEP rubric
    ── Sprint 7 ──────────────────────────────────────────────────
    WritingGradingWorker.cs         ← Mode-aware: Standard/VSTEP Letter/Essay rubric
    AnalyticsWorker.cs              ← AttemptCompleted → cache invalidation
    RecommendationWorker.cs         ← PlacementCompleted → RecommendationService
    ── OPIC (Phase 3.2) ──────────────────────────────────────────
    OPICResultWorker.cs             ← 15 SpeakingSubmissions Done → OPICLevelEngine → OPICLevelResult
    ── VSTEP (Phase 3.3) ─────────────────────────────────────────
    VSTEPSessionWorker.cs           ← Part graded event → update VSTEPSession scores
    VSTEPResultWorker.cs            ← All 4 parts Done → VSTEPBandEngine → VSTEPBandResult
  Hubs/
    QuizHub.cs               ← Sprint 9–10: Realtime + OPIC/VSTEP grading push (see Section 3.1.6)
  Storage/
    ObjectStorageService.cs  ← Sprint 6: MinIO/S3 upload/download

MLS.API/Controllers/
  ── EXISTING ──────────────────────────────────────────────────
  QuizzesController.cs, QuestionsController.cs
  AttemptsController.cs, PlacementController.cs, AnalyticsController.cs
  ── Sprint 6 ──────────────────────────────────────────────────
  SpeakingController.cs
  ── Sprint 7 ──────────────────────────────────────────────────
  WritingController.cs
  ── Sprint 9–10 ───────────────────────────────────────────────
  RealtimeController.cs
  ── OPIC (Phase 3.2) ──────────────────────────────────────────
  OPICController.cs          ← Survey, Session, MidAdjust, Examiner, Results
  TeacherOPICController.cs   ← Analytics, Scripts, Override
  ── VSTEP (Phase 3.3) ─────────────────────────────────────────
  VSTEPController.cs         ← Session, StartPart, SubmitPart, Passages, Results
  TeacherVSTEPController.cs  ← Analytics, Passages, Override
```

### 8.2 OPICLevelEngine logic

```csharp
public class OPICLevelEngine {
    public OPICLevelResult Calculate(
        IEnumerable<SpeakingSubmission> submissions,
        OPICSession session)
    {
        // Aggregate từ 14 submissions (câu 1–14)
        var avg = new {
            Pronunciation = submissions.Average(s => s.PronunciationScore ?? 0),
            Fluency       = submissions.Average(s => s.FluencyScore ?? 0),
            Coherence     = submissions.Average(s => s.CoherenceScore ?? 0),  // từ LLM rubric
            Vocabulary    = submissions.Average(s => s.VocabularyScore ?? 0),
            Task          = submissions.Average(s => s.TaskAchievementScore ?? 0)
        };

        decimal overall = avg.Pronunciation * 0.20m + avg.Fluency * 0.25m
                        + avg.Coherence * 0.25m     + avg.Vocabulary * 0.20m
                        + avg.Task * 0.10m;

        string level = overall switch {
            >= 90 => "AL",
            >= 78 => "IH",
            >= 66 => "IM3",
            >= 54 => "IM2",
            >= 42 => "IM1",
            >= 30 => "IL",
            _     => "NH"
        };

        // Cap theo difficulty level chosen
        if (session.FinalDifficulty <= 2) level = CapLevel(level, "IM2");

        return new OPICLevelResult { AssignedLevel = level, OverallScore = overall, ... };
    }
}
```

### 8.3 VSTEPBandEngine logic

```csharp
public class VSTEPBandEngine {
    public VSTEPBandResult Calculate(VSTEPSession session) {
        decimal overall = (session.ListeningScore + session.ReadingScore
                         + session.WritingScore   + session.SpeakingScore) / 4;

        decimal[] scores = { session.ListeningScore, session.ReadingScore,
                             session.WritingScore, session.SpeakingScore };
        decimal minScore = scores.Min();

        // Band determination with skill floor check
        string band;
        int level;

        if (overall >= 8.0m && minScore >= 6.0m)      { band = "C1"; level = 5; }
        else if (overall >= 6.0m && minScore >= 4.0m)  { band = "B2"; level = 4; }
        else if (overall >= 4.0m && minScore >= 2.5m)  { band = "B1"; level = 3; }
        else if (overall >= 2.5m)                      { band = "A2"; level = 2; }
        else                                           { band = "Below A2"; level = 1; }

        return new VSTEPBandResult {
            AssignedBand = band, AssignedLevel = level, OverallScore = overall, ...
        };
    }
}
```

### 8.4 SpeakingGradingWorker — Mode detection

```csharp
// Existing worker được mở rộng với mode-aware rubric
public class SpeakingGradingWorker {
    public async Task ProcessAsync(SpeakingGradingRequestedEvent evt) {
        var rubric = evt.ExamMode switch {
            ExamMode.Standard => StandardSpeakingRubric.Default,
            ExamMode.OPIC     => OPICSpeakingRubric.ForComboType(evt.ComboType),
            ExamMode.VSTEP    => VSTEPSpeakingRubric.ForPart(evt.SpeakingPart),
            _                 => StandardSpeakingRubric.Default
        };

        // [Standard pipeline: Whisper → Phoneme → Fluency → LLM]
        // Khác nhau: LLM prompt thay đổi theo rubric, thêm extra scores
        var result = await _pipeline.RunAsync(evt.AudioUrl, rubric);
        await UpdateSubmission(result);
    }
}
```

---

## 9. FRONTEND PAGES & COMPONENTS

### 9.1 Shared Components (dùng cho cả 3 mode)

```
src/components/quiz/shared/
  AudioQuestionPlayer.tsx        ← Phát audio câu hỏi, play limit, pre-listen countdown
                                    (Build Sprint 6 cho OPIC → tái dùng VSTEP Listening)
  SpeakingRecorder.tsx           ← Build Sprint 6, props: timeLimitSec?, referenceText?
  EssayEditor.tsx                ← Build Sprint 7, props: minWords, maxWords?, taskType?
  ExamTimer.tsx                  ← Generalizes QuizTimer, hỗ trợ multi-part (VSTEP)
  ResultBandBadge.tsx            ← Standard: "Level 4", OPIC: "IM2", VSTEP: "B2"
  SkillRadarChart.tsx            ← Tái dùng cả 3 mode result pages
  AIFeedbackPanel.tsx            ← Speaking + Writing AI feedback (Sprint 6–7)
  WordCountBadge.tsx             ← Real-time word count + min/max indicator (Sprint 7)
```

### 9.2 Phase 3.1 — Standard Mode (hiện có + Sprint 6–10)

```
src/app/quiz/
  ── EXISTING (Sprint 1–5) ──────────────────────────────────────
  [id]/page.tsx                        ← QuizIntroPage
  [id]/play/page.tsx                   ← QuizPlayerPage (3-col layout)
  [id]/result/[attemptId]/page.tsx     ← QuizResultPage

  ── Sprint 6 ───────────────────────────────────────────────────
  [id]/speaking/page.tsx               ← SpeakingQuizPage (recorder + upload + pending)
  [id]/ai-result/[attemptId]/page.tsx  ← AiFeedbackPage (speaking view)

  ── Sprint 7 ───────────────────────────────────────────────────
  [id]/writing/page.tsx                ← WritingQuizPage (essay editor + word count)
  ── (ai-result page extended with writing view)

  ── Sprint 8 ───────────────────────────────────────────────────
  [id]/adaptive/page.tsx               ← AdaptiveQuizPage (no navigator, dynamic Q)

  ── Sprint 9–10 ────────────────────────────────────────────────
  /realtime/join/page.tsx              ← JoinRoomPage (nhập mã phòng)
  /realtime/[code]/play/page.tsx       ← RealtimePlayerPage (countdown + leaderboard)
  /teacher/realtime/new/page.tsx       ← CreateRealtimeRoomPage
  /teacher/realtime/[id]/host/page.tsx ← RealtimeHostPage (điều khiển + live LB)

src/store/api/
  ── EXISTING ──────────────────────────────────────────────────
  quizApi.ts, questionApi.ts, analyticsApi.ts
  ── Sprint 6 ──────────────────────────────────────────────────
  speakingApi.ts           ← upload, getStatus, getResult
  ── Sprint 7 ──────────────────────────────────────────────────
  writingApi.ts            ← submit, getStatus, getResult
  ── Sprint 9–10 ───────────────────────────────────────────────
  realtimeApi.ts           ← createRoom, joinRoom, getLeaderboard
  ── OPIC (Phase 3.2) ──────────────────────────────────────────
  opicApi.ts, opicExaminerApi.ts
  ── VSTEP (Phase 3.3) ─────────────────────────────────────────
  vstepApi.ts, passageApi.ts
```

### 9.3 Phase 3.2 — OPIC Mode (mới hoàn toàn)

```
src/app/opic/
  page.tsx                              ← OPICHomePage (giới thiệu, bắt đầu)
  survey/page.tsx                       ← BackgroundSurveyPage (chọn topics + level)
  [sessionId]/orientation/page.tsx      ← OrientationPage (self-assess + mic test + sample)
  [sessionId]/play/page.tsx             ← OPICPlayerPage (main test flow)
  [sessionId]/mid-adjust/page.tsx       ← MidAdjustmentPage (sau câu 7)
  [sessionId]/result/page.tsx           ← OPICResultPage (level band + breakdown)
  practice/[topic]/page.tsx             ← TopicPracticePage (luyện từng topic)
  scripts/page.tsx                      ← ScriptLibraryPage (xem script mẫu)
  history/page.tsx                      ← OPICHistoryPage (lịch sử + level progression)

src/app/teacher/opic/
  page.tsx                              ← OPIC Analytics Dashboard
  students/page.tsx                     ← Student Results Table
  scripts/page.tsx                      ← Script Template Manager
  scripts/new/page.tsx                  ← Script Template Builder
  questions/page.tsx                    ← OPIC Question Bank (audio upload + tag)

src/components/opic/
  TopicSurveyGrid.tsx                   ← Grid 32 topics, multi-select
  OPICPlayerLayout.tsx                  ← Layout: Avatar + Question + Recorder
  ComboProgressBar.tsx                  ← "Combo 2/5 — Chủ đề: Du lịch"
  SessionProgressStepper.tsx            ← Câu 1 → ... → 7 → [Mid-Adjust] → 8 → ... → 15
  MidAdjustmentScreen.tsx               ← 3 nút: Dễ hơn / Tương tự / Khó hơn
  AIExaminerChat.tsx                    ← Student hỏi ↔ AI trả lời (Part câu 15)
  OPICLevelBadge.tsx                    ← Badge màu: "IM2", "IH", "AL"
  OPICLevelProgressChart.tsx            ← Biểu đồ level theo thời gian
  ScriptTemplateCard.tsx                ← Hiển thị script: Opening / Body / Closing
  ScriptTemplateEditor.tsx              ← Teacher soạn script
  OPICAvatarPlayer.tsx                  ← Hiện avatar "Mai" + phát audio câu hỏi
```

### 9.4 Phase 3.3 — VSTEP Mode (mới hoàn toàn)

```
src/app/vstep/
  page.tsx                              ← VSTEPHomePage (giới thiệu 4 kỹ năng)
  [sessionId]/page.tsx                  ← VSTEPDashboardPage (4 phần, trạng thái từng phần)
  [sessionId]/listening/page.tsx        ← VSTEPListeningPage
  [sessionId]/reading/page.tsx          ← VSTEPReadingPage
  [sessionId]/writing/page.tsx          ← VSTEPWritingPage
  [sessionId]/speaking/page.tsx         ← VSTEPSpeakingPage
  [sessionId]/result/page.tsx           ← VSTEPResultPage (4 scores + band + recommendations)
  practice/listening/page.tsx           ← Luyện Listening riêng
  practice/reading/page.tsx             ← Luyện Reading riêng
  practice/writing/page.tsx             ← Luyện Writing riêng
  practice/speaking/page.tsx            ← Luyện Speaking riêng
  history/page.tsx                      ← VSTEPHistoryPage (band progression)

src/app/teacher/vstep/
  page.tsx                              ← VSTEP Analytics Dashboard
  students/page.tsx                     ← Student Band Results
  passages/page.tsx                     ← Passage Group Manager
  passages/new/page.tsx                 ← Passage Builder (text + audio upload + link questions)

src/components/vstep/
  VSTEPSessionCard.tsx                  ← 4-part status overview (timer per part)
  ListeningPassagePlayer.tsx            ← Audio player + MCQ columns, play limit
  ReadingPassageLayout.tsx              ← Split view: passage left + questions right
  WritingTaskLayout.tsx                 ← Task prompt + writing area (T1/T2 switch)
  LetterFormatGuide.tsx                 ← Khung format thư: greeting/body/closing
  EssayTypeTag.tsx                      ← Badge: "Argumentative" | "Discussion" | ...
  SpeakingPart1Layout.tsx               ← Chọn 1 trong 2 topic groups → ghi âm
  SolutionDiscussionLayout.tsx          ← 3 option cards → chọn 1 → ghi âm
  TopicDevelopmentLayout.tsx            ← Topic + bullet points → prep 1 phút → ghi âm → follow-ups
  VSTEPBandBadge.tsx                    ← Badge: "B2" | "C1" với màu
  VSTEPScoreCard.tsx                    ← 4 skill scores + overall + band
  PartTimerBar.tsx                      ← Progress bar thời gian từng phần (40/60/60/12 phút)
  PassageGroupEditor.tsx                ← Teacher tạo/sửa passage group
```

### 9.5 RTK Query API Slices — Tổng hợp

```
src/store/api/
  ── Phase 3A (EXISTING) ─────────────────────────────────────────
  quizApi.ts            ← Quiz CRUD + attempt + start/submit
  questionApi.ts        ← Question bank CRUD + bulk import
  analyticsApi.ts       ← Analytics endpoints

  ── Phase 3B Sprint 6 ────────────────────────────────────────────
  speakingApi.ts        ← upload, getStatus, getResult

  ── Phase 3B Sprint 7 ────────────────────────────────────────────
  writingApi.ts         ← submit, getStatus, getResult

  ── Phase 3C Sprint 9–10 ─────────────────────────────────────────
  realtimeApi.ts        ← createRoom, joinRoom, getLeaderboard (REST fallback)

  ── Phase 3.2 OPIC ───────────────────────────────────────────────
  opicApi.ts            ← Survey, Session, MidAdjust, NextQuestion, LevelResult, History
  opicExaminerApi.ts    ← AI Examiner (POST examiner/respond)

  ── Phase 3.3 VSTEP ──────────────────────────────────────────────
  vstepApi.ts           ← VSTEPSession, StartPart, SubmitPart, Passages, BandResult, History
  passageApi.ts         ← PassageGroup CRUD (teacher)
```

---

## 10. LUỒNG NGHIỆP VỤ CHI TIẾT

### 10.1 OPIC — Luồng thi đầy đủ

```
1. ORIENTATION
   /opic → Giới thiệu OPIC
   /opic/survey → Background Survey:
     Student chọn ≥12 topics (âm nhạc, du lịch, nhà hàng, ...)
     Student chọn target level + ChosenDifficulty (1–6)
     POST /api/v1/opic/survey → lưu OPICTopicSurvey
   
   POST /api/v1/opic/sessions → tạo OPICSession
   /opic/{sessionId}/orientation:
     Self Assessment (chọn lại level nếu muốn)
     Mic test + playback test
     Sample question (không tính điểm)
   
2. SESSION 1 (câu 1–7)
   Server: OPICComboSelector chọn questions phù hợp với survey + level
   
   Câu 1: Giới thiệu bản thân
     → hiện OPICAvatarPlayer (phát audio "Ava": "Xin hãy giới thiệu bản thân bạn")
     → Student nhấn Record → SpeakingRecorder
     → Stop → Upload → SpeakingSubmission (GradingStatus=Pending)
     → Chuyển câu 2

   Câu 2–4 (Combo 1 — topic 1):
     Mỗi câu: audio question → record → upload
     ComboProgressBar: "Combo 1 — Âm nhạc (câu 2/3)"
   
   Câu 5–7 (Combo 2 — topic 2):
     Tương tự Combo 1

   ──── SAU CÂU 7: MID-ADJUST SCREEN ────
   /opic/{sessionId}/mid-adjust:
     Hiện 3 nút: [Câu hỏi dễ hơn] [Tương tự] [Câu hỏi khó hơn]
     POST /api/v1/opic/sessions/{id}/mid-adjust
     → cập nhật OPICSession.MidAdjustChoice + FinalDifficulty

3. SESSION 2 (câu 8–15)
   Câu 8–10 (Combo 3 — chủ đề chung 1):
     Server: chọn common topic chưa dùng
     
   Câu 11–13 (Combo 4 — Role-play):
     Câu 11: QuestionType=OPICRolePlay → nghe tình huống → record response
     Câu 12: Tình huống có vấn đề → giải thích + giải pháp
     Câu 13: Kể kinh nghiệm liên quan
   
   Câu 14–15 (Combo 5 — topic 3 từ survey):
     Câu 14: Miêu tả hoặc so sánh (level 5–6)
     Câu 15 (level 3–4): QuestionType=OPICQuestionAsking
       → AIExaminerChat: student hỏi 3–4 câu, AI trả lời
     Câu 15 (level 5–6): Issue/Opinion question

4. KẾT QUẢ
   Tất cả 15 SpeakingSubmission Done
   OPICResultWorker:
     Aggregate scores → OPICLevelEngine.Calculate()
     Lưu OPICLevelResult
     SignalR push: "OPICResultReady"
   
   /opic/{sessionId}/result:
     OPICLevelBadge lớn: "IM2"
     5 skill bars: Pronunciation / Fluency / Coherence / Vocabulary / Task
     AI Justification: "Tại sao bạn đạt IM2..."
     Improvement tips: markdown
     "Luyện thêm" → practice topics yếu
```

### 10.2 VSTEP — Luồng thi đầy đủ

```
1. KHỞI TẠO
   /vstep → Giới thiệu VSTEP (4 kỹ năng, thời gian, band)
   POST /api/v1/vstep/sessions → tạo VSTEPSession
   /vstep/{sessionId} → VSTEPDashboard:
     4 card kỹ năng: [Listening 40'] [Reading 60'] [Writing 60'] [Speaking 12']
     Có thể làm theo thứ tự bất kỳ (luyện thi) hoặc buộc thứ tự (thi thật)

2. LISTENING (40 phút)
   POST /api/v1/vstep/sessions/{id}/start-part { part: "Listening" }
   GET  /api/v1/vstep/quizzes/{quizId}/passages
     → 3 passage groups (short/dialogue/lecture)

   ListeningPassagePlayer:
     Part 1 (8 câu): 8 short clips × 1 câu — PreListenSeconds=20, PlayLimit=2
     Part 2 (12 câu): 3 dialogues × 4 câu — PreListenSeconds=20, PlayLimit=2
     Part 3 (15 câu): 3 lectures × 5 câu — PreListenSeconds=20, PlayLimit=2
   
   Auto-save answers (30s)
   Timer: 40 phút, auto-submit khi hết giờ
   POST /api/v1/vstep/sessions/{id}/submit-part { part: "Listening" }
     → AutoGrader → ListeningScore = correct/35 * 10

3. READING (60 phút)
   ReadingPassageLayout: Split view
     4 passages × 10 câu MCQ
   Timer: 60 phút
   Grading: ReadingScore = correct/40 * 10

4. WRITING (60 phút)
   VSTEPWritingPage:
     Tab 1 — Task 1 (20 phút):
       Hiện: tình huống + 3 bullet points + LetterFormatGuide
       EssayEditor (min 120 words, word counter)
       Letter formal/informal toggle
     Tab 2 — Task 2 (40 phút):
       Hiện: đề bài + essay type hint
       EssayEditor (min 250 words, word counter)
       EssayTypeTag indicator
   
   Submit → POST /api/v1/writing/submit (Task 1 + Task 2 riêng biệt)
     → WritingGradingWorker VSTEP mode
     → SignalR push khi Done

5. SPEAKING (12 phút)
   VSTEPSpeakingPage — 3 parts tuần tự:
   
   Part 1 — Social Interaction (2 phút, no prep):
     2 topic groups hiện ra: "Hobbies" hoặc "Family & Friends"
     Student chọn 1 group → thấy 3 câu hỏi
     Record 1 audio bao gồm cả 3 câu (2 phút max)
   
   Part 2 — Solution Discussion (5 phút, 1 phút prep):
     SolutionDiscussionLayout:
       Đọc scenario text + 3 option cards (A/B/C)
       1 phút chuẩn bị (timer)
       Student chọn option → Record (5 phút max)
       POST /api/v1/vstep/speaking/solution-select
   
   Part 3 — Topic Development (5 phút, 1 phút prep):
     TopicDevelopmentLayout:
       Topic statement + 2–3 bullet point gợi ý
       1 phút chuẩn bị
       Record (5 phút max)
       [nếu muốn thêm follow-up: hiện 1–2 câu hỏi → record tiếp]
   
   Submit → SpeakingGradingWorker VSTEP mode
     → SignalR push khi Done

6. KẾT QUẢ
   Khi cả 4 phần Done:
   VSTEPResultWorker:
     VSTEPBandEngine.Calculate(4 scores)
     Lưu VSTEPBandResult
     SignalR push: "VSTEPResultReady"
   
   /vstep/{sessionId}/result:
     VSTEPBandBadge lớn: "B2"
     VSTEPScoreCard: Listening 7.5 / Reading 8.0 / Writing 6.5 / Speaking 7.0 / Overall 7.25
     Skill breakdown radar chart
     "Để đạt C1, cần cải thiện Writing (hiện 6.5, cần ≥8.0)"
     Recommended courses theo skill yếu
```

---

## 11. EVENT-DRIVEN MỞ RỘNG

### 11.1 OPIC Events (Phase 3.2)

```
Exchange: quiz.events (topic type) — tái dùng

New Routing:
  opic.speaking.grading.requested → q.opic.speaking → OPICSpeakingGradingWorker
    Payload: { submissionId, userId, audioUrl, sessionId, questionIndex,
               comboType, targetLevel, referenceText }

  opic.question.answered          → q.opic.session → OPICSessionWorker
    Payload: { sessionId, questionIndex, submissionId }
    Action: Nếu questionIndex == 15 → trigger aggregate result

  opic.all.answered               → q.opic.result → OPICResultWorker
    Payload: { sessionId, userId }
    Action: aggregate 15 SpeakingSubmissions → OPICLevelEngine → save OPICLevelResult → notify SignalR

  opic.result.ready               → SignalR push to user
    Payload: { sessionId, assignedLevel, overallScore }
```

### 11.2 VSTEP Events (Phase 3.3)

```
New Routing:
  vstep.speaking.grading.requested → q.vstep.speaking → VSTEPSpeakingGradingWorker
    Payload: { submissionId, userId, audioUrl, sessionId, speakingPart: "P1"|"P2"|"P3",
               selectedOption (P2 only), bulletPoints (P3 only) }

  vstep.writing.grading.requested  → q.vstep.writing → VSTEPWritingGradingWorker
    Payload: { submissionId, userId, essayText, wordCount, taskType: "letter"|"essay",
               bulletPoints (T1), essayType (T2), sessionId }

  vstep.part.graded               → q.vstep.session → VSTEPSessionWorker
    Payload: { sessionId, part, score }
    Action: update VSTEPSession part score, nếu tất cả 4 parts graded → trigger band calc

  vstep.all.graded                → q.vstep.result → VSTEPResultWorker
    Payload: { sessionId, userId }
    Action: VSTEPBandEngine → save VSTEPBandResult → notify SignalR

  vstep.result.ready              → SignalR push to user
    Payload: { sessionId, assignedBand, overallScore, 4 skill scores }
```

### 11.3 SignalR Hub mở rộng

```csharp
// Thêm vào QuizHub.cs (tái dùng hub hiện tại)
public interface IQuizHubClient {
    // [EXISTING]
    Task RoomStateChanged(RoomStateChangedDto dto);
    Task QuestionStarted(QuestionStartedDto dto);
    // ...

    // [NEW — OPIC]
    Task OPICGradingProgress(OPICGradingProgressDto dto);
    // Payload: { sessionId, questionIndex, status: "Grading"|"Done", partialScore? }
    Task OPICResultReady(OPICResultReadyDto dto);
    // Payload: { sessionId, assignedLevel, overallScore }

    // [NEW — VSTEP]
    Task VSTEPPartGraded(VSTEPPartGradedDto dto);
    // Payload: { sessionId, part, score }
    Task VSTEPResultReady(VSTEPResultReadyDto dto);
    // Payload: { sessionId, assignedBand, scores: {listening, reading, writing, speaking} }
}
```

---

## 12. ROADMAP & SPRINT PLAN

### 12.1 Phase 3.1 Còn lại — Sprint 6–10

> Chi tiết thiết kế từng sprint xem tại: Sections 3.1.3 → 3.1.6

```
Sprint 6  — Speaking AI (3.1 Standard):
  ✦ SpeakingSubmission entity + DB migration
  ✦ SpeakingGradingWorker (mode-aware pipeline)
  ✦ RabbitMQ baseline (quiz.events exchange + q.speaking.grading)
  ✦ MinIO/S3 ObjectStorageService
  ✦ SpeakingController + API endpoints
  ✦ SpeakingRecorder.tsx + /quiz/[id]/speaking/page.tsx
  ✦ /quiz/[id]/ai-result/[attemptId]/page.tsx (speaking view)
  ✦ SignalR Hub baseline (QuizHub.cs — AiGradingProgress event)
  Effort: 5–6 ngày

Sprint 7  — Writing AI + Recommendation:
  ✦ WritingSubmission entity + DB migration
  ✦ WritingGradingWorker (mode-aware: standard / letter / essay_vstep)
  ✦ WritingController + API endpoints
  ✦ RecommendationService + RecommendationWorker
  ✦ EssayEditor.tsx + /quiz/[id]/writing/page.tsx
  ✦ AiFeedbackPage writing view
  Effort: 4–5 ngày

Sprint 8  — Adaptive Quiz:
  ✦ AdaptiveEngine.cs (next question selection + scoring)
  ✦ SaveAnswer handler extension (returns nextQuestionId)
  ✦ Adaptive state persistence to AntiCheatLog
  ✦ /quiz/[id]/adaptive/page.tsx
  Effort: 3–4 ngày

Sprint 9–10 — Realtime Quiz:
  ✦ RealtimeQuizRoom + RoomParticipant entities + DB migration
  ✦ QuizHub.cs SignalR (full interface — includes OPIC/VSTEP grading events)
  ✦ Redis integration (leaderboard ZSET + room state)
  ✦ RealtimeController API
  ✦ /realtime/join + /realtime/[code]/play pages
  ✦ /teacher/realtime/new + /teacher/realtime/[id]/host pages
  ✦ Leaderboard.tsx, CountdownOverlay.tsx, LiveAnswerFeed.tsx
  Effort: 5–6 ngày

─────────── PHASE 3.1 SHIPPED (~17–21 ngày, Sprint 6–10) ───────────
```

### 12.2 Phase 3.2 — OPIC (mới)

```
──────────────── PHASE 3.2 OPIC ────────────────

Sprint O1 — Foundation (5–6 ngày):
  ✦ Migration: Thêm ExamMode, Language, AudioPlayLimit, ExamMeta vào existing tables
  ✦ Entities: OPICTopicSurvey, OPICSession, OPICComboGroup, OPICAttemptRef, OPICLevelResult
  ✦ OPICScriptTemplate entity
  ✦ EF Config + Migration SQL

Sprint O2 — Backend OPIC Core (5–6 ngày):
  ✦ OPICCommands: CreateSurvey, CreateSession, GetNextQuestion, MidAdjust
  ✦ OPICLevelEngine.cs — aggregate scores → level mapping
  ✦ OPICComboSelector.cs — chọn questions theo survey topics + level
  ✦ OPICController: survey, session, next-question, mid-adjust endpoints

Sprint O3 — OPIC Speaking Pipeline (4–5 ngày):
  ✦ Mở rộng SpeakingGradingWorker: thêm OPIC rubric (coherence, task achievement)
  ✦ OPICSpeakingGradingWorker: consumer xử lý OPIC-specific
  ✦ OPICResultWorker: aggregate + OPICLevelEngine → OPICLevelResult
  ✦ RabbitMQ routing mới cho OPIC events
  ✦ OPICLevelResult API endpoints
  ✦ SignalR: OPICGradingProgress + OPICResultReady events

Sprint O4 — OPIC Student Frontend (6–7 ngày):
  ✦ AudioQuestionPlayer.tsx — shared audio player component
  ✦ OPICAvatarPlayer.tsx — avatar + audio question display
  ✦ TopicSurveyGrid.tsx — background survey UI
  ✦ /opic/survey/page.tsx — Background Survey Page
  ✦ /opic/{id}/orientation/page.tsx — Orientation Page
  ✦ OPICPlayerLayout.tsx — main test layout
  ✦ ComboProgressBar.tsx + SessionProgressStepper.tsx
  ✦ MidAdjustmentScreen.tsx — câu 7 → câu 8 transition
  ✦ /opic/{id}/play/page.tsx — OPICPlayerPage (full 15 câu flow)
  ✦ /opic/{id}/result/page.tsx — OPICResultPage (level badge + breakdown)
  ✦ opicApi.ts RTK Query slice

Sprint O5 — AI Examiner + Script Tools (4–5 ngày):
  ✦ AIExaminerService.cs — LLM + TTS integration
  ✦ OPICController: /examiner/respond endpoint
  ✦ AIExaminerChat.tsx — frontend interaction component
  ✦ /opic/scripts/page.tsx — ScriptLibraryPage
  ✦ ScriptTemplateCard.tsx + ScriptTemplateEditor.tsx
  ✦ Teacher OPIC: Question bank upload, script management

Sprint O6 — OPIC Teacher Analytics (3–4 ngày):
  ✦ /teacher/opic/page.tsx — Analytics Dashboard
  ✦ /teacher/opic/students/page.tsx — Student Results
  ✦ /teacher/opic/scripts/page.tsx — Script Manager
  ✦ OPICLevelProgressChart.tsx — level progression over time
  ✦ Manual override endpoint + UI

──────── OPIC SHIPPED (28–33 ngày công) ────────
```

### 12.3 Phase 3.3 — VSTEP (mới, sau OPIC)

```
──────────────── PHASE 3.3 VSTEP ────────────────

Sprint V1 — VSTEP Foundation (4–5 ngày):
  ✦ Entities: PassageGroup, VSTEPSession, VSTEPBandResult
  ✦ EF Config + Migration SQL
  ✦ Thêm QuestionType: AudioListeningMCQ, SolutionDiscussion, TopicDevelopment,
                       LetterWriting, EssayWritingVSTEP
  ✦ VSTEPBandEngine.cs — 4 scores → band mapping

Sprint V2 — VSTEP Backend (5–6 ngày):
  ✦ VSTEPCommands: CreateSession, StartPart, SubmitPart
  ✦ PassageGroup CRUD + queries
  ✦ VSTEPController: session endpoints + passage endpoints
  ✦ AutoGrader mở rộng: score Listening (correct/35*10) + Reading (correct/40*10)

Sprint V3 — VSTEP Writing Pipeline (4–5 ngày):
  ✦ Mở rộng WritingGradingWorker: LetterWriting rubric + EssayWritingVSTEP rubric
  ✦ VSTEPWritingGradingWorker: VSTEP-specific scoring (T1/T2 weights)
  ✦ Word count enforcement + task bullet coverage check
  ✦ VSTEP Writing API + queues

Sprint V4 — VSTEP Speaking Pipeline (4–5 ngày):
  ✦ Mở rộng SpeakingGradingWorker: VSTEP rubric (P1/P2/P3 weights)
  ✦ VSTEPSpeakingGradingWorker: P2 solution evaluation + P3 topic development
  ✦ VSTEPSessionWorker: collect 4 part scores → trigger band calc
  ✦ VSTEPResultWorker: VSTEPBandEngine → VSTEPBandResult → SignalR
  ✦ SignalR: VSTEPPartGraded + VSTEPResultReady events

Sprint V5 — VSTEP Listening + Reading Frontend (5–6 ngày):
  ✦ AudioQuestionPlayer.tsx (tái dùng từ OPIC — đã có)
  ✦ ListeningPassagePlayer.tsx — audio + MCQ layout
  ✦ ReadingPassageLayout.tsx — split view passage + questions
  ✦ /vstep/{id}/listening/page.tsx
  ✦ /vstep/{id}/reading/page.tsx
  ✦ PartTimerBar.tsx — progress bar thời gian

Sprint V6 — VSTEP Writing Frontend (4–5 ngày):
  ✦ VSTEPWritingPage.tsx — Task 1 + Task 2 tabs
  ✦ LetterFormatGuide.tsx — template guide cho formal/informal
  ✦ EssayTypeTag.tsx + word count enforcement UI
  ✦ /vstep/{id}/writing/page.tsx

Sprint V7 — VSTEP Speaking Frontend (5–6 ngày):
  ✦ SpeakingPart1Layout.tsx — 2 topic groups + ghi âm
  ✦ SolutionDiscussionLayout.tsx — 3 option cards + argue
  ✦ TopicDevelopmentLayout.tsx — bullet points + prep timer + record + follow-up
  ✦ /vstep/{id}/speaking/page.tsx

Sprint V8 — VSTEP Result + Teacher (4–5 ngày):
  ✦ VSTEPScoreCard.tsx + VSTEPBandBadge.tsx
  ✦ /vstep/{id}/result/page.tsx — VSTEPResultPage
  ✦ VSTEPSessionCard.tsx — /vstep/{id}/page.tsx dashboard
  ✦ /vstep/history/page.tsx — band progression chart
  ✦ Teacher VSTEP analytics + passage group manager
  ✦ vstepApi.ts + passageApi.ts RTK Query slices

──────── VSTEP SHIPPED (35–43 ngày công) ────────
```

### 12.4 Timeline tổng thể

```
Hiện tại: Phase 3.1 Sprint 1–5 DONE
                 ↓
Tuần 5–7:  Sprint 6–7 (3.1 Speaking AI + Writing AI)
Tuần 8:    Sprint 8 (3.1 Adaptive)
Tuần 9–10: Sprint 9–10 (3.1 Realtime)
───────── PHASE 3.1 SHIPPED ─────────

Tuần 11–13: Sprint O1–O3 (OPIC Foundation + Backend + Speaking)
Tuần 14–16: Sprint O4–O5 (OPIC Frontend + AI Examiner)
Tuần 17:    Sprint O6 (OPIC Teacher Tools)
───────── PHASE 3.2 OPIC SHIPPED ─────────

Tuần 18–19: Sprint V1–V2 (VSTEP Foundation + Backend)
Tuần 20–21: Sprint V3–V4 (VSTEP Writing + Speaking Pipeline)
Tuần 22–24: Sprint V5–V7 (VSTEP Frontend 3 phần đầu)
Tuần 25:    Sprint V8 (VSTEP Result + Teacher)
───────── PHASE 3.3 VSTEP SHIPPED ─────────
```

### 12.5 Effort Summary

| Phase | Sprints | Effort | Ghi chú |
|-------|---------|--------|---------|
| 3.1 Còn lại | Sprint 6–10 | ~20–25 ngày | Đã có design, chỉ implement |
| **3.2 OPIC** | Sprint O1–O6 | **~28–33 ngày** | Tái dùng Speaking pipeline ~40% |
| **3.3 VSTEP** | Sprint V1–V8 | **~35–43 ngày** | Tái dùng Speaking + Writing pipeline ~50% |
| **Tổng 3.2+3.3** | 14 sprints | **~63–76 ngày** | Nếu song song giảm được 30% |

### 12.6 Reuse Matrix — Components tái dùng từ 3.1 → 3.2 → 3.3

| Component | 3.1 | → 3.2 OPIC | → 3.3 VSTEP | % Reuse |
|-----------|-----|------------|-------------|---------|
| SpeakingRecorder.tsx | ✅ | Tái dùng (+ timeLimitSec) | Tái dùng | 80% |
| SpeakingGradingWorker | Sprint 6 | Extend với OPIC rubric | Extend với VSTEP rubric | 70% |
| WritingGradingWorker | Sprint 7 | Không dùng | Extend với Letter/Essay rubric | 60% |
| EssayEditor.tsx | Sprint 7 | Không dùng | Tái dùng (+ minWords, taskType) | 75% |
| QuizTimer/ExamTimer | ✅ | Tái dùng | Tái dùng (multi-part) | 90% |
| AntiCheatMonitor | ✅ | Tái dùng | Tái dùng | 100% |
| ResultSummary → ResultBandBadge | ✅ | Mở rộng | Mở rộng | 60% |
| SkillRadarChart | ✅ | Tái dùng | Tái dùng | 100% |
| AutoGraderService | ✅ | Tái dùng cho survey MCQ | Tái dùng cho Listening + Reading | 100% |
| AttemptAnswer entity | ✅ | Tái dùng | Tái dùng | 100% |
| QuizAttempt entity | ✅ | Tái dùng + ExamMeta | Tái dùng + ExamMeta | 95% |
| SpeakingSubmission entity | Sprint 6 | Tái dùng | Tái dùng | 100% |
| WritingSubmission entity | Sprint 7 | Không dùng | Tái dùng | 100% |
| RecommendationService | Sprint 7 | Tái dùng | Tái dùng | 100% |
| RabbitMQ infrastructure | Sprint 6 | Tái dùng (+ OPIC queues) | Tái dùng (+ VSTEP queues) | 80% |
| SignalR Hub | Sprint 6 | Extend (+ OPIC events) | Extend (+ VSTEP events) | 85% |

---

> **Nguyên tắc cuối:** Khi implement 3.2 OPIC, luôn build components có thể tái sử dụng cho 3.3 VSTEP.  
> Ví dụ: `AudioQuestionPlayer` build cho OPIC → dùng lại cho VSTEP Listening.  
> `SpeakingGradingWorker` mode-aware pattern → OPIC rubric trước → VSTEP rubric sau.
---

## 13. IMPLEMENTATION STATUS — Phase 3.2 OPIC (updated: 2026-05-24)

### ✅ Backend — Hoàn thành

| Layer | File | Status |
|-------|------|--------|
| Domain | MLS.Domain/Entities/OPICEntities.cs | ✅ 6 entities (OPICTopicSurvey, OPICSession, OPICComboGroup, OPICAttemptRef, OPICLevelResult, OPICScriptTemplate) |
| Domain | MLS.Domain/Entities/Question.cs | ✅ QuestionType enum + AudioPlayLimit field |
| Domain | MLS.Domain/Entities/Quiz.cs | ✅ QuizType enum (OPICMockTest, OPICMiniTest) |
| Domain | MLS.Domain/Entities/QuizAttempt.cs | ✅ ExamMeta JSONB field |
| Infrastructure | OPICConfigurations.cs | ✅ EF Core configurations cho 6 OPIC tables |
| Infrastructure | QuizConfigurations.cs | ✅ AudioPlayLimit + ExamMeta configs |
| Infrastructure | ApplicationDbContext.cs | ✅ 6 OPIC DbSets |
| Application | IApplicationDbContext.cs | ✅ 6 OPIC DbSet interfaces |
| Application | OPIC/Services/OPICLevelEngine.cs | ✅ NH→AL scoring với weights + difficulty cap |
| Application | OPIC/Commands/OPICCommands.cs | ✅ SaveSurvey, CreateSession, MidAdjust, RecordAttemptRef, FinalizeSession, CreateScriptTemplate |
| Application | OPIC/Queries/OPICQueries.cs | ✅ GetMySurvey, GetSession, ListMySessions, GetMyLatestResult, GetSessionResult, GetScriptTemplates |
| API | Controllers/OPICController.cs | ✅ 13 endpoints |

### ✅ Database

| File | Status |
|------|--------|
| deploy/opic-migration.sql | ✅ Applied — 6 bảng mới, 2 ALTER TABLE |

### ✅ Frontend — Hoàn thành

| Layer | File | Status |
|-------|------|--------|
| RTK Query | src/lib/features/quiz/opicApi.ts | ✅ Full API slice với 12 endpoints |
| Store | src/lib/store.ts | ✅ opicApi đã register |
| Component | src/components/opic/AudioQuestionPlayer.tsx | ✅ Play limit tracking, progress bar |
| Component | src/components/opic/MidAdjustScreen.tsx | ✅ easier/same/harder selection |
| Page | src/app/opic/survey/page.tsx | ✅ Topic selection + difficulty + target level |
| Page | src/app/opic/[sessionId]/play/page.tsx | ✅ 15-question flow + recording + mid-adjust |
| Page | src/app/opic/[sessionId]/result/page.tsx | ✅ Level badge + skill bars + advice |
| Page | src/app/opic/history/page.tsx | ✅ Session history list |

### 🔜 Còn lại (Phase 3.2)

- [ ] Audio câu hỏi thực (tích hợp với QuizAttempt Speaking flow cho OPIC questions)
- [ ] Upload recording → SpeakingSubmission.AudioUrl
- [ ] AI grading webhook / worker cập nhật SpeakingSubmission
- [ ] ComboGroup generation khi CreateSession (random topic picker)
- [ ] OPIC Teacher dashboard — xem kết quả học sinh

### 🔜 Phase 3.3 VSTEP — Chưa bắt đầu

---

## 14. TEACHER PORTAL & QUIZ CONFIG UI — PHƯƠNG ÁN KIẾN TRÚC

> **Mục đích:** Trả lời 2 câu hỏi thiết kế được đặt ra sau khi hoàn thành Sprint 3.2 OPIC student flow:
> 1. Các trang cấu hình quiz (tạo mới, quản lý câu hỏi, settings) — phần nào dùng chung được cho 3 loại quiz, phần nào phải tách riêng?
> 2. Do giáo viên cũng có quyền vào trang quản trị để tạo khóa học, có nên đưa Teacher Portal vào Admin không?

---

### 14.1 Hiện trạng — Teacher Portal

```
frontend/src/app/teacher/
  layout.tsx                       ← Sidebar 3 items; cho phép cả Teacher VÀ Admin role
  quizzes/
    page.tsx                       ← Danh sách quiz — ĐÃ hoạt động với OPICMockTest ✅
    new/page.tsx                   ← Tạo quiz mới (form chung)
    [id]/page.tsx                  ← Sửa quiz (form chung)
    [id]/analytics/page.tsx        ← Thống kê quiz
  questions/page.tsx               ← Ngân hàng câu hỏi
  placement/page.tsx               ← Kiểm tra xếp lớp
  realtime/
    new/page.tsx                   ← Tạo phòng realtime
    [id]/host/page.tsx             ← Điều khiển phòng

frontend/src/app/admin/            ← 26+ trang: courses, lessons, users, books,
                                     orders, vouchers, analytics, settings, ...
```

**Quan sát:**
- Teacher layout đã cho phép `Teacher || Admin` role → teachers có thể vào cả 2 portal
- Teacher tạo khóa học qua `/admin/courses` — phải đi sang portal admin
- `/teacher/quizzes` đã list được OPICMockTest (quizType filter) — không cần build lại danh sách
- Chưa có bất kỳ trang nào xử lý config đặc thù OPIC (wizard 5 bước, combo, audio upload)
- Chưa có bất kỳ trang nào xử lý config đặc thù VSTEP (4-part structure, passage groups)

---

### 14.2 Câu hỏi 1 — Quiz Config: Dùng chung vs Tách riêng

#### 14.2.1 Phần DÙng CHUNG (hiện đã có hoặc cần build 1 lần)

| Component / Page | Mô tả | Tái sử dụng |
|-----------------|-------|------------|
| `/teacher/quizzes` (list) | Danh sách + filter theo quizType, status | ✅ Đã có, hoạt động với tất cả loại |
| `/teacher/quizzes/[id]` — tab "Cơ bản" | Title, Description, Language, Duration, TotalScore, PassingScore, Status | ✅ Giống nhau cho mọi loại |
| `/teacher/quizzes/[id]` — tab "Câu hỏi" | Add/Remove/Reorder câu hỏi, set weight | ✅ Cùng `Questions` table, filter QuestionType theo mode |
| `/teacher/quizzes/[id]` — tab "Thống kê" | Attempt count, avg score, pass rate, thời gian | ✅ Same shell, dữ liệu từ cùng QuizAttempts |
| `/teacher/quizzes/[id]` — tab "Xem trước" | Preview quiz như student thấy | ✅ Dùng chung QuizIntroPage |
| `/teacher/questions` | Question bank CRUD | ✅ Cùng Questions table; filter tag |
| Lifecycle controls | Publish / Archive / Delete | ✅ Cùng API |
| `QuizStatusBadge`, `QuizTypeTag` | Badges hiển thị | ✅ Reuse hiện có |

#### 14.2.2 Phần PHẢI TÁCH RIÊNG — Theo từng loại quiz

##### A. OPICMockTest — Tab "Cài đặt OPIC" trong quiz editor

> Render khi `quizType === "OPICMockTest" || "OPICMiniTest"`

```
Tab "Cài đặt OPIC":
  ┌─ Ngôn ngữ thi: [Tiếng Anh ▼] [Tiếng Hàn] [Tiếng Nhật]
  ├─ Số combo: 5 (cố định cho MockTest, 2-3 cho MiniTest)
  ├─ Bảng cấu hình combo:
  │   Combo | Loại        | Chủ đề       | Số câu | Loại câu
  │   1     | Mở đầu     | Giới thiệu   | 1      | standard
  │   2     | Describe   | [topic ▼]    | 3      | describe
  │   3     | Routine    | [topic ▼]    | 3      | routine
  │   4     | Role Play  | N/A          | 3      | roleplay
  │   5     | Experience | [topic ▼]    | 3      | experience
  ├─ Thời gian ghi âm mỗi câu: [120] giây
  └─ Số lần phát audio: [2 ▼] lần

Tab "Câu hỏi OPIC":
  ← Mở rộng question form với các trường thêm:
  ├─ Audio câu hỏi: [Upload MP3 / nhập URL]
  ├─ Số lần phát: [1] [2] (radio)
  ├─ ComboType: [Describe ▼] [Routine] [Experience] [RolePlay] [QuestionAsking]
  ├─ Combo index: [1-5]
  ├─ Thời gian trả lời (giây): [120]
  └─ Chủ đề (tag): [Du lịch] [Âm nhạc] ...

Trang riêng — Script Templates:
  /teacher/opic/scripts               ← Quản lý script mẫu
  /teacher/opic/scripts/new           ← Tạo script (Opening / Main points / Closing)

Trang riêng — OPIC Analytics:
  /teacher/opic/page.tsx              ← Phân bổ level (NH→AL), avg score, skill radar
  /teacher/opic/students/page.tsx     ← Kết quả từng học viên, override
```

##### B. VSTEPMockTest — Tab "Cài đặt VSTEP" trong quiz editor

> Render khi `quizType === "VSTEPMockTest"`

```
Tab "Cài đặt VSTEP":
  ┌─ 4 phần thi (card mỗi phần):
  │   [Listening 40'] [Reading 60'] [Writing 60'] [Speaking 12']
  ├─ Listening:
  │   PassageGroup Manager:
  │     Nhóm | Loại         | Audio URL    | Số câu | PlayLimit | PreListen
  │     1    | short_clip   | [upload/URL] | 8      | 2         | 20s
  │     2    | dialogue     | [upload/URL] | 12     | 2         | 20s
  │     3    | lecture      | [upload/URL] | 15     | 2         | 20s
  ├─ Reading:
  │   PassageGroup Manager:
  │     Nhóm | Loại   | Văn bản (textarea) | Số câu
  │     1-4  | text   | [soạn/paste]       | 10
  ├─ Writing:
  │   Task 1: [Letter — formal ▼] / [Letter — informal]
  │   Task 2: [Essay type ▼] (Argumentative / Discussion / ...)
  └─ Speaking:
      Part 1: Topic groups config
      Part 2: Solution options config (3 choices A/B/C)
      Part 3: Bullet points config

Trang riêng — VSTEP Analytics:
  /teacher/vstep/page.tsx             ← Band distribution, 4 skill radar
  /teacher/vstep/students/page.tsx    ← Band results từng học viên
  /teacher/vstep/passages/page.tsx    ← Passage group manager độc lập
```

##### C. AdaptiveQuiz — Tab "Cài đặt Adaptive"

> Render khi `quizType === "Adaptive"`

```
Tab "Cài đặt Adaptive":
  ├─ Câu hỏi bắt đầu (điểm xuất phát): [Medium ▼]
  ├─ Số câu tối đa: [20]
  ├─ Điều kiện dừng sớm: [Nếu 3 câu liên tiếp đúng/sai]
  └─ Bắt buộc gắn độ khó cho từng câu hỏi: ✅
  
  (Question bank filter: hiển thị warning nếu câu hỏi chưa gắn Easy/Medium/Hard)
```

##### D. RealtimeQuiz — Tab "Cài đặt Realtime"

> Render khi `quizType === "Mini"` (realtime type)

```
Tab "Cài đặt Realtime":
  ├─ Thời gian mỗi câu (giây): [20]
  ├─ Cho phép xem đáp án sau mỗi câu: [Có / Không]
  └─ Loại câu hỏi: chỉ cho phép MultipleChoice / SingleChoice
  
  (Question bank filter: chặn QuestionType = Speaking/Writing/FillInBlank)
```

#### 14.2.3 Sơ đồ — Tabbed Quiz Editor

```
/teacher/quizzes/[id]
├── Tab "Thông tin cơ bản"      ← SHARED — mọi loại quiz
├── Tab "Câu hỏi"               ← SHARED core + mode-specific question fields
├── Tab "Cài đặt [QuizType]"    ← CONDITIONAL — chỉ render khi có config riêng
│     OPICMockTest   → OPIC Settings Tab
│     VSTEPMockTest  → VSTEP Settings Tab  
│     Adaptive       → Adaptive Settings Tab
│     Mini/Realtime  → Realtime Settings Tab
│     Chapter/Final  → (không cần tab riêng)
├── Tab "Thống kê"              ← SHARED — mọi loại quiz
└── Tab "Xem trước"             ← SHARED — mọi loại quiz
```

#### 14.2.4 Kết luận — Quiz Config

| Phán quyết | Chi tiết |
|-----------|---------|
| **Dùng chung (80%)** | List page, basic edit form (title/duration/status/score), question bank picker, analytics shell, lifecycle actions |
| **Tách riêng (20%)** | Conditional "Mode Settings" tab trong quiz editor cho OPIC/VSTEP/Adaptive/Realtime; trang riêng cho OPIC Script Templates, VSTEP Passage Groups, OPIC/VSTEP Teacher Analytics |
| **Không cần wizard** | Không cần "wizard 5 bước" riêng để tạo OPIC quiz. Dùng form chung tạo quiz trước → vào edit → cấu hình tab OPIC settings + câu hỏi. Đơn giản hơn, ít code hơn, UX tương đồng với các loại quiz khác |
| **Question form mở rộng** | Form thêm câu hỏi mở rộng thêm fields khi QuizType là OPIC (audio upload, combo type, time limit) hoặc VSTEP (passage group link, part assignment) |

---

### 14.3 Câu hỏi 2 — Teacher Portal vs Admin Portal: Tách hay gộp?

#### 14.3.1 Hiện trạng phân tích

```
Hiện tại:
  /admin/*   — 26+ trang: quản lý courses, lessons, users, books, orders, vouchers,
                           banners, analytics hệ thống, settings, roles, approvals
               → Chỉ Admin role

  /teacher/* — 9 trang: quản lý quiz, question bank, placement, realtime
               → Teacher VÀ Admin role (layout.tsx cho phép cả hai)

Vấn đề hiện tại:
  1. Giáo viên tạo khóa học ở /admin/courses → phải "bước sang" portal Admin
  2. Admin nếu muốn quản lý quiz → phải vào /teacher
  3. Hai layout/sidebar riêng → trải nghiệm không nhất quán
  4. Với OPIC + VSTEP, teacher portal sẽ có thêm:
       /teacher/opic/ (3–4 trang), /teacher/vstep/ (2–3 trang)
     → Teacher portal ngày càng lớn
```

#### 14.3.2 Phân tích Tách vs Gộp

**PHƯƠNG ÁN A — Giữ nguyên tách biệt (với cải tiến nhỏ)**

| Ưu điểm | Nhược điểm |
|---------|-----------|
| Phân tách rõ: Admin = quản lý nền tảng; Teacher = quản lý nội dung học thuật | Teacher vẫn phải "nhảy" giữa 2 portal |
| Ít rủi ro: không chạm vào admin layout vốn đã ổn định | Sidebar teacher quá nhỏ (3 items) → sắp phình to thêm |
| Teacher không nhìn thấy dữ liệu nhạy cảm (users, orders, hệ thống) | Duy trì 2 layout song song |

**PHƯƠNG ÁN B — Gộp hoàn toàn vào /admin với role-based nav**

| Ưu điểm | Nhược điểm |
|---------|-----------|
| Một portal duy nhất, một URL scheme | Phải migrate 9 trang /teacher/* → /admin/* (effort lớn) |
| Admin sidebar đã phong phú — teacher nav items bổ sung vào | Risk: teacher nhìn thấy các mục admin nhạy cảm nếu guard sơ hở |
| Không cần maintain 2 layout | URL break → redirect phức tạp |

**PHƯƠNG ÁN C — Nâng cấp Teacher Portal thành "Content Portal" (KHUYẾN NGHỊ ✅)**

> Giữ `/teacher/*` nhưng **mở rộng phạm vi** để teacher không cần sang `/admin`

```
/teacher/
  ├── Quản lý Quiz           (hiện có)
  │     ├── /quizzes
  │     ├── /questions
  │     ├── /placement
  │     ├── /realtime
  │     ├── /opic/            (Phase 3.2)
  │     └── /vstep/           (Phase 3.3)
  ├── Quản lý Khóa học       (THÊM MỚI — hiện ở /admin/courses)
  │     ├── /courses          ← link/embed từ admin, hoặc di chuyển hẳn
  │     ├── /courses/[id]/modules
  │     └── /courses/[id]/lessons
  ├── Học viên của tôi       (THÊM MỚI)
  │     └── /students         ← filter học viên đã đăng ký khóa của teacher này
  └── Analytics              (THÊM MỚI — hiện ở /admin/analytics)
        └── /analytics        ← chỉ data của teacher đang đăng nhập

Admin portal /admin/* giữ nguyên:
  Quản lý Users, Orders, Books, Vouchers, Banners, System Settings, Roles
  → Chỉ Admin role (KHÔNG cho Teacher vào)
```

#### 14.3.3 So sánh 3 phương án

| Tiêu chí | A — Giữ nguyên | B — Gộp vào Admin | C — Nâng cấp Teacher Portal ✅ |
|---------|--------------|------------------|-----------------------------|
| Effort triển khai | Thấp | Cao (migration) | Trung bình |
| UX cho Teacher | Phải nhảy portal | Một portal | Một portal |
| Bảo mật (separation of concerns) | Tốt | Rủi ro trung bình | Tốt |
| Scalability | Kém (2 portals nhỏ) | Trung bình | Tốt |
| Breaking changes | Không | Cao | Thấp (chỉ thêm, không xóa) |
| Phù hợp roadmap OPIC + VSTEP | Chưa tốt | Được | Tốt nhất |

#### 14.3.4 Phương án C — Chi tiết triển khai

**Bước 1 (ngay):** Thêm "Quản lý Khóa học" vào teacher sidebar
```tsx
// teacher/layout.tsx — thêm nav item
{ label: "Khóa học của tôi",  href: "/teacher/courses",  icon: BookOpen }
{ label: "Học viên",           href: "/teacher/students", icon: Users }
```
- `/teacher/courses` → teacher thấy **chỉ khóa học của mình** (filter `CreatedBy=currentUserId`)
- Backend: `GET /api/v1/teacher/courses` → trả về courses của teacher đang login
- Admin vẫn có `/admin/courses` để thấy tất cả khóa học + duyệt

**Bước 2 (Phase 3.2):** Thêm OPIC sub-section vào teacher sidebar
```tsx
{ label: "OPIC", href: "/teacher/opic", icon: Mic, subItems: [
    { label: "Analytics",    href: "/teacher/opic" },
    { label: "Học viên",     href: "/teacher/opic/students" },
    { label: "Script mẫu",   href: "/teacher/opic/scripts" },
]}
```

**Bước 3 (Phase 3.3):** Thêm VSTEP sub-section vào teacher sidebar

**Không làm:**
- KHÔNG di chuyển `/admin/users`, `/admin/orders`, `/admin/books` sang teacher portal
- KHÔNG cho teacher vào trang system settings / roles / system analytics
- KHÔNG merge 2 URL scheme

#### 14.3.5 Kết luận — Teacher Portal

| Phán quyết | Chi tiết |
|-----------|---------|
| **Không gộp vào /admin** | Admin portal giữ nguyên cho system-level management. Không merge để tránh rủi ro bảo mật và breaking changes. |
| **Mở rộng /teacher thành "Content Portal"** | Thêm Quản lý Khóa học + Học viên + Analytics vào teacher sidebar. Teacher không cần sang /admin nữa. |
| **OPIC + VSTEP → sub-sections trong /teacher** | Giữ cấu trúc `/teacher/opic/*` và `/teacher/vstep/*` như thiết kế ban đầu. Đúng và không cần thay đổi. |
| **Admin vẫn có thể vào /teacher** | layout.tsx giữ `Teacher || Admin` role guard. Admin cần quản lý quiz thì dùng /teacher. |

---

### 14.4 Phương án được đề xuất — Tóm tắt

```
┌────────────────────────────────────────────────────────────┐
│               KIẾN TRÚC PORTAL ĐỀ XUẤT                   │
├────────────────────────────────────────────────────────────┤
│  /admin/*          Dành cho Admin role                     │
│  ├─ Users, Orders, Books, Vouchers, Banners                │
│  ├─ System Settings, Roles                                 │
│  ├─ System Analytics (toàn platform)                       │
│  └─ Course Approvals (admin duyệt nội dung)                │
├────────────────────────────────────────────────────────────┤
│  /teacher/*        Dành cho Teacher + Admin role           │
│  ├─ Quản lý Quiz (Standard, OPIC, VSTEP, Adaptive, RT)     │
│  ├─ Ngân hàng Câu hỏi                                      │
│  ├─ Kiểm tra Xếp lớp                                       │
│  ├─ Realtime Quiz Host                                      │
│  ├─ Khóa học của tôi  ← THÊM                               │
│  ├─ Học viên          ← THÊM                               │
│  ├─ Analytics         ← THÊM (filter theo teacher)         │
│  ├─ OPIC Tools        ← Phase 3.2                          │
│  └─ VSTEP Tools       ← Phase 3.3                          │
└────────────────────────────────────────────────────────────┘

QUIZ CONFIG EDITOR (/teacher/quizzes/[id]):
┌─────────────────────────────────────────────────────────┐
│  Tab: Thông tin cơ bản  │  Câu hỏi  │ [Mode Settings] │ Thống kê  │ Xem trước │
│                          │           │                 │           │           │
│  (SHARED cho mọi loại)   │  (SHARED) │ (CONDITIONAL:  │ (SHARED)  │  (SHARED) │
│                          │           │  OPIC/VSTEP/    │           │           │
│                          │           │  Adaptive/RT)   │           │           │
└─────────────────────────────────────────────────────────┘
```

### 14.5 Việc cần làm sau khi duyệt phương án

> ✅ **Đã duyệt và implement xong Phase 3.2 (OPIC Teacher Portal).**

| Task | Phase | Effort | Trạng thái |
|------|-------|--------|-----------|
| Thêm "Khóa học", "OPIC" vào teacher sidebar (NAV_GROUPS) | Ngay | 0.5 ngày | ✅ Done |
| `/teacher/courses` page (filter by teacher, dùng `teacherApi`) | Ngay | 1 ngày | ✅ Done |
| `teacherApi.ts` RTK Query slice + đăng ký vào Redux store | Ngay | 0.5 ngày | ✅ Done |
| Backend `TeacherPortalController` + `TeacherPortalQueries.cs` | Ngay | 1 ngày | ✅ Done |
| Quiz editor OPIC tab (`teacher/quizzes/[id]/page.tsx`) | Phase 3.2 | 2 ngày | ✅ Done |
| OPIC question config modal (audio URL, combo type, time limit) | Phase 3.2 | 1.5 ngày | ✅ Done |
| `Question.Update()` + `UpdateQuestionCommand` thêm OPIC fields | Phase 3.2 | 0.5 ngày | ✅ Done |
| `/teacher/opic` analytics dashboard | Phase 3.2 | 1 ngày | ✅ Done |
| `/teacher/opic/students` kết quả học viên OPIC | Phase 3.2 | 1 ngày | ✅ Done |
| `/teacher/opic/scripts` script template list | Phase 3.2 | 1 ngày | ✅ Done |
| `/teacher/opic/scripts/new` tạo script form | Phase 3.2 | 0.5 ngày | ✅ Done |
| `opicApi.ts` thêm `useGetTeacherScriptsQuery`, `useCreateScriptMutation` | Phase 3.2 | 0.5 ngày | ✅ Done |
| Cập nhật `TEST_GUIDE_OPIC.md` — Section 7 Teacher Portal | Phase 3.2 | — | ✅ Done |
| Quiz editor VSTEP tab + PassageGroup editor | Phase 3.3 | 3 ngày | 🔜 Pending |
| `/teacher/vstep` analytics + passages pages | Phase 3.3 | 2 ngày | 🔜 Pending |
