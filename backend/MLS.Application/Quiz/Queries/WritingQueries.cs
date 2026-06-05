using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;

namespace MLS.Application.Quiz.Queries;

// ── Get Writing Status ────────────────────────────────────────────────────────

public record GetWritingStatusQuery(Guid SubmissionId, Guid UserId) : IRequest<WritingStatusDto?>;

public record WritingStatusDto(Guid SubmissionId, string Status, int WordCount, decimal? FinalScore);

public class GetWritingStatusHandler(IApplicationDbContext db)
    : IRequestHandler<GetWritingStatusQuery, WritingStatusDto?>
{
    public async Task<WritingStatusDto?> Handle(GetWritingStatusQuery q, CancellationToken ct)
    {
        var sub = await db.WritingSubmissions
            .FirstOrDefaultAsync(s => s.Id == q.SubmissionId && s.UserId == q.UserId, ct);

        return sub == null ? null
            : new WritingStatusDto(sub.Id, sub.GradingStatus.ToString(), sub.WordCount, sub.FinalScore);
    }
}

// ── Get Writing Result ────────────────────────────────────────────────────────

public record GetWritingResultQuery(Guid SubmissionId, Guid UserId) : IRequest<WritingResultDto?>;

public record WritingResultDto(
    Guid     SubmissionId,
    string   Status,
    int      WordCount,
    string?  TaskType,
    string?  EssayType,
    decimal? GrammarScore,
    decimal? VocabularyScore,
    decimal? CoherenceScore,
    decimal? TaskAchievementScore,
    decimal? FinalScore,
    string?  LlmFeedback,
    string?  GrammarErrors,
    string?  VocabularyAnalysis,
    DateTime? ProcessedAt);

public class GetWritingResultHandler(IApplicationDbContext db)
    : IRequestHandler<GetWritingResultQuery, WritingResultDto?>
{
    public async Task<WritingResultDto?> Handle(GetWritingResultQuery q, CancellationToken ct)
    {
        var sub = await db.WritingSubmissions
            .FirstOrDefaultAsync(s => s.Id == q.SubmissionId && s.UserId == q.UserId, ct);

        return sub == null ? null
            : new WritingResultDto(
                sub.Id,
                sub.GradingStatus.ToString(),
                sub.WordCount,
                sub.TaskType,
                sub.EssayType,
                sub.GrammarScore,
                sub.VocabularyScore,
                sub.CoherenceScore,
                sub.TaskAchievementScore,
                sub.FinalScore,
                sub.LlmFeedback,
                sub.GrammarErrors,
                sub.VocabularyAnalysis,
                sub.ProcessedAt);
    }
}
