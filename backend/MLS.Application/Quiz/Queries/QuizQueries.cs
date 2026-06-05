using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Domain.Entities;

namespace MLS.Application.Quiz.Queries;

// ── DTOs ──────────────────────────────────────────────────────────────────────

public record QuizListItemDto(
    Guid Id, string Title, string QuizType, string SkillType,
    string Status, string ExamMode, int Level, int? Duration,
    decimal TotalScore, decimal PassingScore, int QuestionCount,
    DateTime CreatedAt, Guid? CourseId, Guid? SessionId);

public record QuizDetailDto(
    Guid Id, string Title, string? Description, string QuizType, string SkillType,
    string Status, string ExamMode, int Level, int? Duration, decimal TotalScore, decimal PassingScore,
    bool AllowRetry, int? RetryLimit, bool RandomQuestion, bool RandomAnswer,
    bool ShowCorrectAnswer, bool ShowExplanation,
    Guid? CourseId, Guid? SessionId, int? VideoTriggerSecond,
    DateTime CreatedAt, List<QuizQuestionDto> Questions);

public record QuizQuestionDto(
    Guid LinkId, Guid QuestionId, string Content, string Type, string SkillType,
    string Difficulty, int DisplayOrder, decimal Score,
    string? AudioUrl, string? ImageUrl, string? VideoUrl,
    List<QuizOptionDto> Options,
    int? SpeakingTimeLimitSec = null,
    string? ReferenceText = null,
    string? ExamModeTag = null);

public record QuizOptionDto(
    Guid Id, string Content, bool IsCorrect, int DisplayOrder,
    string? MatchKey, string? MatchValue);

public record QuizAnalyticsDto(
    Guid QuizId, string Title, int TotalAttempts, int CompletedAttempts,
    decimal AverageScore, decimal PassRate, double AverageTimeSec);

// ── Get Quiz List ─────────────────────────────────────────────────────────────

public record GetQuizListQuery(
    int Page = 1, int PageSize = 20,
    string? Status   = null,
    string? QuizType = null,
    string? Skill    = null,
    string? ExamMode = null,
    Guid? CourseId   = null,
    Guid? CreatedBy  = null
) : IRequest<PagedResult<QuizListItemDto>>;

public record PagedResult<T>(List<T> Items, int Total, int Page, int PageSize);

public class GetQuizListHandler(IApplicationDbContext db)
    : IRequestHandler<GetQuizListQuery, PagedResult<QuizListItemDto>>
{
    public async Task<PagedResult<QuizListItemDto>> Handle(GetQuizListQuery q, CancellationToken ct)
    {
        var query = db.Quizzes.AsNoTracking();

        if (q.Status   != null && Enum.TryParse<QuizStatus>(q.Status, out var st))   query = query.Where(x => x.Status == st);
        if (q.QuizType != null && Enum.TryParse<QuizType>(q.QuizType, out var qt))   query = query.Where(x => x.QuizType == qt);
        if (q.Skill    != null && Enum.TryParse<SkillType>(q.Skill, out var sk))     query = query.Where(x => x.SkillType == sk);
        if (q.ExamMode != null && Enum.TryParse<ExamMode>(q.ExamMode, out var em))   query = query.Where(x => x.ExamMode == em);
        if (q.CourseId != null)  query = query.Where(x => x.CourseId == q.CourseId);
        if (q.CreatedBy != null) query = query.Where(x => x.CreatedBy == q.CreatedBy);

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(x => x.CreatedAt)
            .Skip((q.Page - 1) * q.PageSize)
            .Take(q.PageSize)
            .Select(x => new QuizListItemDto(
                x.Id, x.Title, x.QuizType.ToString(), x.SkillType.ToString(),
                x.Status.ToString(), x.ExamMode.ToString(), x.Level, x.Duration,
                x.TotalScore, x.PassingScore,
                x.Questions.Count, x.CreatedAt, x.CourseId, x.SessionId))
            .ToListAsync(ct);

        return new PagedResult<QuizListItemDto>(items, total, q.Page, q.PageSize);
    }
}

// ── Get Quiz Detail ───────────────────────────────────────────────────────────

public record GetQuizDetailQuery(Guid QuizId) : IRequest<QuizDetailDto?>;

public class GetQuizDetailHandler(IApplicationDbContext db)
    : IRequestHandler<GetQuizDetailQuery, QuizDetailDto?>
{
    public async Task<QuizDetailDto?> Handle(GetQuizDetailQuery q, CancellationToken ct)
    {
        var quiz = await db.Quizzes
            .AsNoTracking()
            .Include(x => x.Questions.OrderBy(qq => qq.DisplayOrder))
                .ThenInclude(qq => qq.Question)
                    .ThenInclude(q2 => q2.Options.OrderBy(o => o.DisplayOrder))
            .FirstOrDefaultAsync(x => x.Id == q.QuizId, ct);

        if (quiz == null) return null;

        return MapToDetail(quiz);
    }

    internal static QuizDetailDto MapToDetail(Domain.Entities.Quiz quiz) =>
        new(quiz.Id, quiz.Title, null, quiz.QuizType.ToString(), quiz.SkillType.ToString(),
            quiz.Status.ToString(), quiz.ExamMode.ToString(), quiz.Level, quiz.Duration,
            quiz.TotalScore, quiz.PassingScore,
            quiz.AllowRetry, quiz.RetryLimit, quiz.RandomQuestion, quiz.RandomAnswer,
            quiz.ShowCorrectAnswer, quiz.ShowExplanation,
            quiz.CourseId, quiz.SessionId, quiz.VideoTriggerSecond,
            quiz.CreatedAt,
            quiz.Questions.Select(qq => new QuizQuestionDto(
                qq.Id, qq.QuestionId,
                qq.Question.Content, qq.Question.Type.ToString(), qq.Question.SkillType.ToString(),
                qq.Question.Difficulty.ToString(), qq.DisplayOrder, qq.Score,
                qq.Question.AudioUrl, qq.Question.ImageUrl, qq.Question.VideoUrl,
                qq.Question.Options.Select(o => new QuizOptionDto(
                    o.Id, o.Content, o.IsCorrect, o.DisplayOrder, o.MatchKey, o.MatchValue
                )).ToList(),
                qq.Question.SpeakingTimeLimitSec,
                qq.Question.ReferenceText,
                qq.Question.ExamModeTag
            )).ToList());
}

// ── Get Quiz Preview (no answers) ─────────────────────────────────────────────

public record GetQuizPreviewQuery(Guid QuizId) : IRequest<QuizDetailDto?>;

public class GetQuizPreviewHandler(IApplicationDbContext db)
    : IRequestHandler<GetQuizPreviewQuery, QuizDetailDto?>
{
    public async Task<QuizDetailDto?> Handle(GetQuizPreviewQuery q, CancellationToken ct)
    {
        var quiz = await db.Quizzes
            .AsNoTracking()
            .Include(x => x.Questions.OrderBy(qq => qq.DisplayOrder))
                .ThenInclude(qq => qq.Question)
                    .ThenInclude(q2 => q2.Options.OrderBy(o => o.DisplayOrder))
            .FirstOrDefaultAsync(x => x.Id == q.QuizId, ct);

        if (quiz == null) return null;

        var dto = GetQuizDetailHandler.MapToDetail(quiz);
        // Strip correct answers for learner preview
        var sanitised = dto with
        {
            Questions = dto.Questions.Select(qq => qq with
            {
                Options = qq.Options.Select(o => o with { IsCorrect = false }).ToList()
            }).ToList()
        };
        return sanitised;
    }
}

// ── Get Quiz Analytics ─────────────────────────────────────────────────────────

public record GetQuizAnalyticsQuery(Guid QuizId) : IRequest<QuizAnalyticsDto?>;

public class GetQuizAnalyticsHandler(IApplicationDbContext db)
    : IRequestHandler<GetQuizAnalyticsQuery, QuizAnalyticsDto?>
{
    public async Task<QuizAnalyticsDto?> Handle(GetQuizAnalyticsQuery q, CancellationToken ct)
    {
        var quiz = await db.Quizzes.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == q.QuizId, ct);
        if (quiz == null) return null;

        var attempts = await db.QuizAttempts
            .AsNoTracking()
            .Where(a => a.QuizId == q.QuizId)
            .ToListAsync(ct);

        var completed = attempts.Where(a => a.State == AttemptState.Graded).ToList();

        return new QuizAnalyticsDto(
            quiz.Id, quiz.Title,
            TotalAttempts:     attempts.Count,
            CompletedAttempts: completed.Count,
            AverageScore:      completed.Count > 0 ? Math.Round(completed.Average(a => a.Score ?? 0m), 2) : 0m,
            PassRate:          completed.Count > 0 ? Math.Round((decimal)completed.Count(a => a.Passed) / completed.Count * 100m, 1) : 0m,
            AverageTimeSec:    completed.Count > 0 ? completed.Average(a => a.TimeTaken ?? 0) : 0
        );
    }
}

// ── Get Video Quiz for Session ────────────────────────────────────────────────

public record VideoQuizInfoDto(Guid Id, string Title, int VideoTriggerSecond);

public record GetVideoQuizBySessionQuery(Guid SessionId) : IRequest<VideoQuizInfoDto?>;

public class GetVideoQuizBySessionHandler(IApplicationDbContext db)
    : IRequestHandler<GetVideoQuizBySessionQuery, VideoQuizInfoDto?>
{
    public async Task<VideoQuizInfoDto?> Handle(GetVideoQuizBySessionQuery q, CancellationToken ct)
    {
        var quiz = await db.Quizzes
            .AsNoTracking()
            .Where(x => x.SessionId == q.SessionId
                && x.VideoTriggerSecond != null
                && x.Status == QuizStatus.Published)
            .OrderBy(x => x.VideoTriggerSecond)
            .Select(x => new VideoQuizInfoDto(x.Id, x.Title, x.VideoTriggerSecond!.Value))
            .FirstOrDefaultAsync(ct);
        return quiz;
    }
}
