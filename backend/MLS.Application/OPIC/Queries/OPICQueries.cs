using MediatR;
using Microsoft.EntityFrameworkCore;
using MLS.Application.Common.Interfaces;
using MLS.Application.OPIC.Commands;
using MLS.Domain.Entities;

namespace MLS.Application.OPIC.Queries;

// ── Get my survey ─────────────────────────────────────────────────────────────

public record GetMySurveyQuery(Guid UserId, string Language = "vi")
    : IRequest<OPICTopicSurveyDto?>;

public class GetMySurveyHandler(IApplicationDbContext db)
    : IRequestHandler<GetMySurveyQuery, OPICTopicSurveyDto?>
{
    public Task<OPICTopicSurveyDto?> Handle(GetMySurveyQuery q, CancellationToken ct)
    {
        var survey = db.OPICTopicSurveys
            .Where(s => s.UserId == q.UserId && s.Language == q.Language)
            .OrderByDescending(s => s.CreatedAt)
            .FirstOrDefault();

        if (survey is null) return Task.FromResult<OPICTopicSurveyDto?>(null);

        return Task.FromResult<OPICTopicSurveyDto?>(new OPICTopicSurveyDto(
            survey.Id, survey.Language,
            System.Text.Json.JsonSerializer.Deserialize<string[]>(survey.SelectedTopics) ?? [],
            survey.TargetLevel, survey.ChosenDifficulty, survey.CreatedAt));
    }
}

// ── Get session detail ────────────────────────────────────────────────────────

public record GetSessionQuery(Guid SessionId, Guid UserId) : IRequest<OPICSessionDetailDto?>;

public class GetSessionHandler(IApplicationDbContext db)
    : IRequestHandler<GetSessionQuery, OPICSessionDetailDto?>
{
    public Task<OPICSessionDetailDto?> Handle(GetSessionQuery q, CancellationToken ct)
    {
        var session = db.OPICSessions
            .Include(s => s.Combos)
            .Include(s => s.AttemptRefs)
            .FirstOrDefault(s => s.Id == q.SessionId && s.UserId == q.UserId);

        if (session is null) return Task.FromResult<OPICSessionDetailDto?>(null);

        var combos = session.Combos
            .OrderBy(c => c.ComboIndex)
            .Select(c => new OPICComboGroupDto(
                c.Id, c.ComboIndex, c.TopicCategory, c.TopicType,
                System.Text.Json.JsonSerializer.Deserialize<Guid[]>(c.ComboQuestions) ?? []))
            .ToArray();

        var refs = session.AttemptRefs
            .OrderBy(r => r.QuestionIndex)
            .Select(r => new OPICAttemptRefDto(r.AttemptId, r.QuestionIndex))
            .ToArray();

        return Task.FromResult<OPICSessionDetailDto?>(new OPICSessionDetailDto(
            session.Id, session.Language, session.SessionState,
            session.ChosenDifficulty, session.MidAdjustChoice, session.FinalDifficulty,
            session.OPICLevelResult, session.OverallScore, session.IsCompleted,
            session.StartedAt, session.CompletedAt, combos, refs, session.QuizId));
    }
}

// ── List my sessions ──────────────────────────────────────────────────────────

public record ListMySessionsQuery(Guid UserId, int Page = 1, int PageSize = 10)
    : IRequest<OPICSessionDto[]>;

public class ListMySessionsHandler(IApplicationDbContext db)
    : IRequestHandler<ListMySessionsQuery, OPICSessionDto[]>
{
    public Task<OPICSessionDto[]> Handle(ListMySessionsQuery q, CancellationToken ct)
    {
        var sessions = db.OPICSessions
            .Where(s => s.UserId == q.UserId)
            .OrderByDescending(s => s.StartedAt)
            .Skip((q.Page - 1) * q.PageSize)
            .Take(q.PageSize)
            .ToList();

        var sessionIds = sessions.Select(s => s.Id).ToList();
        var refCounts = db.OPICAttemptRefs
            .Where(r => sessionIds.Contains(r.SessionId))
            .GroupBy(r => r.SessionId)
            .Select(g => new { g.Key, Count = g.Count() })
            .ToDictionary(x => x.Key, x => x.Count);

        return Task.FromResult(sessions
            .Select(s => Commands.CreateSessionHandler.ToDto(s, refCounts.GetValueOrDefault(s.Id, 0)))
            .ToArray());
    }
}

// ── Get my latest OPIC result ─────────────────────────────────────────────────

public record GetMyLatestResultQuery(Guid UserId, string Language = "vi")
    : IRequest<OPICLevelResultDto?>;

public class GetMyLatestResultHandler(IApplicationDbContext db)
    : IRequestHandler<GetMyLatestResultQuery, OPICLevelResultDto?>
{
    public Task<OPICLevelResultDto?> Handle(GetMyLatestResultQuery q, CancellationToken ct)
    {
        var result = db.OPICLevelResults
            .Where(r => r.UserId == q.UserId && r.Language == q.Language)
            .OrderByDescending(r => r.TestedAt)
            .FirstOrDefault();

        if (result is null) return Task.FromResult<OPICLevelResultDto?>(null);
        return Task.FromResult<OPICLevelResultDto?>(FinalizeSessionHandler.ToDto(result));
    }
}

// ── Get result by session ─────────────────────────────────────────────────────

public record GetSessionResultQuery(Guid SessionId, Guid UserId) : IRequest<OPICLevelResultDto?>;

public class GetSessionResultHandler(IApplicationDbContext db)
    : IRequestHandler<GetSessionResultQuery, OPICLevelResultDto?>
{
    public Task<OPICLevelResultDto?> Handle(GetSessionResultQuery q, CancellationToken ct)
    {
        var session = db.OPICSessions.Find(q.SessionId);
        if (session is null || session.UserId != q.UserId)
            return Task.FromResult<OPICLevelResultDto?>(null);

        var result = db.OPICLevelResults.FirstOrDefault(r => r.SessionId == q.SessionId);
        if (result is null) return Task.FromResult<OPICLevelResultDto?>(null);
        return Task.FromResult<OPICLevelResultDto?>(FinalizeSessionHandler.ToDto(result));
    }
}

// ── Get script templates (student / teacher) ──────────────────────────────────

public record GetScriptTemplatesQuery(
    string? TopicCategory = null,
    string? Language      = null,
    bool    PublishedOnly = true) : IRequest<OPICScriptTemplateDto[]>;

public class GetScriptTemplatesHandler(IApplicationDbContext db)
    : IRequestHandler<GetScriptTemplatesQuery, OPICScriptTemplateDto[]>
{
    public Task<OPICScriptTemplateDto[]> Handle(GetScriptTemplatesQuery q, CancellationToken ct)
    {
        var query = db.OPICScriptTemplates.AsQueryable();
        if (q.PublishedOnly) query = query.Where(t => t.IsPublished);
        if (q.TopicCategory is not null) query = query.Where(t => t.TopicCategory == q.TopicCategory);
        if (q.Language is not null) query = query.Where(t => t.Language == q.Language);

        return Task.FromResult(query
            .OrderBy(t => t.TopicCategory).ThenBy(t => t.ComboType)
            .Select(t => CreateScriptTemplateHandler.ToDto(t))
            .ToArray());
    }
}

// ── Get OPIC demo questions (for simulation / test) ───────────────────────────

public record OPICDemoQuestionDto(
    Guid    QuestionId,
    int     QuestionIndex,
    int     ComboIndex,
    string  TopicHint,
    string  Content,
    string  Type,
    string? AudioUrl,
    int     TimeLimitSec,
    int     PlayLimit);

public record OPICQuizSummaryDto(
    Guid   Id,
    string Title,
    string Language,
    int    QuestionCount,
    int?   DifficultyLevel);

public record GetPublishedOPICQuizzesQuery(string Language = "vi")
    : IRequest<OPICQuizSummaryDto[]>;

public class GetPublishedOPICQuizzesHandler(IApplicationDbContext db)
    : IRequestHandler<GetPublishedOPICQuizzesQuery, OPICQuizSummaryDto[]>
{
    public Task<OPICQuizSummaryDto[]> Handle(GetPublishedOPICQuizzesQuery q, CancellationToken ct)
    {
        var quizzes = db.Quizzes
            .AsNoTracking()
            .Where(qz => qz.QuizType == QuizType.OPICMockTest
                      && qz.Status   == QuizStatus.Published
                      && qz.Language == q.Language)
            .OrderByDescending(qz => qz.CreatedAt)
            .Select(qz => new
            {
                qz.Id,
                qz.Title,
                qz.Language,
                QuestionCount = db.QuizQuestions.Count(qq => qq.QuizId == qz.Id),
            })
            .ToList();

        return Task.FromResult(quizzes
            .Select(qz => new OPICQuizSummaryDto(qz.Id, qz.Title, qz.Language, qz.QuestionCount, null))
            .ToArray());
    }
}

public record GetOPICDemoQuestionsQuery(string Language = "vi", Guid? QuizId = null)
    : IRequest<OPICDemoQuestionDto[]>;

public class GetOPICDemoQuestionsHandler(IApplicationDbContext db)
    : IRequestHandler<GetOPICDemoQuestionsQuery, OPICDemoQuestionDto[]>
{
    private static readonly string[] TopicHints =
        ["Tự giới thiệu", "Sở thích & Hoạt động", "Du lịch & Kỳ nghỉ", "Công việc & Học tập", "Đóng vai"];

    public Task<OPICDemoQuestionDto[]> Handle(GetOPICDemoQuestionsQuery q, CancellationToken ct)
    {
        var quiz = q.QuizId.HasValue
            ? db.Quizzes.AsNoTracking().FirstOrDefault(qz => qz.Id == q.QuizId.Value
                  && qz.QuizType == QuizType.OPICMockTest
                  && qz.Status   == QuizStatus.Published)
            : db.Quizzes
                  .AsNoTracking()
                  .Where(qz => qz.QuizType == QuizType.OPICMockTest
                            && qz.Status   == QuizStatus.Published
                            && qz.Language == q.Language)
                  .OrderByDescending(qz => qz.CreatedAt)
                  .FirstOrDefault();

        if (quiz is null) return Task.FromResult(Array.Empty<OPICDemoQuestionDto>());

        var items = db.QuizQuestions
            .AsNoTracking()
            .Where(qq => qq.QuizId == quiz.Id)
            .Include(qq => qq.Question)
            .Where(qq => qq.Question != null && !qq.Question.IsDeleted)
            .OrderBy(qq => qq.DisplayOrder)
            .Take(15)
            .ToList();

        return Task.FromResult(items
            .Select((qq, i) =>
            {
                int comboIndex = i / 3;
                return new OPICDemoQuestionDto(
                    qq.QuestionId,
                    i + 1,
                    comboIndex + 1,
                    TopicHints[Math.Min(comboIndex, TopicHints.Length - 1)],
                    qq.Question!.Content,
                    qq.Question.Type.ToString(),
                    qq.Question.AudioUrl,
                    qq.Question.SpeakingTimeLimitSec ?? 120,
                    qq.Question.AudioPlayLimit ?? 2);
            })
            .ToArray());
    }
}
