using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Entities;

namespace MLS.Application.Quiz.Queries;

// ── Get Speaking Status ───────────────────────────────────────────────────────

public record GetSpeakingStatusQuery(Guid SubmissionId, Guid UserId) : IRequest<SpeakingStatusDto?>;

public record SpeakingStatusDto(Guid SubmissionId, string Status, decimal? FinalScore);

public class GetSpeakingStatusHandler(IApplicationDbContext db)
    : IRequestHandler<GetSpeakingStatusQuery, SpeakingStatusDto?>
{
    public async Task<SpeakingStatusDto?> Handle(GetSpeakingStatusQuery q, CancellationToken ct)
    {
        var sub = await db.SpeakingSubmissions
            .FirstOrDefaultAsync(s => s.Id == q.SubmissionId && s.UserId == q.UserId, ct);

        return sub == null ? null
            : new SpeakingStatusDto(sub.Id, sub.GradingStatus.ToString(), sub.FinalScore);
    }
}

// ── Get Speaking Result ───────────────────────────────────────────────────────

public record GetSpeakingResultQuery(Guid SubmissionId, Guid UserId) : IRequest<SpeakingResultDto?>;

public record SpeakingResultDto(
    Guid   SubmissionId,
    string Status,
    string? TranscriptText,
    decimal? PronunciationScore,
    decimal? FluencyScore,
    decimal? AccuracyScore,
    decimal? CoherenceScore,
    decimal? VocabularyScore,
    decimal? TaskAchievementScore,
    decimal? FinalScore,
    string? LlmFeedback,
    string? PhonemeAnalysis,
    string? AudioUrl,
    DateTime? ProcessedAt);

public class GetSpeakingResultHandler(IApplicationDbContext db)
    : IRequestHandler<GetSpeakingResultQuery, SpeakingResultDto?>
{
    public async Task<SpeakingResultDto?> Handle(GetSpeakingResultQuery q, CancellationToken ct)
    {
        var sub = await db.SpeakingSubmissions
            .FirstOrDefaultAsync(s => s.Id == q.SubmissionId && s.UserId == q.UserId, ct);

        return sub == null ? null
            : new SpeakingResultDto(
                sub.Id,
                sub.GradingStatus.ToString(),
                sub.TranscriptText,
                sub.PronunciationScore,
                sub.FluencyScore,
                sub.AccuracyScore,
                sub.CoherenceScore,
                sub.VocabularyScore,
                sub.TaskAchievementScore,
                sub.FinalScore,
                sub.LlmFeedback,
                sub.PhonemeAnalysis,
                sub.AudioUrl,
                sub.ProcessedAt);
    }
}
