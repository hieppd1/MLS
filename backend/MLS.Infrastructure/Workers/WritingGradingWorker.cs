using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Entities;
using MLS.Infrastructure.Hubs;
using MLS.Infrastructure.MultiTenancy;

namespace MLS.Infrastructure.Workers;

/// <summary>
/// Background worker that processes WritingSubmissions.
/// Dev mode: mocks AI scoring. Production: replace body with LanguageTool + GPT-4o calls.
/// Mode-aware: reads TaskType / EssayType to apply VSTEP rubric weights.
/// </summary>
public class WritingGradingWorker : BackgroundService
{
    private readonly IWritingGradingQueue _queue;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IHubContext<QuizHub> _hubContext;
    private readonly ILogger<WritingGradingWorker> _logger;

    public WritingGradingWorker(
        IWritingGradingQueue queue,
        IServiceScopeFactory scopeFactory,
        IHubContext<QuizHub> hubContext,
        ILogger<WritingGradingWorker> logger)
    {
        _queue      = queue;
        _scopeFactory = scopeFactory;
        _hubContext = hubContext;
        _logger     = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("WritingGradingWorker started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            if (_queue.TryDequeue(out var request) && request is not null)
            {
                _ = Task.Run(() => ProcessAsync(request, stoppingToken), stoppingToken);
            }
            else
            {
                await Task.Delay(500, stoppingToken);
            }
        }
    }

    private async Task ProcessAsync(WritingGradingRequest req, CancellationToken ct)
    {
        _logger.LogInformation("Grading writing submission {Id} (task: {Task}, mode: {Mode})",
            req.SubmissionId, req.TaskType, req.ExamModeTag);

        using var scope = _scopeFactory.CreateScope();

        // Set tenant context BEFORE resolving IApplicationDbContext.
        // The DbContext factory embeds Search Path into the connection string at instantiation time;
        // if tenant is not resolved yet, it falls back to the public schema and FindAsync returns null.
        var tenantCtx = scope.ServiceProvider.GetRequiredService<TenantContext>();
        tenantCtx.SetTenant(req.TenantSlug);

        var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

        var submission = await db.WritingSubmissions
            .FindAsync([req.SubmissionId], cancellationToken: ct);

        if (submission is null)
        {
            _logger.LogWarning("WritingSubmission {Id} not found.", req.SubmissionId);
            return;
        }

        try
        {
            // Push "Processing" state to client
            submission.SetProcessing();
            await db.SaveChangesAsync(ct);
            await PushGradingProgress(req.UserId, req.SubmissionId, "Processing");

            // ── Simulate AI processing (2-3s) ────────────────────────────────
            // TODO: Replace with LanguageTool REST API + GPT-4o rubric calls
            await Task.Delay(TimeSpan.FromSeconds(2), ct);

            var (grammar, vocabulary, coherence, task, grammarErrors, vocabAnalysis, feedback) =
                MockGrade(req.EssayText, req.WordCount, req.TaskType, req.EssayType);

            var finalScore = CalculateFinalScore(req.TaskType, grammar, vocabulary, coherence, task);

            submission.SetGraded(
                grammarScore:          grammar,
                vocabularyScore:       vocabulary,
                coherenceScore:        coherence,
                taskAchievementScore:  task,
                finalScore:            finalScore,
                llmFeedback:           feedback,
                grammarErrors:         grammarErrors,
                vocabularyAnalysis:    vocabAnalysis);

            await db.SaveChangesAsync(ct);

            // Push "Done" to client
            await PushGradingProgress(req.UserId, req.SubmissionId, "Done");

            _logger.LogInformation("Writing submission {Id} graded. FinalScore={Score}", req.SubmissionId, finalScore);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to grade writing submission {Id}.", req.SubmissionId);
            try
            {
                submission.SetFailed();
                await db.SaveChangesAsync(ct);
                await PushGradingProgress(req.UserId, req.SubmissionId, "Failed");
            }
            catch { /* swallow secondary failure */ }
        }
    }

    private async Task PushGradingProgress(Guid userId, Guid submissionId, string status)
    {
        try
        {
            await _hubContext.Clients
                .Group($"user_{userId}")
                .SendAsync("AiGradingProgress", new { submissionId, status });
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "SignalR push failed for user {UserId}.", userId);
        }
    }

    // ── Mock scoring (replace with real AI pipeline) ──────────────────────────

    private static (decimal grammar, decimal vocabulary, decimal coherence, decimal task,
                    string grammarErrors, string vocabAnalysis, string feedback)
        MockGrade(string essayText, int wordCount, string? taskType, string? essayType)
    {
        var rng = Random.Shared;
        decimal Rand(int min, int max) => rng.Next(min * 10, max * 10 + 1) / 10m;

        var grammar    = Rand(65, 92);
        var vocabulary = Rand(62, 90);
        var coherence  = Rand(60, 88);
        var task       = Rand(62, 90);

        var grammarErrors = """[{"message":"Consider a comma here","offset":45,"length":5,"replacements":["however,"]}]""";

        var cefrDist = taskType == "essay_vstep"
            ? """{"cefrLevel":"B2","lexicalDiversity":0.68,"distribution":{"A1":5,"A2":15,"B1":30,"B2":35,"C1":15}}"""
            : """{"cefrLevel":"B1","lexicalDiversity":0.62,"distribution":{"A1":10,"A2":20,"B1":40,"B2":25,"C1":5}}""";

        var modeLabel = taskType switch
        {
            "letter"      => "VSTEP Task 1 — Letter",
            "essay_vstep" => $"VSTEP Task 2 — {essayType ?? "Essay"}",
            _             => "Standard Essay"
        };

        var feedback = $"""
## AI Writing Feedback — {modeLabel}
> ⚠️ Development mode: simulated scores. Connect LanguageTool + GPT-4o for real analysis.

### Điểm mạnh
- Cấu trúc bài viết rõ ràng với mở bài, thân bài, kết luận.
- Sử dụng đa dạng từ nối ({(taskType == "essay_vstep" ? "furthermore, however, in contrast" : "first, then, finally")}).
- Từ vựng ở mức {(taskType == "essay_vstep" ? "B2" : "B1")}, phù hợp với bài thi.

### Cần cải thiện
- **Ngữ pháp**: Kiểm tra lại cấu trúc câu phức và thì của động từ.
- **Mạch lạc**: Một số đoạn chuyển tiếp chưa mượt mà, cần thêm linking words.
- **Từ vựng**: Tránh lặp từ, thay bằng các synonym phù hợp.

### Phân tích chi tiết
- **Số từ**: {wordCount} từ ✅
- **Cấp độ từ vựng**: CEFR {(taskType == "essay_vstep" ? "B2" : "B1")}
- **Mật độ từ học thuật**: {(taskType == "essay_vstep" ? "tốt" : "trung bình")}

### Gợi ý cải thiện
1. Luyện viết 1 bài/ngày với chủ đề khác nhau (15–20 phút).
2. Đọc sample essays IELTS/VSTEP để học cách diễn đạt.
3. Dùng các connector: *As a result, In contrast, It is worth noting that, ...*
""";

        return (grammar, vocabulary, coherence, task, grammarErrors, cefrDist, feedback);
    }

    private static decimal CalculateFinalScore(
        string? taskType,
        decimal grammar, decimal vocabulary, decimal coherence, decimal task)
    {
        return taskType switch
        {
            "letter"      => 0.30m * grammar + 0.30m * vocabulary + 0.40m * task,  // VSTEP T1: Task Fulfillment 40%
            "essay_vstep" => 0.25m * grammar + 0.25m * vocabulary + 0.25m * coherence + 0.25m * task, // VSTEP T2
            _             => 0.25m * grammar + 0.25m * vocabulary + 0.25m * coherence + 0.25m * task  // Standard
        };
    }
}
