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
/// Background worker that processes SpeakingSubmissions.
/// Dev mode: mocks AI scoring. Production: replace body with Whisper + GPT-4o calls.
/// Mode-aware: reads ExamModeTag to apply correct rubric weights.
/// </summary>
public class SpeakingGradingWorker : BackgroundService
{
    private readonly ISpeakingGradingQueue _queue;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IHubContext<QuizHub> _hubContext;
    private readonly ILogger<SpeakingGradingWorker> _logger;

    public SpeakingGradingWorker(
        ISpeakingGradingQueue queue,
        IServiceScopeFactory scopeFactory,
        IHubContext<QuizHub> hubContext,
        ILogger<SpeakingGradingWorker> logger)
    {
        _queue      = queue;
        _scopeFactory = scopeFactory;
        _hubContext = hubContext;
        _logger     = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("SpeakingGradingWorker started.");

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

    private async Task ProcessAsync(SpeakingGradingRequest req, CancellationToken ct)
    {
        _logger.LogInformation("Grading speaking submission {Id} (mode: {Tag})", req.SubmissionId, req.ExamModeTag);

        using var scope = _scopeFactory.CreateScope();

        // Set tenant context BEFORE resolving IApplicationDbContext.
        // The DbContext factory embeds Search Path into the connection string at instantiation time;
        // if tenant is not resolved yet, it falls back to the public schema and FindAsync returns null.
        var tenantCtx = scope.ServiceProvider.GetRequiredService<TenantContext>();
        tenantCtx.SetTenant(req.TenantSlug);

        var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

        var submission = await db.SpeakingSubmissions
            .FindAsync([req.SubmissionId], cancellationToken: ct);

        if (submission is null)
        {
            _logger.LogWarning("SpeakingSubmission {Id} not found.", req.SubmissionId);
            return;
        }

        try
        {
            // Push "Processing" state to client
            submission.SetProcessing();
            await db.SaveChangesAsync(ct);
            await PushGradingProgress(req.UserId, req.SubmissionId, "Processing");

            // ── Simulate AI processing (2-3s) ────────────────────────────────
            // TODO: Replace with actual Whisper STT + phoneme analysis + GPT-4o
            await Task.Delay(TimeSpan.FromSeconds(2), ct);

            var (pronunciation, fluency, accuracy, coherence, vocab, task, transcript, feedback) =
                MockGrade(req.ExamModeTag);

            var finalScore = CalculateFinalScore(
                req.ExamModeTag, pronunciation, fluency, accuracy, coherence, vocab, task);

            submission.SetGraded(
                transcriptText:       transcript,
                pronunciationScore:   pronunciation,
                fluencyScore:         fluency,
                accuracyScore:        accuracy,
                finalScore:           finalScore,
                llmFeedback:          feedback,
                phonemeAnalysis:      null,
                coherenceScore:       coherence,
                vocabularyScore:      vocab,
                taskAchievementScore: task);

            await db.SaveChangesAsync(ct);

            // Push "Done" to client
            await PushGradingProgress(req.UserId, req.SubmissionId, "Done");

            _logger.LogInformation("Speaking submission {Id} graded. FinalScore={Score}", req.SubmissionId, finalScore);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to grade speaking submission {Id}.", req.SubmissionId);
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

    private static (decimal pronunciation, decimal fluency, decimal accuracy,
                    decimal? coherence, decimal? vocab, decimal? task,
                    string transcript, string feedback)
        MockGrade(string? examModeTag)
    {
        var rng = Random.Shared;

        decimal Rand(int min, int max) => rng.Next(min * 10, max * 10 + 1) / 10m;

        var pronunciation = Rand(65, 90);
        var fluency       = Rand(60, 88);
        var accuracy      = Rand(62, 88);

        decimal? coherence = null, vocab = null, task = null;

        if (examModeTag?.StartsWith("opic_") == true)
        {
            coherence = Rand(60, 88);
            vocab     = Rand(62, 86);
            task      = Rand(60, 85);
        }
        else if (examModeTag?.StartsWith("vstep_") == true)
        {
            vocab = Rand(60, 88);
            task  = Rand(62, 87);
        }

        var transcript = "[Transcript unavailable in development mode — Whisper not connected]";
        var feedback   = $"""
## AI Feedback (Development Mode)

> ⚠️ This is a simulated score. Connect Whisper + GPT-4o for real analysis.

### Điểm mạnh
- Bạn đã trả lời đúng trọng tâm câu hỏi.
- Giọng đọc tương đối rõ ràng.

### Cần cải thiện
- Tốc độ nói: cần điều chỉnh để tự nhiên hơn (mục tiêu 120–150 wpm).
- Phát âm một số từ khó cần luyện thêm.
- Sử dụng connector words nhiều hơn để tăng coherence.

### Gợi ý luyện tập
1. Luyện đọc to 15 phút/ngày với các bài đọc chuẩn.
2. Ghi âm lại và nghe để tự nhận xét.
3. Thực hành shadow speaking với podcast tiếng Anh.
""";

        return (pronunciation, fluency, accuracy, coherence, vocab, task, transcript, feedback);
    }

    private static decimal CalculateFinalScore(
        string? examModeTag,
        decimal pronunciation, decimal fluency, decimal accuracy,
        decimal? coherence, decimal? vocab, decimal? task)
    {
        return examModeTag switch
        {
            string t when t.StartsWith("opic_describe") =>
                0.30m * pronunciation + 0.25m * fluency + 0.20m * (coherence ?? 70) + 0.15m * (vocab ?? 70) + 0.10m * (task ?? 70),
            string t when t.StartsWith("opic_roleplay") =>
                0.20m * pronunciation + 0.20m * fluency + 0.20m * (coherence ?? 70) + 0.20m * (vocab ?? 70) + 0.20m * (task ?? 70),
            string t when t.StartsWith("vstep_p1") =>
                0.20m * pronunciation + 0.30m * fluency + 0.25m * (vocab ?? 70) + 0.25m * (task ?? 70),
            _ =>
                0.40m * pronunciation + 0.30m * fluency + 0.30m * accuracy
        };
    }
}
