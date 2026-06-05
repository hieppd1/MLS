# THIẾT KẾ TÍCH HỢP AI CHẤM ĐIỂM SPEAKING & WRITING — MLS PLATFORM

> **Phiên bản:** 1.0  
> **Ngày phát hành:** 31/05/2026  
> **Người soạn:** MLS Tech Team  
> **Người duyệt:** _(Khách hàng / Product Owner)_  
> **Trạng thái:** ĐỀ XUẤT — Chờ duyệt  
> **Phạm vi:** Phase 3 — Quiz Engine + AI Evaluation (OPIC · VSTEP · Standard Quiz · Placement Test)

---

## 1. MỤC TIÊU & PHẠM VI

### 1.1. Mục tiêu

Thay thế **module chấm điểm AI mock** (đang dùng random score + feedback cứng) bằng **pipeline thật** sử dụng OpenAI:
- **Whisper-1** → chuyển audio → transcript
- **GPT-4o / GPT-4o-mini** → chấm điểm + sinh feedback chi tiết theo rubric OPIC / VSTEP / CEFR

### 1.2. Phạm vi áp dụng

| Loại bài | Mô tả | Áp dụng AI |
|---|---|---|
| OPIC | 15 câu Speaking, 5 combo, band NH→AL | ✅ Speaking (Whisper + GPT-4o) |
| VSTEP Speaking | 3 parts, ~12 câu | ✅ Speaking (Whisper + GPT-4o) |
| VSTEP Writing | 2 task essay | ✅ Writing (GPT-4o) |
| Placement Test | Speaking + Writing | ✅ Cả hai |
| Standard Quiz | Speaking/Essay câu lẻ | ✅ Cả hai |

### 1.3. Ngoài phạm vi (Out-of-scope)

- Phoneme-level pronunciation analysis (cần model chuyên biệt như Azure Speech Pronunciation Assessment) — backlog Q3
- Real-time streaming transcribe (whisper realtime API) — backlog
- Tự host LLM open-source (Llama 3 / Qwen) — chưa đầu tư hạ tầng GPU
- Voice cloning / TTS feedback bằng giọng giáo viên — backlog

---

## 2. HIỆN TRẠNG (AS-IS)

### 2.1. Đã có sẵn

| Cấu phần | Trạng thái | File |
|---|---|---|
| `SpeakingGradingWorker` (BackgroundService + queue + SignalR `AiGradingProgress`) | ✅ Done | `MLS.Infrastructure/Workers/SpeakingGradingWorker.cs` |
| `WritingGradingWorker` (BackgroundService + queue) | ✅ Done | `MLS.Infrastructure/Workers/WritingGradingWorker.cs` |
| Entity `SpeakingSubmission` / `WritingSubmission` + lifecycle (`SetProcessing` / `SetGraded` / `SetFailed`) | ✅ Done | `MLS.Domain/Entities/` |
| Upload audio per question (`UploadSpeakingCommand` → MinIO → enqueue) | ✅ Done | `MLS.Application/Quiz/Commands/SpeakingCommands.cs` |
| `OPIcLevelEngine` (NH/IL/IM1-3/IH/AL) + `VSTEPBandEngine` (A2/B1/B2/C1) | ✅ Done | `MLS.Application/OPIC/Services/`, `MLS.Application/VSTEP/Services/` |
| Rubric weights theo `ExamModeTag` (`opic_describe`, `opic_compare`, `vstep_part1-3`, `essay_vstep`, `letter`) | ✅ Done | `*GradingWorker.cs` → `CalculateFinalScore()` |
| SignalR Hub `QuizHub` + event `AiGradingProgress` per question | ✅ Done | `MLS.API/Hubs/QuizHub.cs` |
| Frontend Recorder UI + polling/SignalR cập nhật trạng thái chấm | ✅ Done | `/opic/[sessionId]/play`, `/vstep/[sessionId]/speaking` |

### 2.2. Đang là MOCK (cần thay)

| Hạng mục | Cách hoạt động hiện tại | File |
|---|---|---|
| Speaking — STT | Trả chuỗi `"[Transcript unavailable in development mode — Whisper not connected]"` | `SpeakingGradingWorker.cs` L84 |
| Speaking — Scoring | `Random.Shared.Next(60, 92)` cho từng tiêu chí | `SpeakingGradingWorker.cs → MockGrade()` |
| Speaking — Feedback | Chuỗi markdown cứng `"⚠️ This is a simulated score..."` | cùng file |
| Writing — Grammar check | Hard-coded JSON `grammarErrors` | `WritingGradingWorker.cs` |
| Writing — CEFR distribution | Hard-coded | cùng file |
| OpenAI SDK | **Chưa có** package, **chưa có** `OpenAI:ApiKey` trong `appsettings` | — |
| Rate limit AI/user (AI-03 yêu cầu) | Chưa làm | — |

---

## 3. KIẾN TRÚC ĐỀ XUẤT (TO-BE)

### 3.1. Sơ đồ luồng tổng thể (per-question)

```
┌─────────────┐        POST audio          ┌──────────────────────┐
│  Recorder   │ ─────────────────────────▶ │ UploadSpeakingCommand │
│  Frontend   │                            │   (per question)      │
└─────────────┘                            └──────────┬───────────┘
                                                      │
                                                      ▼
                                          ┌────────────────────────┐
                                          │   MinIO (audio file)   │
                                          └────────────────────────┘
                                                      │
                                                      ▼
                                          ┌────────────────────────┐
                                          │ SpeakingSubmission DB  │
                                          │   status = Pending     │
                                          └──────────┬─────────────┘
                                                      │
                                                      ▼
                                          ┌────────────────────────┐
                                          │ ISpeakingGradingQueue  │
                                          │  (in-memory channel)   │
                                          └──────────┬─────────────┘
                                                      │
                ┌─────── SpeakingGradingWorker (BackgroundService) ────────┐
                │  SemaphoreSlim(5) ─ giới hạn concurrency                │
                ▼                                                          │
   ┌────────────────────────┐    audio bytes    ┌──────────────────────┐ │
   │  IOpenAiService        │ ────────────────▶ │ OpenAI Whisper API   │ │
   │  TranscribeAsync()     │ ◀──────transcript │   (whisper-1)        │ │
   └──────────┬─────────────┘                   └──────────────────────┘ │
              │                                                          │
              │ transcript + ExamModeTag + rubric prompt                 │
              ▼                                                          │
   ┌────────────────────────┐    JSON scores    ┌──────────────────────┐ │
   │  IOpenAiService        │ ────────────────▶ │  OpenAI Chat API     │ │
   │  ScoreSpeakingAsync()  │ ◀──────────────── │   (gpt-4o/mini)      │ │
   └──────────┬─────────────┘                   └──────────────────────┘ │
              │                                                          │
              ▼                                                          │
   ┌────────────────────────┐                                            │
   │ SpeakingSubmission DB  │                                            │
   │  status = Done         │                                            │
   │  scores, transcript,   │                                            │
   │  feedback, modelUsed   │                                            │
   └──────────┬─────────────┘                                            │
              │                                                          │
              ▼                                                          │
   ┌────────────────────────┐                                            │
   │ SignalR QuizHub        │ ───── AiGradingProgress event ──────▶ FE  │
   │  group user_{userId}   │                                            │
   └────────────────────────┘                                            │
              │                                                          │
              │  Khi đủ N/N câu graded → publish OpicSessionReadyEvent  │
              ▼                                                          │
   ┌────────────────────────┐                                            │
   │ FinalizeSessionCommand │  (chỉ chạy rule-based, không gọi OpenAI)  │
   │  → OPIcLevelEngine     │                                            │
   │  → Band NH..AL         │                                            │
   └────────────────────────┘                                            │
                                                                         │
   └──────────────────────────────────────────────────────────────────────┘
```

### 3.2. Pattern upload — **Per-question streaming** (không batch)

- Học viên kết thúc câu i → POST audio ngay → tạo `SpeakingSubmission` riêng → enqueue → worker chấm độc lập
- **15 câu OPIC = 15 lần upload + 15 lần chấm song song** (concurrency cap = 5)
- Lý do giữ pattern này:
  - UX: học viên thấy "Đang chấm câu 3/15" thay vì chờ hết bài
  - Resilience: 1 câu fail không ảnh hưởng các câu khác
  - Cost control: bỏ giữa chừng = chỉ tốn N câu thay vì cả 15
  - Rate limit dễ tracking per-submission

### 3.3. Cấu phần phần mềm mới

| Thành phần | Type | Vị trí | Mô tả |
|---|---|---|---|
| `IOpenAiService` | Interface | `MLS.Application/Common/Interfaces/` | Abstract OpenAI calls |
| `OpenAiService` | Class | `MLS.Infrastructure/Ai/` | Implement gọi OpenAI SDK |
| `OpenAiSettings` | POCO | `MLS.Infrastructure/Ai/` | Config binding |
| `SpeakingPromptBuilder` | Static | `MLS.Infrastructure/Ai/Prompts/` | Build prompt theo ExamModeTag |
| `WritingPromptBuilder` | Static | `MLS.Infrastructure/Ai/Prompts/` | Build prompt theo essay type |
| `AiRateLimiter` | Service | `MLS.Infrastructure/Ai/` | Redis sliding window per user/day |
| `AiUsageLog` | Entity | `MLS.Domain/Entities/` | Audit cost + token usage |

---

## 4. CHỌN MODEL — CHIẾN LƯỢC ĐA TẦNG

### 4.1. So sánh chi phí (giá OpenAI tháng 5/2026)

| Model | Input | Output | Whisper |
|---|---|---|---|
| **gpt-4o** | $2.50 / 1M token | $10.00 / 1M token | $0.006/phút |
| **gpt-4o-mini** | $0.15 / 1M token | $0.60 / 1M token | $0.006/phút |
| Tỷ lệ chênh | ~16.7× | ~16.7× | bằng nhau |

### 4.2. Cost 1 câu Speaking (1.5 phút audio)

| Bước | gpt-4o | gpt-4o-mini |
|---|---|---|
| Whisper STT | $0.0090 | $0.0090 |
| GPT scoring (~1.200 in + 400 out token) | $0.0070 | $0.00042 |
| **Tổng/câu** | **$0.0160** | **$0.0094** |

→ Speaking: mini chỉ rẻ hơn **~1.7×** (vì Whisper dominate)

### 4.3. Cost 1 phiên OPIC (15 câu)

| Khoản | gpt-4o | gpt-4o-mini |
|---|---|---|
| Whisper (15 × 1.5 × $0.006) | $0.135 | $0.135 |
| GPT scoring (15 lần) | $0.105 | $0.0063 |
| **Tổng/phiên** | **$0.240 (~6.000 VND)** | **$0.141 (~3.500 VND)** |

### 4.4. Cost 1 bài Writing VSTEP (2 essay)

| Khoản | gpt-4o | gpt-4o-mini |
|---|---|---|
| GPT (2 × ~2k in + 800 out) | $0.026 | $0.0016 |
| **Tổng/bài** | **$0.026 (~650 VND)** | **$0.0016 (~40 VND)** |

→ Writing: mini rẻ hơn **~16×** vì không có Whisper bù trừ

### 4.5. Đánh giá chất lượng

| Tác vụ | gpt-4o | gpt-4o-mini | Khuyến nghị |
|---|---|---|---|
| Whisper transcribe | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Như nhau |
| Chấm Speaking band thấp (NH/IL) | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | mini đủ |
| Chấm Speaking band cao (IM/IH/AL) | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ Miss nuance | **gpt-4o** |
| Sinh feedback chi tiết Speaking | ⭐⭐⭐⭐⭐ giàu ví dụ | ⭐⭐⭐ generic | **gpt-4o** nếu là USP |
| Chấm Grammar Writing | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | mini đủ |
| Chấm Coherence Writing B2+ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | **gpt-4o** |
| Vocabulary range CEFR | ⭐⭐⭐⭐⭐ chuẩn | ⭐⭐⭐⭐ lành tính, lệch +0.5 band | benchmark riêng |
| Latency | 3–5s | 1–2s | mini nhanh hơn |
| Tiếng Việt (đề OPIC VI) | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ paraphrase kém | **gpt-4o** |

### 4.6. Chiến lược chọn model — TIER HÓA theo `ExamModeTag` (KHUYẾN NGHỊ)

| ExamModeTag | Model | Lý do |
|---|---|---|
| `opic_describe` (câu mô tả NH/IL) | gpt-4o-mini | Đơn giản, mini đủ |
| `opic_compare` | gpt-4o | So sánh, lập luận → cần 4o |
| `opic_roleplay` | gpt-4o | Pragmatic, ngữ cảnh |
| `vstep_part1` (intro) | gpt-4o-mini | Câu hỏi mở đầu đơn giản |
| `vstep_part2` (discussion) | gpt-4o | Argumentative |
| `vstep_part3` (presentation) | gpt-4o | Phân tích sâu |
| `essay_vstep` (Writing task 2) | gpt-4o | Essay B2/C1 |
| `letter` (Writing task 1) | gpt-4o-mini | Format thư đơn giản |
| `placement_speaking` / `placement_writing` | gpt-4o | Quyết định Level 1–6 |

**Cost dự kiến ở 1.000 user/tháng (mỗi user: 2 OPIC + 3 Writing + 5 Speaking lẻ):**

| Chiến lược | Cost/tháng | Ghi chú |
|---|---|---|
| Toàn bộ gpt-4o | ~$638 (~16M VND) | Đơn giản, chất lượng tối đa |
| **Tier hóa (khuyến nghị)** | **~$420 (~10.5M VND)** | Cân bằng tối ưu |
| Toàn bộ gpt-4o-mini | ~$334 (~8.4M VND) | Rẻ nhất, chấp nhận sai band ±0.5 |

**Quyết định giai đoạn pilot (1–3 tháng đầu):** Dùng **toàn bộ gpt-4o** để có baseline chất lượng cao, sau khi có data benchmark sẽ chuyển sang tier hóa.

---

## 5. ĐĂNG KÝ & CẤU HÌNH OPENAI

### 5.1. Đăng ký tài khoản (do KH/PO thực hiện 1 lần)

1. Truy cập https://platform.openai.com/signup
2. Verify email + SĐT (VN +84 hỗ trợ)
3. Tạo Organization "MLS"
4. Settings → Billing → Add Payment Method (thẻ Visa/Master quốc tế, **không** dùng được ATM nội địa)
5. Nạp credit lần đầu: **$50** (đủ test 3–6 tháng pilot)
6. Bật Auto-recharge: $20 khi balance < $10
7. Đặt Usage Limit: **Monthly hard cap $200** (OpenAI sẽ chặn API khi vượt)
8. Bật Email alerts: 50% / 80% / 100% budget

### 5.2. Tạo API Keys (3 keys riêng)

| Tên key | Môi trường | Storage | Owner |
|---|---|---|---|
| `mls-dev-local` | Local Dev | User Secrets (dotnet) | Mỗi dev |
| `mls-staging` | Staging VPS | `.env` file (chmod 600) | DevOps |
| `mls-prod` | Production | `.env` + Secret Manager | DevOps |

Format key: `sk-proj-xxxxxxxxxxxxxxxx` (chỉ hiện 1 lần khi tạo — lưu password manager ngay).

### 5.3. Cấu hình `appsettings.json` (NÊN commit, không chứa key)

```jsonc
{
  "OpenAI": {
    "ApiKey": "",
    "Organization": "",
    "BaseUrl": "https://api.openai.com/v1",
    "Models": {
      "SpeakingDefault": "gpt-4o",
      "SpeakingMini": "gpt-4o-mini",
      "WritingDefault": "gpt-4o",
      "WritingMini": "gpt-4o-mini",
      "Placement": "gpt-4o",
      "Transcription": "whisper-1"
    },
    "RouteByExamMode": {
      "opic_describe": "gpt-4o-mini",
      "opic_compare": "gpt-4o",
      "opic_roleplay": "gpt-4o",
      "vstep_part1": "gpt-4o-mini",
      "vstep_part2": "gpt-4o",
      "vstep_part3": "gpt-4o",
      "essay_vstep": "gpt-4o",
      "letter": "gpt-4o-mini",
      "placement_speaking": "gpt-4o",
      "placement_writing": "gpt-4o"
    },
    "MaxConcurrentRequests": 5,
    "TimeoutSeconds": 90,
    "MaxRetries": 3,
    "RetryBackoffSeconds": [1, 3, 8],
    "MaxAudioMinutes": 5,
    "MaxEssayChars": 10000
  },
  "AiRateLimit": {
    "PerUserPerDay": {
      "Speaking": 60,
      "Writing": 20
    },
    "PerTenantPerDay": {
      "TotalCalls": 5000
    }
  }
}
```

### 5.4. Local Dev — User Secrets (KHÔNG commit key)

```powershell
cd backend/MLS.API
dotnet user-secrets init
dotnet user-secrets set "OpenAI:ApiKey" "sk-proj-xxxxxxx"
```

### 5.5. Production — `docker-compose.prod.yml`

```yaml
backend:
  environment:
    - OpenAI__ApiKey=${OPENAI_API_KEY}
    - OpenAI__Models__SpeakingDefault=gpt-4o
    - OpenAI__Models__WritingDefault=gpt-4o
```

File `.env` trên VPS (chmod 600, **không** vào git):
```
OPENAI_API_KEY=sk-proj-yyyyyyy
```

### 5.6. NuGet package

```powershell
cd backend/MLS.Infrastructure
dotnet add package OpenAI --version 2.1.0
dotnet add package Polly --version 8.4.0
```

---

## 6. THIẾT KẾ CHI TIẾT — INTERFACE & PROMPT

### 6.1. `IOpenAiService` interface

```csharp
namespace MLS.Application.Common.Interfaces;

public interface IOpenAiService
{
    Task<TranscriptionResult> TranscribeAsync(
        Stream audioStream, string fileName, CancellationToken ct);

    Task<SpeakingScoreResult> ScoreSpeakingAsync(
        string transcript, string examModeTag, string? questionContext,
        CancellationToken ct);

    Task<WritingScoreResult> ScoreWritingAsync(
        string essay, string examModeTag, string? prompt,
        CancellationToken ct);
}

public record TranscriptionResult(
    string Transcript, double DurationSeconds, decimal CostUsd);

public record SpeakingScoreResult(
    int Pronunciation, int Fluency, int Accuracy,
    int Coherence, int Vocabulary, int TaskAchievement,
    string FeedbackMarkdown,
    string ModelUsed, int InputTokens, int OutputTokens, decimal CostUsd);

public record WritingScoreResult(
    int Grammar, int Vocabulary, int Coherence, int TaskAchievement,
    string FeedbackMarkdown,
    List<GrammarError> GrammarErrors,
    string CefrEstimate,
    string ModelUsed, int InputTokens, int OutputTokens, decimal CostUsd);
```

### 6.2. Prompt template — Speaking (ví dụ `opic_describe`)

```
You are an OPIc Speaking grader certified by ACTFL.
Task: Grade the following student answer for an OPIc question.

Question context: {questionText}
Exam mode: opic_describe (level NH-IL band)
Expected duration: 1-2 minutes

Student transcript:
"""
{transcript}
"""

Score the response on 6 criteria (each 0-100):
- Pronunciation: clarity, stress, intonation
- Fluency: pace, hesitation, self-correction
- Accuracy: grammatical correctness
- Coherence: logical flow, connectors
- Vocabulary: range and appropriateness
- TaskAchievement: addresses the prompt fully

Respond STRICTLY in JSON format:
{
  "pronunciation": <int>,
  "fluency": <int>,
  "accuracy": <int>,
  "coherence": <int>,
  "vocabulary": <int>,
  "task_achievement": <int>,
  "feedback_markdown": "<2-3 paragraph feedback in Vietnamese, with specific examples and rephrasing suggestions>"
}
```

Sử dụng OpenAI `response_format: { type: "json_object" }` để đảm bảo JSON valid.

### 6.3. Prompt template — Writing (ví dụ `essay_vstep`)

```
You are a VSTEP Writing grader (B2/C1 level).
Task: Grade the following essay.

Essay prompt: {prompt}
Word limit: 250 words minimum
Exam mode: essay_vstep

Student essay:
"""
{essay}
"""

Score on 4 criteria (each 0-100):
- Grammar: accuracy, range of structures
- Vocabulary: lexical resource, collocation
- Coherence: organization, cohesive devices
- TaskAchievement: position clarity, argument depth

Also extract grammar errors with offset+suggestion.

Respond STRICTLY in JSON:
{
  "grammar": <int>,
  "vocabulary": <int>,
  "coherence": <int>,
  "task_achievement": <int>,
  "cefr_estimate": "A2|B1|B2|C1",
  "feedback_markdown": "<feedback Vietnamese>",
  "grammar_errors": [
    {"offset": <int>, "length": <int>, "message": "<vi>", "suggestion": "<en>"}
  ]
}
```

### 6.4. Routing logic trong `OpenAiService`

```csharp
private string PickModel(string examModeTag, ModelKind kind)
{
    if (_settings.RouteByExamMode.TryGetValue(examModeTag, out var m))
        return m;
    return kind == ModelKind.Speaking
        ? _settings.Models.SpeakingDefault
        : _settings.Models.WritingDefault;
}
```

### 6.5. Concurrency + Retry (Polly)

```csharp
private readonly SemaphoreSlim _gate = new(maxConcurrent: 5);

public async Task<T> CallWithGuardAsync<T>(Func<Task<T>> action, CancellationToken ct)
{
    await _gate.WaitAsync(ct);
    try
    {
        var policy = Policy<T>
            .Handle<HttpRequestException>()
            .OrResult(r => r is null)
            .WaitAndRetryAsync(
                retryCount: 3,
                sleepDurationProvider: i => TimeSpan.FromSeconds(_settings.RetryBackoffSeconds[i-1]));
        return await policy.ExecuteAsync(action);
    }
    finally { _gate.Release(); }
}
```

### 6.6. Audit log

Mọi call OpenAI ghi vào bảng `AiUsageLogs`:

| Cột | Kiểu | Mô tả |
|---|---|---|
| Id | uuid | PK |
| TenantSlug | string | |
| UserId | uuid | |
| SubmissionType | enum | Speaking / Writing |
| SubmissionId | uuid | FK |
| Model | string | gpt-4o, gpt-4o-mini, whisper-1 |
| InputTokens | int | |
| OutputTokens | int | |
| AudioSeconds | int | (Whisper) |
| CostUsd | decimal(10,6) | |
| LatencyMs | int | |
| Status | enum | Success / Failed / RateLimited |
| ErrorMessage | text | nullable |
| CreatedAt | timestamp | |

→ Dashboard `/admin/ai-usage` hiển thị cost theo ngày/tuần/tháng, top user, top tenant.

---

## 7. RATE LIMITING (AI-03)

### 7.1. Per-user/day (Redis sliding window)

```
Key:   ai_quota:{tenantSlug}:{userId}:speaking:{yyyy-MM-dd}
TTL:   24h
Limit: 60 calls/day Speaking, 20 calls/day Writing
```

Khi vượt → trả `429 Too Many Requests` + thông báo VI/EN tới frontend, ẩn nút "Nộp bài" và hiện counter "Bạn đã dùng 60/60 lượt chấm AI hôm nay, vui lòng quay lại sau 24h".

### 7.2. Per-tenant/day (hard cap)

`ai_quota:tenant:{slug}:total:{yyyy-MM-dd}` = 5.000 calls/day (cấu hình được).

### 7.3. Per-IP (chống abuse)

10 call/phút/IP cho endpoint upload — đã có sẵn `SlidingWindowRateLimiter` (Sprint 6.7).

---

## 8. KẾ HOẠCH TRIỂN KHAI

### 8.1. Sprint breakdown (đề xuất 3 sprint × 1 tuần)

| Sprint | Nội dung | Output |
|---|---|---|
| **Sprint AI-1** (Tuần 1) | `IOpenAiService` + `OpenAiService` + User Secrets + NuGet + Polly + SemaphoreSlim. Thay `MockGrade()` trong `SpeakingGradingWorker` bằng call thật. Test 5 câu OPIC end-to-end trên dev. | Speaking pipeline hoạt động thật trên DEV |
| **Sprint AI-2** (Tuần 2) | Tương tự cho `WritingGradingWorker`. Implement `AiRateLimiter` (Redis). Tạo bảng `AiUsageLogs` + migration. Hoàn thiện prompt templates cho 10 ExamModeTag. | Writing pipeline + rate limit + audit |
| **Sprint AI-3** (Tuần 3) | Dashboard `/admin/ai-usage` (cost charts, top users). Auto-trigger `FinalizeSessionCommand` khi đủ N/N câu graded. Pilot 20 user thật trên staging. Benchmark band so với teacher chấm tay. Tuning prompt. | Production-ready + benchmark report |

### 8.2. Rollout

| Giai đoạn | Phạm vi | Cấu hình model | Budget cap |
|---|---|---|---|
| **Internal test** (Tuần 1-2) | Team nội bộ 5 người | Toàn bộ gpt-4o | $20/tháng |
| **Closed beta** (Tuần 3-4) | 20 học viên mời | Toàn bộ gpt-4o | $50/tháng |
| **Soft launch** (Tháng 2) | ≤500 user | Toàn bộ gpt-4o | $200/tháng |
| **Scale** (Tháng 3+) | Production | Tier hóa theo `ExamModeTag` | $500/tháng |

### 8.3. Acceptance Criteria (AC)

1. ✅ Một câu Speaking OPIC chấm xong trong ≤ 15 giây kể từ lúc upload audio
2. ✅ JSON từ GPT-4o parse được 100% (test 100 mẫu thực)
3. ✅ Cost log đúng ±5% so với OpenAI dashboard
4. ✅ Rate limit per user 60 calls/day hoạt động đúng (test 70 calls liên tiếp)
5. ✅ Khi 1 câu lỗi không ảnh hưởng các câu khác (verify trên OPIC 15 câu, kill 1 worker giữa chừng)
6. ✅ SignalR push `AiGradingProgress` đến đúng user trong < 500ms sau khi graded
7. ✅ Band OPIC tự tính sau câu cuối cùng — KHÔNG gọi OpenAI thêm
8. ✅ Benchmark: band do AI chấm trùng band do giáo viên chấm ≥ 70% trên 50 mẫu (cho phép ±1 sub-band)
9. ✅ Dashboard `/admin/ai-usage` hiển thị cost theo ngày
10. ✅ Hard cap budget ($200/tháng) — khi gần đạt, gửi email cảnh báo

---

## 9. RỦI RO & GIẢI PHÁP

| Rủi ro | Mức độ | Giải pháp |
|---|---|---|
| OpenAI API outage | Trung | Submission lưu `Status=Pending`, retry sau khi API back. Hangfire schedule retry 5-15-30 phút. |
| Cost vượt dự toán | Cao | Hard cap OpenAI dashboard + per-tenant/day quota + alert email khi đạt 80% |
| GPT trả JSON sai schema | Trung | Dùng `response_format: json_object` + fallback retry 1 lần với prompt "Reply STRICT JSON only" |
| Học viên upload audio rác (silence, nhạc) | TB | Validate duration ≥ 5s ở frontend + check `audio/webm` magic bytes ở backend. Whisper trả empty → SetFailed với lý do "Audio không hợp lệ" |
| Lộ API key | Cao | Key chỉ ở User Secrets + `.env` chmod 600 + 3 key riêng dev/staging/prod, revoke 1 key không ảnh hưởng 2 key còn lại |
| Học viên abuse spam | Trung | Rate limit per-user + per-IP đã thiết kế |
| Whisper sai transcript ngôn ngữ (auto-detect lỗi) | Thấp | Truyền tham số `language="vi"` hoặc `"en"` theo `ExamModeTag` |
| Latency cao gây timeout SignalR | Thấp | Timeout 90s đủ; mini latency 1-2s, 4o 3-5s, max 8-10s với essay dài |
| Compliance GDPR / dữ liệu cá nhân | Cao | OpenAI API không train trên data API (theo policy 1/3/2023). Tắt log audio content sau 30 ngày trên server MLS. |

---

## 10. CHI PHÍ DỰ TOÁN

### 10.1. Bảng cost theo scale

| Scale | Model | OpenAI/tháng | Hạ tầng MLS | Tổng |
|---|---|---|---|---|
| Pilot 50 user | gpt-4o | $30 (~750k VND) | Sẵn có | ~750k VND |
| Soft launch 500 user | gpt-4o | $320 (~8M VND) | Sẵn có | ~8M VND |
| Production 1.000 user | Tier hóa | $420 (~10.5M VND) | Sẵn có | ~10.5M VND |
| Production 5.000 user | Tier hóa | $2.100 (~52M VND) | Sẵn có | ~52M VND |
| Production 10.000 user | Tier hóa | $4.200 (~105M VND) | +$200 Azure cache | ~110M VND |

> Giả định: 1 user/tháng = 2 phiên OPIC + 3 bài Writing + 5 câu Speaking lẻ. Tỷ giá 25.000 VND/USD.

### 10.2. Phương án tiết kiệm bổ sung (khi scale ≥ 5k user)

1. **Chuyển sang Azure OpenAI Service** — giá tương đương, có Reserved Capacity giảm 15-20% nếu cam kết dùng > $2k/tháng
2. **Cache transcript** Whisper trong Redis 7 ngày → user nghe lại bài + làm lại không cần STT lần 2 (~10% tiết kiệm)
3. **Batch Writing** — chấm 5-10 essay trong 1 prompt khi background job có lag tolerance (~20% tiết kiệm token)
4. **Fine-tune gpt-4o-mini** với 500 mẫu band do giáo viên chấm → đẩy chất lượng mini gần 4o ở Speaking (Q3 backlog)

---

## 11. BẢO MẬT & TUÂN THỦ

| Hạng mục | Triển khai |
|---|---|
| API key storage | User Secrets (dev) + `.env` chmod 600 (prod) + Secret Manager (khi go-live) |
| API key rotation | Định kỳ 6 tháng / khi có dev nghỉ việc |
| Audio storage | MinIO private bucket, signed URL TTL 1h |
| Transcript storage | DB encrypted at rest (Postgres TDE optional) |
| PII (transcript chứa tên/SĐT học viên) | Truncate log sau 90 ngày; không gửi PII trong prompt context |
| OpenAI data policy | API endpoints **không** dùng data để train (Mar 2023 policy). Có ghi rõ trong T&C của MLS |
| Audit | `AiUsageLogs` lưu user/tenant/cost/timestamp |
| Quyền truy cập dashboard cost | Chỉ role Admin |

---

## 12. CÁC QUYẾT ĐỊNH CẦN KH/PO PHÊ DUYỆT

| # | Hạng mục | Đề xuất | KH chọn |
|---|---|---|---|
| Q1 | Provider | OpenAI (vs Azure OpenAI vs Anthropic) | ☐ OK / ☐ Đổi: _____ |
| Q2 | Model chính giai đoạn pilot | gpt-4o cho cả Speaking + Writing | ☐ OK / ☐ Đổi: _____ |
| Q3 | Model giai đoạn scale | Tier hóa theo `ExamModeTag` | ☐ OK / ☐ Toàn bộ 4o / ☐ Toàn bộ mini |
| Q4 | Hard cap budget tháng | $200 pilot → $500 production | ☐ OK / ☐ Đổi: _____ |
| Q5 | Rate limit/user/ngày | 60 Speaking + 20 Writing | ☐ OK / ☐ Đổi: _____ |
| Q6 | Pattern upload | Per-question streaming (giữ nguyên hiện có) | ☐ OK / ☐ Batch end-of-session |
| Q7 | Tự host LanguageTool grammar | Bỏ — dùng GPT-4o thay thế | ☐ OK / ☐ Vẫn tự host |
| Q8 | Lưu transcript lâu dài | 90 ngày, sau đó truncate | ☐ OK / ☐ Đổi: ___ ngày |
| Q9 | Ngôn ngữ feedback | Tiếng Việt mặc định, có toggle EN cho học viên Hàn | ☐ OK / ☐ Đổi: _____ |
| Q10 | Timeline triển khai | 3 sprint × 1 tuần (3 tuần) | ☐ OK / ☐ Đổi: _____ |

---

## 13. PHỤ LỤC

### 13.1. Tham chiếu tài liệu

- [PROJECT_PROGRESS.md](PROJECT_PROGRESS.md) §III Phase 3 — AI Service audit
- [phase3_quiz_design_advanced.md](phase3_quiz_design_advanced(opic%20+%20vstep).md) — rubric OPIC/VSTEP
- [PHU_LUC_YEU_CAU_CHUC_NANG.md](PHU_LUC_YEU_CAU_CHUC_NANG.md) — AI-01, AI-02, AI-03, AI-04
- OpenAI Pricing: https://openai.com/api/pricing/
- OpenAI Data Policy: https://openai.com/policies/api-data-usage-policies

### 13.2. Glossary

| Thuật ngữ | Giải thích |
|---|---|
| **Whisper** | Mô hình Speech-to-Text của OpenAI |
| **GPT-4o / 4o-mini** | LLM đa năng dùng cho chấm điểm + sinh feedback |
| **ExamModeTag** | Tag gắn cho mỗi câu hỏi (opic_describe, vstep_part2,...) quyết định rubric weight |
| **Token** | Đơn vị tính phí GPT (~0.75 từ tiếng Anh = 1 token) |
| **Band** | Mức năng lực: OPIC (NH/IL/IM1-3/IH/AL) hoặc VSTEP (A2/B1/B2/C1) |
| **CEFR** | Khung tham chiếu năng lực ngoại ngữ chung Châu Âu |
| **SemaphoreSlim** | Cơ chế giới hạn concurrency trong .NET |
| **Polly** | Library retry/circuit-breaker cho HTTP call |

### 13.3. File code sẽ thay đổi

| File | Thay đổi |
|---|---|
| `MLS.Infrastructure/Workers/SpeakingGradingWorker.cs` | Thay `MockGrade()` → gọi `IOpenAiService` |
| `MLS.Infrastructure/Workers/WritingGradingWorker.cs` | Tương tự |
| `MLS.Infrastructure/Ai/OpenAiService.cs` | **NEW** — implement |
| `MLS.Infrastructure/Ai/OpenAiSettings.cs` | **NEW** |
| `MLS.Infrastructure/Ai/Prompts/SpeakingPromptBuilder.cs` | **NEW** |
| `MLS.Infrastructure/Ai/Prompts/WritingPromptBuilder.cs` | **NEW** |
| `MLS.Infrastructure/Ai/AiRateLimiter.cs` | **NEW** (Redis) |
| `MLS.Application/Common/Interfaces/IOpenAiService.cs` | **NEW** |
| `MLS.Domain/Entities/AiUsageLog.cs` | **NEW** |
| `MLS.Infrastructure/Persistence/Configurations/AiUsageLogConfiguration.cs` | **NEW** |
| `MLS.Infrastructure/DependencyInjection.cs` | Đăng ký `IOpenAiService` + HttpClient + Polly |
| `MLS.API/appsettings.json` | Thêm section `"OpenAI"` + `"AiRateLimit"` |
| `MLS.API/Controllers/Admin/AiUsageController.cs` | **NEW** — endpoints cho dashboard |
| `frontend/src/app/admin/ai-usage/page.tsx` | **NEW** — dashboard cost |
| `deploy/ai-integration-migration.sql` | **NEW** — bảng `AiUsageLogs` + indexes |

---

**HẾT TÀI LIỆU — Chờ KH/PO ký duyệt mục §12 để bắt đầu Sprint AI-1.**
