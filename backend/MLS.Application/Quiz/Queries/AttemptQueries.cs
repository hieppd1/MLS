using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Entities;

namespace MLS.Application.Quiz.Queries;

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record AttemptResultDto(
    Guid AttemptId, Guid QuizId, string QuizTitle,
    string State, decimal? Score, decimal? Percentage,
    bool Passed, int AttemptNumber, int? TimeTaken,
    DateTime StartedAt, DateTime? SubmittedAt,
    List<AttemptAnswerReviewDto>? Answers);

public record AttemptAnswerReviewDto(
    Guid QuestionId, string QuestionContent, string QuestionType,
    string? AnswerValue, string? EssayText, string? AudioUrl,
    bool? IsCorrect, decimal? Score, decimal? AiScore, string? AiFeedback,
    bool IsSkipped, List<OptionReviewDto> Options);

public record OptionReviewDto(Guid Id, string Content, bool IsCorrect, int DisplayOrder);

public record AttemptSummaryDto(
    Guid Id, Guid QuizId, string QuizTitle,
    string State, decimal? Score, decimal? Percentage,
    bool Passed, int AttemptNumber, DateTime StartedAt, DateTime? SubmittedAt);

// ── Get Attempt Result ────────────────────────────────────────────────────────

public record GetAttemptResultQuery(Guid AttemptId, Guid UserId) : IRequest<AttemptResultDto?>;

public class GetAttemptResultHandler(IApplicationDbContext db)
    : IRequestHandler<GetAttemptResultQuery, AttemptResultDto?>
{
    public async Task<AttemptResultDto?> Handle(GetAttemptResultQuery q, CancellationToken ct)
    {
        var attempt = await db.QuizAttempts
            .AsNoTracking()
            .Include(a => a.Answers)
            .FirstOrDefaultAsync(a => a.Id == q.AttemptId, ct);

        if (attempt == null || attempt.UserId != q.UserId) return null;

        var quiz = await db.Quizzes.AsNoTracking()
            .Include(qz => qz.Questions.OrderBy(qq => qq.DisplayOrder))
                .ThenInclude(qq => qq.Question)
                    .ThenInclude(qs => qs.Options.OrderBy(o => o.DisplayOrder))
            .FirstOrDefaultAsync(qz => qz.Id == attempt.QuizId, ct);

        if (quiz == null) return null;

        List<AttemptAnswerReviewDto>? reviewDtos = null;

        if (attempt.State == AttemptState.Graded && quiz.ShowCorrectAnswer)
        {
            reviewDtos = quiz.Questions.Select(qq =>
            {
                var q2  = qq.Question;
                var ans = attempt.Answers.FirstOrDefault(a => a.QuestionId == q2.Id);
                return new AttemptAnswerReviewDto(
                    q2.Id, q2.Content, q2.Type.ToString(),
                    ans?.AnswerValue, ans?.EssayText, ans?.AudioUrl,
                    ans?.IsCorrect, ans?.Score, ans?.AiScore, ans?.AiFeedback,
                    ans?.IsSkipped ?? true,
                    q2.Options.Select(o => new OptionReviewDto(o.Id, o.Content, o.IsCorrect, o.DisplayOrder)).ToList());
            }).ToList();
        }

        return new AttemptResultDto(
            attempt.Id, attempt.QuizId, quiz.Title,
            attempt.State.ToString(), attempt.Score, attempt.Percentage,
            attempt.Passed, attempt.AttemptNumber, attempt.TimeTaken,
            attempt.StartedAt, attempt.SubmittedAt, reviewDtos);
    }
}

// ── Get My Attempts ───────────────────────────────────────────────────────────

public record GetMyAttemptsQuery(Guid QuizId, Guid UserId) : IRequest<List<AttemptSummaryDto>>;

public class GetMyAttemptsHandler(IApplicationDbContext db)
    : IRequestHandler<GetMyAttemptsQuery, List<AttemptSummaryDto>>
{
    public async Task<List<AttemptSummaryDto>> Handle(GetMyAttemptsQuery q, CancellationToken ct)
    {
        var quiz = await db.Quizzes.AsNoTracking()
            .Select(x => new { x.Id, x.Title })
            .FirstOrDefaultAsync(x => x.Id == q.QuizId, ct);

        if (quiz == null) return [];

        return await db.QuizAttempts
            .AsNoTracking()
            .Where(a => a.QuizId == q.QuizId && a.UserId == q.UserId)
            .OrderByDescending(a => a.StartedAt)
            .Select(a => new AttemptSummaryDto(
                a.Id, a.QuizId, quiz.Title,
                a.State.ToString(), a.Score, a.Percentage,
                a.Passed, a.AttemptNumber, a.StartedAt, a.SubmittedAt))
            .ToListAsync(ct);
    }
}
